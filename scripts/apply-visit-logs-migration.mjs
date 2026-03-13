import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Creating visit_logs table...');
  
  await sql`CREATE TABLE IF NOT EXISTS "visit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "visit_date" date NOT NULL,
    "visit_time" varchar(10) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS "visit_logs_user_idx" ON "visit_logs" ("user_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "visit_logs_date_idx" ON "visit_logs" ("visit_date")`;

  console.log('✅ visit_logs migration applied successfully');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
