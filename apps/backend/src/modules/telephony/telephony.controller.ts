import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TelephonyService } from './telephony.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

@Controller('jobs/:jobId/call')
@UseGuards(JwtAuthGuard)
export class TelephonyController {
  constructor(private readonly telephony: TelephonyService) {}

  /** Start a masked relay call between the two parties on a funded job. */
  @Post()
  initiate(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.telephony.initiateMaskedCall(jobId, req.user!.sub);
  }

  @Get()
  history(@Param('jobId') jobId: string) {
    return this.telephony.history(jobId);
  }
}
