import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { BillingService } from './billing.service';
import { VoucherService } from './voucher.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class SubscribeDto {
  @IsString() planId!: string;
}
class RedeemDto {
  @IsString() code!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly vouchers: VoucherService,
  ) {}

  @Get('plans')
  plans() {
    return this.billing.listPlans();
  }

  @Get('billing/me')
  myPlan(@Req() req: AuthedRequest) {
    return this.billing.myPlan(req.user!.sub);
  }

  @Post('billing/subscribe')
  subscribe(@Req() req: AuthedRequest, @Body() dto: SubscribeDto) {
    return this.billing.subscribe(req.user!.sub, dto.planId);
  }

  @Post('vouchers/redeem')
  redeem(@Req() req: AuthedRequest, @Body() dto: RedeemDto) {
    return this.vouchers.redeem(req.user!.sub, dto.code);
  }
}
