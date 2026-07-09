import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type Role = 'CONSUMER' | 'VENDOR' | 'ADMIN';

// In-memory rate limiting for OTP
const otpRateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 mins
const MAX_OTP_PER_WINDOW = 3;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly jwt: JwtService,
    private readonly whatsapp: WhatsAppService,
  ) { }

  private hashCode(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }



  /** Build a deterministic UUID from a stable string (offline Google user id). */
  private uuidFrom(seed: string): string {
    const h = createHash('md5').update(seed).digest('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
  }

  /** Verify a Google ID token via Google's tokeninfo endpoint (no extra dep). */
  private async verifyGoogleToken(idToken: string): Promise<{ sub: string; email?: string; name?: string; aud?: string } | null> {
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const p = (await res.json()) as any;
      if (!p.sub) return null;
      if (p.exp && Number(p.exp) * 1000 < Date.now()) return null;
      return { sub: p.sub, email: p.email, name: p.name, aud: p.aud };
    } catch {
      return null;
    }
  }

  /** Google Sign-In: verify the ID token, upsert the user (or issue offline), and
   *  return an access token. Set GOOGLE_CLIENT_ID to enforce the audience. */
  async googleLogin(idToken: string, role: Role = 'CONSUMER') {
    const info = await this.verifyGoogleToken(idToken);
    if (!info) throw new UnauthorizedException('invalid Google token');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && info.aud && info.aud !== clientId) {
      throw new UnauthorizedException('Google token audience mismatch');
    }
    const name = info.name || info.email?.split('@')[0] || 'Google User';

    if (!this.db) {
      const userId = this.uuidFrom('google:' + info.sub);
      const accessToken = await this.jwt.signAsync({ sub: userId, role, full_name: name });
      this.logger.warn(`google-login (offline, no DB) ${info.email}`);
      return { accessToken, user: { user_id: userId, full_name: name, email: info.email, role }, offline: true };
    }

    const db = requireDb(this.db);
    let user: any = null;
    if (info.email) {
      const found = await db.from('users').select('*').eq('email', info.email).maybeSingle();
      user = found.data;
    }
    if (!user) {
      // phone_number is NOT NULL UNIQUE -synthesize a stable placeholder for SSO users.
      const placeholder = '+000' + BigInt('0x' + createHash('md5').update(info.sub).digest('hex').slice(0, 11)).toString().slice(0, 12);
      const ins = await db.from('users')
        .insert({ phone_number: placeholder, email: info.email ?? null, full_name: name, role })
        .select('*').single();
      if (ins.error) throw new BadRequestException(ins.error.message);
      user = ins.data;
    }
    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: user.role, full_name: user.full_name, phone_number: user.phone_number });
    return { accessToken, user };
  }

  /** Current authenticated user -backs GET /auth/me. */
  async me(userId: string) {
    const db = requireDb(this.db);
    const { data } = await db
      .from('users')
      .select('user_id, full_name, phone_number, role, plan_id, plan_expires_at, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    return data ?? null;
  }

  /** Password-gated admin login for the Command Center. The admin user is
   *  upserted; the password is checked against ADMIN_PASSWORD (env). */
  async adminLogin(password: string) {
    const expected = process.env.ADMIN_PASSWORD ?? 'FixIt Now-admin';
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

  /** Generate + "send" an OTP via WhatsApp. */
  async requestOtp(phoneNumber: string): Promise<{ sent: true }> {
    const db = requireDb(this.db);
    if (!/^\+?[0-9]{8,15}$/.test(phoneNumber)) {
      throw new BadRequestException('invalid phone number');
    }

    // Rate limiting
    const now = Date.now();
    const limitRecord = otpRateLimits.get(phoneNumber) || { count: 0, windowStart: now };
    if (now - limitRecord.windowStart > RATE_LIMIT_WINDOW) {
      limitRecord.count = 1;
      limitRecord.windowStart = now;
    } else {
      limitRecord.count++;
      if (limitRecord.count > MAX_OTP_PER_WINDOW) {
        throw new BadRequestException('Too many OTP requests. Try again in 5 minutes.');
      }
    }
    otpRateLimits.set(phoneNumber, limitRecord);

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error } = await db.from('otp_codes').insert({
      phone_number: phoneNumber,
      code_hash: this.hashCode(phoneNumber, code),
      purpose: 'LOGIN',
      expires_at: expiresAt,
    });
    if (error) throw new BadRequestException(error.message);

    // Try Twilio first if configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioPhone) {
      try {
        const client = twilio(twilioSid, twilioToken);
        await client.messages.create({
          body: `Your FixIt Now verification code is: ${code}`,
          from: twilioPhone,
          to: phoneNumber
        });
        this.logger.log(`OTP for ${phoneNumber} sent via Twilio SMS`);
        return { sent: true };
      } catch (err: any) {
        this.logger.error(`Twilio SMS failed: ${err.message}`);
        // Fallback to WhatsApp if Twilio fails
      }
    }

    const viaWhatsApp = await this.whatsapp.sendOtp(phoneNumber, code);
    if (!viaWhatsApp) {
      this.logger.warn(`WhatsApp delivery failed or disabled. OTP for ${phoneNumber} is: ${code}`);
    } else {
      this.logger.log(`OTP for ${phoneNumber}: ${code} sent via WhatsApp`);
    }

    return { sent: true };
  }

  /** Verify the latest OTP, upsert the user, and issue an access token. */
  async verifyOtp(phoneNumber: string, code: string, fullName?: string, role: Role = 'CONSUMER', referralCode?: string) {
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
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const insert = await db
        .from('users')
        .insert({ phone_number: phoneNumber, full_name: fullName ?? 'New User', role })
        .select('*')
        .single();
      if (insert.error) throw new BadRequestException(insert.error.message);
      user = insert.data;
    }

    if (isNewUser && referralCode) {
      try {
        // Find the referrer by code
        const cleanCode = referralCode.trim().toUpperCase();
        const { data: referrer } = await db.from('user_rewards').select('user_id').eq('referral_code', cleanCode).maybeSingle();
        if (referrer && referrer.user_id !== user.user_id) {
          await db.from('referrals').insert({
            referrer_id: referrer.user_id,
            referred_id: user.user_id,
            code: cleanCode
          });
        }
      } catch (e) {
        this.logger.warn(`Failed to process referral code during signup: ${e}`);
      }
    }

    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: user.role, full_name: user.full_name, phone_number: user.phone_number });
    return { accessToken, user };
  }

  /** Link a verified phone number to an existing user session (e.g. after Google SSO) */
  async linkOtp(userId: string, phoneNumber: string, code: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('otp_codes')
      .select('*').eq('phone_number', phoneNumber).eq('purpose', 'LOGIN')
      .order('created_at', { ascending: false }).limit(1).single();
    if (error || !data) throw new UnauthorizedException('no OTP requested');
    if (new Date(data.expires_at).getTime() < Date.now()) throw new UnauthorizedException('OTP expired');
    if (data.code_hash !== this.hashCode(phoneNumber, code)) throw new UnauthorizedException('incorrect code');

    // Update the user
    const { data: user, error: updateErr } = await db.from('users')
      .update({ phone_number: phoneNumber })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (updateErr) throw new BadRequestException('Phone number already in use or update failed');

    // Invalidate OTP
    await db.from('otp_codes').delete().eq('id', data.id);

    const accessToken = await this.jwt.signAsync({ sub: user.user_id, role: user.role, full_name: user.full_name, phone_number: user.phone_number });
    return { accessToken, user };
  }

  async getTrustedDevices(userId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('trusted_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async registerTrustedDevice(userId: string, deviceName: string, ipAddress: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('trusted_devices').insert({
      user_id: userId,
      device_name: deviceName,
      ip_address: ipAddress,
      last_active: new Date().toISOString()
    }).select('*').single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeTrustedDevice(userId: string, deviceId: string) {
    const db = requireDb(this.db);
    const { error } = await db.from('trusted_devices').delete().eq('user_id', userId).eq('device_id', deviceId);
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}
