import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { BillingService } from './billing.service';
import { VoucherService } from './voucher.service';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class SubscribeDto {
  @IsString() planId!: string;
}
class AddCardDto {
  @IsString() cardNumber!: string;
  @IsInt() @Min(1) @Max(12) expMonth!: number;
  @IsInt() @Min(0) expYear!: number;
  @IsOptional() @IsString() holderName?: string;
  @IsOptional() @IsString() cvv?: string; // validated client-side, never stored
}
class TrialDto {
  @IsOptional() @IsString() refCode?: string;
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
    private readonly paymentMethods: PaymentMethodsService,
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

  /** Invited free-trial: 3 days of Plus, card on file required. */
  @Post('billing/trial')
  trial(@Req() req: AuthedRequest, @Body() dto: TrialDto) {
    return this.billing.startTrial(req.user!.sub, dto.refCode);
  }

  @Get('billing/payment-methods')
  listCards(@Req() req: AuthedRequest) {
    return this.paymentMethods.list(req.user!.sub);
  }

  @Post('billing/payment-methods')
  addCard(@Req() req: AuthedRequest, @Body() dto: AddCardDto) {
    return this.paymentMethods.add(req.user!.sub, dto);
  }

  @Delete('billing/payment-methods/:id')
  deleteCard(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.paymentMethods.remove(req.user!.sub, id);
  }
}
