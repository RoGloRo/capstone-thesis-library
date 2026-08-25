import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['\"]|['\"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying published_year migration (idempotent)...');

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'published_year'
        ) THEN
          ALTER TABLE public.books ADD COLUMN published_year integer;
        END IF;
      END
      $$;
    `;

    console.log('✅ published_year column applied (or already present).');
  } catch (err) {
    console.error('❌ Failed to apply published_year migration:', err);
    process.exit(1);
  }
}

apply();