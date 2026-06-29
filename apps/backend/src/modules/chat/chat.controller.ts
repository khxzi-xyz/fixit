import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ChatService } from './chat.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(2000) body!: string;
}
class SendMediaDto {
  @IsIn(['VOICE', 'IMAGE']) type!: 'VOICE' | 'IMAGE';
  @IsString() mediaUrl!: string;
  @IsOptional() @IsNumber() durationSecs?: number;
}

@Controller('jobs/:jobId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  send(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: SendMessageDto) {
    return this.chat.send(jobId, req.user!.sub, dto.body);
  }

  /** Voice note / image — raw, no translation (Module 06). */
  @Post('media')
  sendMedia(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: SendMediaDto) {
    return this.chat.sendMedia(jobId, req.user!.sub, dto);
  }

  @Get()
  list(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.chat.list(jobId, req.user!.sub);
  }
}
