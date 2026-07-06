import { Body, Controller, Get, Put, Post, Req, UseGuards, UseInterceptors, UploadedFile, Inject } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';
// @ts-ignore
import { FileInterceptor } from '@nestjs/platform-express';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

class SettingsDto {
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() language?: string;
}

class FcmTokenDto {
  @IsString() token!: string;
}

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient
  ) {}

  @Get()
  get(@Req() req: AuthedRequest) {
    return this.settings.get(req.user!.sub);
  }

  @Put()
  update(@Req() req: AuthedRequest, @Body() dto: SettingsDto) {
    return this.settings.update(req.user!.sub, { ...dto });
  }

  @Put('fcm-token')
  async updateFcmToken(@Req() req: AuthedRequest, @Body() dto: FcmTokenDto) {
    const { error } = await this.db.from('profiles').update({ fcm_token: dto.token }).eq('user_id', req.user!.sub);
    if (error) {
      if (error.code === 'PGRST204') return { success: true }; // Sometimes means no rows, but mostly harmless
      console.warn("Failed to update FCM token for", req.user!.sub, error);
    }
    return { success: true };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: AuthedRequest,
    @UploadedFile() file: any // Express.Multer.File
  ) {
    if (!file) throw new Error('No file provided');
    const ext = file.originalname.split('.').pop();
    const fileName = `${req.user!.sub}-${Date.now()}.${ext}`;

    // Upload to Supabase bucket
    let { error } = await this.db.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error && /not found|does not exist/i.test(error.message)) {
      // First avatar ever: create the public bucket, then retry once.
      await this.db.storage.createBucket('avatars', { public: true }).catch(() => undefined);
      ({ error } = await this.db.storage
        .from('avatars')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true }));
    }

    if (error) throw new Error('Upload failed: ' + error.message);
    
    // Get public URL
    const { data: { publicUrl } } = this.db.storage.from('avatars').getPublicUrl(fileName);
    
    // Update user metadata in Supabase Auth
    await this.db.auth.admin.updateUserById(req.user!.sub, {
      user_metadata: { avatar_url: publicUrl }
    });
    
    return { avatarUrl: publicUrl };
  }
}
