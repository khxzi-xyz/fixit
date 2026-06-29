import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BidsService } from './bids.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class MilestoneDto {
  @IsString() label!: string;
  @IsNumber() @Min(1) pct!: number;
}
class SubmitBidDto {
  @IsString() jobId!: string;
  @IsNumber() @Min(0) bidAmount!: number;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => MilestoneDto)
  proposedMilestones!: MilestoneDto[];
  @IsOptional() @IsString() estimatedStartAt?: string;
}

@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Post('bids')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  submit(@Req() req: AuthedRequest, @Body() dto: SubmitBidDto) {
    return this.bids.submit(req.user!.sub, dto);
  }

  @Get('jobs/:jobId/bids')
  @UseGuards(JwtAuthGuard)
  list(@Param('jobId') jobId: string) {
    return this.bids.listForJob(jobId);
  }

  @Post('jobs/:jobId/bids/:bidId/select')
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  select(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Param('bidId') bidId: string) {
    return this.bids.select(req.user!.sub, jobId, bidId);
  }
}
