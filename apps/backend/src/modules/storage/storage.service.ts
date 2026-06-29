import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { randomUUID } from 'node:crypto';

const BUCKET = 'uploads';

/**
 * Image/file uploads to Supabase Storage. The mobile apps send a base64 data
 * URL (from expo-image-picker); we decode and store it, returning a public URL
 * used for receipts, Triple-Verify photos, skill proof, junk photos, etc.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private bucketReady = false;

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  private async ensureBucket(db: SupabaseClient) {
    if (this.bucketReady) return;
    const { data } = await db.storage.getBucket(BUCKET);
    if (!data) {
      const { error } = await db.storage.createBucket(BUCKET, { public: true });
      if (error && !/already exists/i.test(error.message)) {
        this.logger.warn(`createBucket: ${error.message}`);
      }
    }
    this.bucketReady = true;
  }

  /** Accepts a data URL ("data:image/jpeg;base64,...") or raw base64. */
  async uploadDataUrl(userId: string, dataUrl: string, folder = 'misc'): Promise<{ url: string; path: string }> {
    const db = requireDb(this.db);
    await this.ensureBucket(db);

    const match = /^data:(?<mime>[^;]+);base64,(?<b64>.+)$/s.exec(dataUrl);
    const mime = match?.groups?.mime ?? 'image/jpeg';
    const b64 = match?.groups?.b64 ?? dataUrl;
    const ext = (mime.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const buffer = Buffer.from(b64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('empty upload');
    if (buffer.length > 8 * 1024 * 1024) throw new BadRequestException('file too large (max 8MB)');

    const path = `${folder}/${userId.slice(0, 8)}/${randomUUID()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false });
    if (error) throw new BadRequestException(`upload failed: ${error.message}`);

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }
}
