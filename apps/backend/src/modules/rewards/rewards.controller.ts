import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';
import { RewardsService } from './rewards.service';
import { CouponsService } from './coupons.service';

class RedeemDto {
  @IsOptional() @IsNumber() @Min(0.1) amount?: number;
}
class CodeDto {
  @IsString() code!: string;
}

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    private readonly coupons: CouponsService,
  ) {}

  @Get('me')
  getMe(@Req() req: AuthedRequest) {
    return this.rewardsService.getRewardsMe(req.user!.sub);
  }

  @Get('transactions')
  getTransactions(@Req() req: AuthedRequest) {
    return this.rewardsService.getTransactions(req.user!.sub);
  }

  /** Move rewards balance into the spendable wallet (defaults to full balance). */
  @Post('redeem')
  redeem(@Req() req: AuthedRequest, @Body() dto: RedeemDto) {
    return this.rewardsService.redeem(req.user!.sub, dto.amount);
  }

  @Get('coupons')
  getCoupons() {
    return this.coupons.listPublic();
  }

  /** Redeem an admin-made coupon: wallet credit or gifted plan days. */
  @Post('coupon/apply')
  applyCoupon(@Req() req: AuthedRequest, @Body() dto: CodeDto) {
    return this.coupons.redeem(req.user!.sub, req.user!.role ?? 'CONSUMER', dto.code);
  }

  @Get('referral-code')
  getReferralCode(@Req() req: AuthedRequest) {
    return this.rewardsService.getReferralCode(req.user!.sub);
  }

  /** Record "I signed up with this referral code" (called once post-signup). */
  @Post('referral/claim')
  claimReferral(@Req() req: AuthedRequest, @Body() dto: CodeDto) {
    return this.rewardsService.claimReferral(req.user!.sub, dto.code);
  }

  @Get('referral-stats')
  getReferralStats(@Req() req: AuthedRequest) {
    return this.rewardsService.getReferralStats(req.user!.sub);
  }
}
