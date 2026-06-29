import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AiService } from './ai.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class RewriteDto {
  @IsString() rawText!: string;
  @IsOptional() @IsString() categoryHint?: string;
  @IsOptional() @IsString() targetLanguage?: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** AI Rewrite button — available to any authenticated user (caps enforced elsewhere). */
  @Post('rewrite-ticket')
  @UseGuards(JwtAuthGuard)
  rewrite(@Req() _req: AuthedRequest, @Body() dto: RewriteDto) {
    return this.ai.rewriteTicket(dto);
  }

  /** Internal estimate — ADMIN ONLY. Never exposed to consumers. */
  @Get('jobs/:jobId/estimate')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  estimate(@Param('jobId') jobId: string) {
    return this.ai.getEstimate(jobId);
  }
}
