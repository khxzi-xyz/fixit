import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';

/**
 * Zero-AI translation: a DB-backed dictionary (translation_dictionary table).
 * The frontend fetches the whole map once and looks up string_key → text by
 * the user's language. Missing keys fall back to the raw key/English.
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  async getDictionary(): Promise<Record<string, { en: string; ar: string; ur: string }>> {
    if (!this.db) return {};
    try {
      const { data, error } = await this.db.from('translation_dictionary').select('*');
      if (error) {
        this.logger.warn(`dictionary fetch failed: ${error.message}`);
        return {};
      }
      const dictionary: Record<string, { en: string; ar: string; ur: string }> = {};
      (data ?? []).forEach((row: any) => {
        dictionary[row.string_key] = { en: row.text_en, ar: row.text_ar, ur: row.text_ur };
      });
      return dictionary;
    } catch (e: any) {
      this.logger.warn(`getDictionary error: ${e.message}`);
      return {};
    }
  }
}
