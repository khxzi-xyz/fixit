import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { AuthService, Role } from './auth.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

class RequestOtpDto {
  @Matches(/^\+?[0-9]{8,15}$/) phoneNumber!: string;
}

class VerifyOtpDto {
  @Matches(/^\+?[0-9]{8,15}$/) phoneNumber!: string;
  @IsString() @Length(6, 6) code!: string;
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsIn(['CONSUMER', 'VENDOR', 'ADMIN']) role?: Role;
}

class DevLoginDto {
  @IsIn(['CONSUMER', 'VENDOR', 'ADMIN']) role!: Role;
}

class AdminLoginDto {
  @IsString() password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /** Owner scans this QR once to link their WhatsApp for OTP/order delivery. */
  @Get('whatsapp/qr')
  async whatsappQr() {
    const qr = await this.whatsapp.qrDataUrl();
    return { ...this.whatsapp.status(), qr };
  }

  @Get('whatsapp/status')
  whatsappStatus() {
    return this.whatsapp.status();
  }

  /** Password-gated admin login (replaces one-click dev login for the panel).
   *  Set ADMIN_PASSWORD in .env; defaults to a dev value if unset. */
  @Post('admin-login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto.password);
  }

  @Post('otp/request')
  request(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phoneNumber);
  }

  @Post('otp/verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phoneNumber, dto.code, dto.fullName, dto.role ?? 'CONSUMER');
  }

  /** DEV ONLY: instant login as a persona for testing the three apps. */
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    return this.auth.devLogin(dto.role);
  }
}
