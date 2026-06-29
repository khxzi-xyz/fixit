import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class ApproveDto {
  @IsString() sanitizedText!: string;
}

@Controller('moderation')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('queue')
  queue() {
    return this.moderation.pendingQueue();
  }

  @Post(':logId/approve')
  approve(@Req() req: AuthedRequest, @Param('logId') logId: string, @Body() dto: ApproveDto) {
    return this.moderation.approveSanitized(logId, dto.sanitizedText, req.user!.sub);
  }

  @Post(':logId/reject')
  reject(@Req() req: AuthedRequest, @Param('logId') logId: string) {
    return this.moderation.reject(logId, req.user!.sub);
  }
}
