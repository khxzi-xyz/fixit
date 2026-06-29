import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { WarrantyService } from './warranty.service';
import { PayoutService } from './payout.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class WarrantyDaysDto {
  @IsInt() @Min(0) days!: number;
}

@Controller('jobs/:jobId/warranty')
@UseGuards(JwtAuthGuard)
export class WarrantyController {
  constructor(
    private readonly warranty: WarrantyService,
    private readonly payouts: PayoutService,
  ) {}

  @Get()
  get(@Param('jobId') jobId: string) {
    return this.warranty.get(jobId);
  }

  @Post()
  propose(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: WarrantyDaysDto) {
    return this.warranty.propose(jobId, req.user!.sub, dto.days);
  }

  @Post('counter')
  counter(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: WarrantyDaysDto) {
    return this.warranty.counter(jobId, req.user!.sub, dto.days);
  }

  @Post('agree')
  agree(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.warranty.agree(jobId, req.user!.sub);
  }

  @Get('payout')
  getPayout(@Param('jobId') jobId: string) {
    return this.payouts.get(jobId);
  }
}
