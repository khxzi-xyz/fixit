import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsNumber, IsString, Max, Min } from 'class-validator';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';
import type { RefundMethod } from './refund-math';

class ConfirmFundingDto {
  @IsString() jobId!: string;
  @IsString() bidId!: string;
  @IsInt() @Min(0) milestoneIndex!: number;
  @IsString() orderId!: string;
  @IsInt() @Min(0) amountMinor!: number;
}

class ResolveDisputeDto {
  @IsString() jobId!: string;
  @IsString() bidId!: string;
  @IsInt() @Min(0) milestoneIndex!: number;
  @IsNumber() @Min(0) @Max(1) commissionRate!: number;
  @IsNumber() @Min(0) @Max(1) refundFraction!: number;
  @IsIn(['METHOD_1', 'METHOD_2']) method!: RefundMethod;
}

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrow: EscrowService) {}

  /** Capture the approved PayPal order → HOLDING. */
  @Post('confirm-funding')
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  confirm(@Req() req: AuthedRequest, @Body() dto: ConfirmFundingDto) {
    return this.escrow.confirmFunding({ ...dto, actorUserId: req.user!.sub });
  }

  /** Admin dispute resolution with system-calculated refund math (PRD §1.C.2). */
  @Post('resolve-dispute')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  resolve(@Req() req: AuthedRequest, @Body() dto: ResolveDisputeDto) {
    return this.escrow.resolveDispute({ ...dto, actorUserId: req.user!.sub });
  }
}
