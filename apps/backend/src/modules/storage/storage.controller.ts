import { Body, Controller, Post, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
// @ts-ignore
import { FileInterceptor } from '@nestjs/platform-express';
import { IsOptional, IsString } from 'class-validator';
import { StorageService } from './storage.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class UploadDto {
  @IsOptional() @IsString() dataUrl?: string;
  @IsOptional() @IsString() folder?: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@Req() req: AuthedRequest, @Body() dto: UploadDto, @UploadedFile() file?: any) {
    if (file) {
      const ext = file.originalname.split('.').pop() || 'jpg';
      return this.storage.uploadFile(req.user!.sub, file.buffer, file.mimetype, ext, dto.folder);
    }
    if (dto.dataUrl) {
      return this.storage.uploadDataUrl(req.user!.sub, dto.dataUrl, dto.folder);
    }
    throw new BadRequestException('No file or dataUrl provided');
  }
}
