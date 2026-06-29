import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class TopupDto {
  @IsNumber() @Min(1) amount!: number;
  @IsOptional() @IsString() externalRef?: string;
}
class VerificationDto {
  @IsNumber() @Min(1) amount!: number;
  @IsIn(['BANK_TRANSFER', 'PAYPAL', 'CARD', 'OTHER']) method!: string;
  @IsOptional() @IsString() receiptUrl?: string;
  @IsOptional() @IsString() jobId?: string;
}
class PayoutDto {
  @IsNumber() @Min(1) amount!: number;
  @IsOptional() @IsString() bankAccountName?: string;
  @IsOptional() @IsString() bankAccountRef?: string;
}
class ResolveVerificationDto {
  @IsString() decision!: 'APPROVE' | 'REJECT';
  @IsOptional() @IsString() note?: string;
}
class ResolvePayoutDto {
  @IsIn(['PAID', 'REJECTED']) status!: 'PAID' | 'REJECTED';
  @IsOptional() @IsString() note?: string;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  balance(@Req() req: AuthedRequest) {
    return this.wallet.getBalance(req.user!.sub);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  txns(@Req() req: AuthedRequest, @Query('limit') limit?: string) {
    return this.wallet.listTransactions(req.user!.sub, limit ? Number(limit) : 50);
  }

  /** Instant/dev top-up (card-equivalent). Applies the bonus scale. */
  @Post('topup')
  @UseGuards(JwtAuthGuard)
  topup(@Req() req: AuthedRequest, @Body() dto: TopupDto) {
    return this.wallet.topup(req.user!.sub, dto.amount, { externalRef: dto.externalRef });
  }

  /** Bank/PayPal top-up: submit a receipt for manual admin verification. */
  @Post('verification')
  @UseGuards(JwtAuthGuard)
  submitVerification(@Req() req: AuthedRequest, @Body() dto: VerificationDto) {
    return this.wallet.submitVerification(req.user!.sub, dto);
  }

  // --- Vendor payouts -------------------------------------------------------
  @Post('payouts')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  requestPayout(@Req() req: AuthedRequest, @Body() dto: PayoutDto) {
    return this.wallet.requestPayout(req.user!.sub, dto);
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  listPayouts(@Req() req: AuthedRequest) {
    return this.wallet.listPayouts(req.user!.sub);
  }

  // --- Admin gates ----------------------------------------------------------
  @Get('admin/verifications')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  pendingVerifications() {
    return this.wallet.pendingVerifications();
  }

  @Post('admin/verifications/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  resolveVerification(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ResolveVerificationDto) {
    return this.wallet.verifyPayment(id, req.user!.sub, dto.decision === 'APPROVE', dto.note);
  }

  @Get('admin/payouts')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  pendingPayouts() {
    return this.wallet.pendingPayouts();
  }

  @Post('admin/payouts/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  resolvePayout(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ResolvePayoutDto) {
    return this.wallet.resolvePayout(id, req.user!.sub, dto.status, dto.note);
  }
}
