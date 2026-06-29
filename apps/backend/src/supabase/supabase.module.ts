import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

/**
 * Provides the service_role Supabase client (backend-only, bypasses RLS —
 * NEVER expose to clients). If env is unset, provides `null` so the app still
 * boots; services use requireDb() to fail with a clear message at call time.
 */
import { MockSupabaseClient } from './mock-supabase';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => {
        const useMock = config.get<string>('USE_MOCK_DB') === 'true';
        if (useMock) {
          new Logger('SupabaseModule').log('Using local JSON mock database (db.json)');
          return new MockSupabaseClient();
        }

        const url = config.get<string>('SUPABASE_URL');
        const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) {
          new Logger('SupabaseModule').warn(
            'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — DB calls will 503 until configured (see .env.example)',
          );
          return null;
        }
        return createClient(url, key, { auth: { persistSession: false } });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
