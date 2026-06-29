import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class SettingsDto {
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() language?: string;
}

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@Req() req: AuthedRequest) {
    return this.settings.get(req.user!.sub);
  }

  @Put()
  update(@Req() req: AuthedRequest, @Body() dto: SettingsDto) {
    return this.settings.update(req.user!.sub, { ...dto });
  }
}
