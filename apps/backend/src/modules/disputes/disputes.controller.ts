import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class ResolveDto {
  @IsIn(['REFUND_CONSUMER', 'RELEASE_VENDOR']) decision!: 'REFUND_CONSUMER' | 'RELEASE_VENDOR';
  @IsOptional() @IsString() note?: string;
}

@Controller()
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get('disputes')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  list() {
    return this.disputes.listOpen();
  }

  @Get('jobs/:jobId/dispute')
  @UseGuards(JwtAuthGuard)
  forJob(@Param('jobId') jobId: string) {
    return this.disputes.forJob(jobId);
  }

  @Post('disputes/:id/resolve')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  resolve(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ResolveDto) {
    return this.disputes.resolve(id, req.user!.sub, dto.decision, dto.note);
  }
}
