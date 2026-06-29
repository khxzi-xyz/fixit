import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class ReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() body?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Post('jobs/:jobId/review')
  @Roles('CONSUMER')
  review(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: ReviewDto) {
    return this.engagement.createReview(jobId, req.user!.sub, dto.rating, dto.body);
  }

  @Get('jobs/:jobId/review')
  myReview(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.engagement.myReview(jobId, req.user!.sub);
  }

  @Get('vendors/:vendorId/reviews')
  vendorReviews(@Param('vendorId') vendorId: string) {
    return this.engagement.vendorReviews(vendorId);
  }

  @Get('notifications')
  notifications(@Req() req: AuthedRequest) {
    return this.engagement.myNotifications(req.user!.sub);
  }

  @Post('notifications/read-all')
  readAll(@Req() req: AuthedRequest) {
    return this.engagement.markRead(req.user!.sub);
  }
}
