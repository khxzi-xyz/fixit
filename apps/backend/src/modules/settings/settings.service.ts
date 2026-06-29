import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';

/**
 * Per-user settings (theme, language, etc.) stored as a JSONB blob. Resilient:
 * if the user_settings table isn't migrated yet, reads return {} and writes are
 * a no-op, so the client (which also caches locally) never breaks.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  async get(userId: string): Promise<Record<string, unknown>> {
    const db = requireDb(this.db);
    const { data, error } = await db.from('user_settings').select('settings').eq('user_id', userId).maybeSingle();
    if (error) {
      this.logger.warn(`settings read failed (table maybe not migrated): ${error.message}`);
      return {};
    }
    return (data?.settings as Record<string, unknown>) ?? {};
  }

  async update(userId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = requireDb(this.db);
    const current = await this.get(userId);
    const merged = { ...current, ...patch };
    const { error } = await db
      .from('user_settings')
      .upsert({ user_id: userId, settings: merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      this.logger.warn(`settings write failed: ${error.message}`);
      return merged; // client keeps local copy regardless
    }
    return merged;
  }
}
