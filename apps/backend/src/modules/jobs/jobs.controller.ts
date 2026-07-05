import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min,
} from 'class-validator';
import { JobsService } from './jobs.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class CreateJobDto {
  @IsString() categoryId!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) subIssueTags?: string[];
  @IsIn(['EMERGENCY', 'TODAY', 'THIS_WEEK', 'FLEXIBLE']) urgency!: 'EMERGENCY' | 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE';
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsOptional() @IsNumber() budgetMin?: number;
  @IsOptional() @IsNumber() budgetMax?: number;
  @IsOptional() @IsIn(['STANDARD', 'BOUNTY', 'AUCTION']) postingKind?: 'STANDARD' | 'BOUNTY' | 'AUCTION';
  @IsOptional() @IsNumber() bountyPrice?: number;
  @IsOptional() @IsBoolean() aiRewritten?: boolean;
  @IsOptional() @IsString() originalDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) mediaUrls?: string[];
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  create(@Req() req: AuthedRequest, @Body() dto: CreateJobDto) {
    return this.jobs.create(req.user!.sub, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  mine(@Req() req: AuthedRequest) {
    return this.jobs.listForConsumer(req.user!.sub);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  feed(@Req() req: AuthedRequest) {
    return this.jobs.feedForVendor(req.user!.sub);
  }

  @Get('vendor-mine')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  vendorMine(@Req() req: AuthedRequest) {
    return this.jobs.listForVendor(req.user!.sub);
  }

  @Get(':jobId')
  @UseGuards(JwtAuthGuard)
  get(@Param('jobId') jobId: string) {
    return this.jobs.get(jobId);
  }
}
