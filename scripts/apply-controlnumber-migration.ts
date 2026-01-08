import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['"]|['"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying control_number migration (idempotent)...');

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'control_number'
        ) THEN
          ALTER TABLE public.books ADD COLUMN control_number varchar(32);
        END IF;
      END
      $$;
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i' AND c.relname = 'books_control_number_idx'
        ) THEN
          CREATE UNIQUE INDEX books_control_number_idx ON public.books (control_number);
        END IF;
      END
      $$;
    `;

    console.log('✅ control_number column and unique index applied (or already present).');
  } catch (err) {
    console.error('❌ Failed to apply control_number migration:', err);
    process.exit(1);
  }
}

apply();
