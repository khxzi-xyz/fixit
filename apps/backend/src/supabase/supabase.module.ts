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
        const log = new Logger('SupabaseModule');
        if (!url || !key) {
          log.warn(
            'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset -DB calls will 503 until configured (see .env.example)',
          );
          return null;
        }
        // Sanity-check the service_role JWT so a fake/placeholder key fails loudly
        // at boot instead of returning "Invalid API key" on every request.
        try {
          const ref = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
          const payload = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64').toString('utf8'));
          if (payload.role !== 'service_role') {
            log.error(
              `SUPABASE_SERVICE_ROLE_KEY is NOT a service_role key (role="${payload.role ?? payload.ref ?? 'unknown'}"). ` +
              'Copy the real "service_role" secret from Supabase → Project Settings → API. Every DB call will fail until fixed.',
            );
          } else if (ref && payload.ref && payload.ref !== ref) {
            log.error(
              `SUPABASE_SERVICE_ROLE_KEY project ref "${payload.ref}" does not match SUPABASE_URL ref "${ref}". DB calls will fail.`,
            );
          } else {
            log.log('Supabase service_role key validated ✓');
          }
        } catch {
          log.error('SUPABASE_SERVICE_ROLE_KEY is not a valid JWT -DB calls will fail. Paste the real service_role secret.');
        }
        return createClient(url, key, { auth: { persistSession: false } });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule { }
