import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { AiService } from './ai.service';
import { AiProviderService } from './ai-provider.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class RewriteDto {
  @IsString() rawText!: string;
  @IsOptional() @IsString() categoryHint?: string;
  @IsOptional() @IsString() targetLanguage?: string;
}

class EnrichDto {
  @IsString() description!: string;
}

class TranslateDto {
  @IsArray() @IsString({ each: true }) @ArrayMaxSize(50) texts!: string[];
  @IsString() targetLang!: string;
}

class SetProviderDto {
  @IsString() @IsIn(['gemini', 'groq']) provider!: 'gemini' | 'groq';
}

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly aiProvider: AiProviderService,
  ) { }

  /** AI Rewrite button -any authenticated user */
  @Post('rewrite-ticket')
  @UseGuards(JwtAuthGuard)
  rewrite(@Req() _req: AuthedRequest, @Body() dto: RewriteDto) {
    return this.ai.rewriteTicket(dto);
  }

  @Post('matchmaker')
  @UseGuards(JwtAuthGuard)
  async matchmaker(@Body() body: { text: string }) {
    if (!body.text?.trim()) throw new BadRequestException('text is required');
    return this.aiProvider.matchmakerLocalOllama(body.text);
  }

  /** Internal estimate -ADMIN ONLY */
  @Get('jobs/:jobId/estimate')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  estimate(@Param('jobId') jobId: string) {
    return this.ai.getEstimate(jobId);
  }

  /** AI Enrichment for custom vendor services */
  @Post('enrich-service')
  @UseGuards(JwtAuthGuard)
  enrichService(@Body() dto: EnrichDto) {
    return this.ai.enrichCustomService(dto.description);
  }

  /** Live translation */
  @Post('translate')
  @UseGuards(JwtAuthGuard)
  translate(@Body() dto: TranslateDto) {
    return this.ai.translate(dto.texts, dto.targetLang);
  }

  /** ADMIN: Get current AI provider */
  @Get('provider')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  async getProvider() {
    const provider = await this.aiProvider.getProvider();
    return { provider };
  }

  /** ADMIN: Switch AI provider */
  @Post('provider')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  async setProvider(@Body() dto: SetProviderDto) {
    await this.aiProvider.setProvider(dto.provider);
    return { provider: dto.provider, switched: true };
  }

  /** ADMIN: Test current AI connection */
  @Get('provider/test')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  testConnection() {
    return this.aiProvider.testConnection();
  }
}
