import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { StorageService } from './storage.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class UploadDto {
  @IsString() dataUrl!: string;
  @IsOptional() @IsString() folder?: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  upload(@Req() req: AuthedRequest, @Body() dto: UploadDto) {
    return this.storage.uploadDataUrl(req.user!.sub, dto.dataUrl, dto.folder);
  }
}
