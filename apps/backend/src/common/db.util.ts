import { ServiceUnavailableException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Narrows the nullable injected client; throws 503 if Supabase is unconfigured. */
export function requireDb(db: SupabaseClient | null): SupabaseClient {
  if (!db) {
    throw new ServiceUnavailableException(
      'Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return db;
}
