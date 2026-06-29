// Minimal migration runner: applies db/migrations/*.sql in order over DATABASE_URL.
// Usage: node scripts/migrate.mjs   (requires `pg` installed and DATABASE_URL set)
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'db', 'migrations');

// Simple .env parser to load DATABASE_URL if run locally without dotenv CLI
import { existsSync } from 'node:fs';
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !key.startsWith('#') && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

await client.connect();
try {
  for (const f of files) {
    const sql = readFileSync(join(migrationsDir, f), 'utf8');
    process.stdout.write(`applying ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }
} finally {
  await client.end();
}
console.log('migrations complete');
