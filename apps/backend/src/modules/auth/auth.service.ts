import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type Role = 'CONSUMER' | 'VENDOR' | 'ADMIN';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly jwt: JwtService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  private hashCode(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }

  /**
   * DEV ONLY: one-click login as a seeded persona (no OTP). Upserts the user so
   * it works even before seeds are applied. Gated to non-production unless
   * ALLOW_DEV_LOGIN=true. Lets you test all three apps instantly.
   */
  async devLogin(role: Role) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_LOGIN !== 'true') {
      throw new BadRequestException('dev login disabled');
    }
    const db = requireDb(this.db);
    const personas: Record<Role, { phone: string; name: string }> = {
      CONSUMER: { phone: '+96890000001', name: 'Aisha Al Lawati' },
      VENDOR: { phone: '+96890000002', name: 'Khalid Al Balushi' },
      ADMIN: { phone: '+96890000003', name: 'Ops Admin' },
    };
    const p = personas[role];

    const { data: user, error } = await db
      .from('users')
      .upsert({ phone_number: p.phone, full_name: p.name, role }, { onConflict: 'phone_number' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    if (role === 'VENDOR') {
      await db.from('vendor_profiles').upsert(
        {
          vendor_id: user.user_id,
          category_ids: ['AC', 'ELECTRICAL', 'PLUMBING'],
          verification_status: 'VERIFIED',
          subscription_status: 'ACTIVE',
          // Multi-staff shop → exempt from the single-job Busy lock (master_specs
          // Module 03/08), and reset Busy each dev login so the demo never wedges.
          staff_count: 2,
          is_busy: false,
          busy_job_id: null,
        },
        { onConflict: 'vendor_id' },
      ).then(() => undefined, () => undefined);
    }

    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: user.role });
    return { accessToken, user };
  }

  /** Password-gated admin login for the Command Center. The admin user is
   *  upserted; the password is checked against ADMIN_PASSWORD (env). */
  async adminLogin(password: string) {
    const expected = process.env.ADMIN_PASSWORD ?? 'fixit-admin';
    if (password !== expected) throw new UnauthorizedException('incorrect admin password');
    const db = requireDb(this.db);
    const { data: user, error } = await db
      .from('users')
      .upsert({ phone_number: '+96890000003', full_name: 'Ops Admin', role: 'ADMIN' }, { onConflict: 'phone_number' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: 'ADMIN' });
    return { accessToken, user };
  }

  /** Generate + "send" an OTP. In dev (no SMS provider) the code is logged. */
  async requestOtp(phoneNumber: string): Promise<{ sent: true; devCode?: string }> {
    const db = requireDb(this.db);
    if (!/^\+?[0-9]{8,15}$/.test(phoneNumber)) {
      throw new BadRequestException('invalid phone number');
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error } = await db.from('otp_codes').insert({
      phone_number: phoneNumber,
      code_hash: this.hashCode(phoneNumber, code),
      purpose: 'LOGIN',
      expires_at: expiresAt,
    });
    if (error) throw new BadRequestException(error.message);

    // Deliver via the owner's WhatsApp (no Twilio). Falls back to the dev code.
    const viaWhatsApp = await this.whatsapp.sendOtp(phoneNumber, code);
    this.logger.log(`OTP for ${phoneNumber}: ${code} (whatsapp=${viaWhatsApp})`);
    if (process.env.NODE_ENV === 'production') {
      return viaWhatsApp ? { sent: true } : { sent: true, devCode: code };
    }
    return { sent: true, devCode: code };
  }

  /** Verify the latest OTP, upsert the user, and issue an access token. */
  async verifyOtp(phoneNumber: string, code: string, fullName?: string, role: Role = 'CONSUMER') {
    const db = requireDb(this.db);
    const { data: otp, error } = await db
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!otp) throw new UnauthorizedException('no pending code; request a new one');
    if (otp.attempt_count >= MAX_ATTEMPTS) throw new UnauthorizedException('too many attempts');
    if (new Date(otp.expires_at).getTime() < Date.now()) throw new UnauthorizedException('code expired');

    if (otp.code_hash !== this.hashCode(phoneNumber, code)) {
      await db.from('otp_codes').update({ attempt_count: otp.attempt_count + 1 }).eq('otp_id', otp.otp_id);
      throw new UnauthorizedException('incorrect code');
    }
    await db.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('otp_id', otp.otp_id);

    // Find or create the user.
    let { data: user } = await db.from('users').select('*').eq('phone_number', phoneNumber).maybeSingle();
    if (!user) {
      const insert = await db
        .from('users')
        .insert({ phone_number: phoneNumber, full_name: fullName ?? 'New User', role })
        .select('*')
        .single();
      if (insert.error) throw new BadRequestException(insert.error.message);
      user = insert.data;
    }

    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: user.role });
    return { accessToken, user };
  }
}
