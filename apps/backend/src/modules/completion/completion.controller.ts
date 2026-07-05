import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { CompletionService } from './completion.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class PhotoDto {
  @IsIn(['BEFORE', 'VENDOR_AFTER', 'CONSUMER_BEFORE', 'CONSUMER_AFTER']) phase!: 'BEFORE' | 'VENDOR_AFTER' | 'CONSUMER_BEFORE' | 'CONSUMER_AFTER';
  @IsString() url!: string;
  @IsOptional() @IsBoolean() capturedInApp?: boolean;
}
class ConfirmDto {
  @IsIn(['YES', 'NO']) answer!: 'YES' | 'NO';
  @IsOptional() @IsString() reason?: string;
}

@Controller('jobs/:jobId/completion')
@UseGuards(JwtAuthGuard)
export class CompletionController {
  constructor(private readonly completion: CompletionService) {}

  @Post('photos')
  upload(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: PhotoDto) {
    return this.completion.uploadPhoto(jobId, req.user!.sub, dto.phase, dto.url, dto.capturedInApp ?? true);
  }

  @Get('photos')
  photos(@Param('jobId') jobId: string) {
    return this.completion.listPhotos(jobId);
  }

  @Get()
  status(@Param('jobId') jobId: string) {
    return this.completion.getStatus(jobId);
  }

  @Post('confirm')
  confirm(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: ConfirmDto) {
    return this.completion.confirm(jobId, req.user!.sub, dto.answer, dto.reason);
  }
}
