import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['\"]|['\"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying library information migration (idempotent)...');

    // shelf_location
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'shelf_location'
        ) THEN
          ALTER TABLE public.books ADD COLUMN shelf_location varchar(100);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'shelf_location' applied (or already present).");

    // book_format
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'book_format'
        ) THEN
          ALTER TABLE public.books ADD COLUMN book_format varchar(50);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'book_format' applied (or already present).");

    // acquisition_date
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'acquisition_date'
        ) THEN
          ALTER TABLE public.books ADD COLUMN acquisition_date date;
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'acquisition_date' applied (or already present).");

    console.log('✅ library information columns applied.');
  } catch (err) {
    console.error('❌ Failed to apply library information migration:', err);
    process.exit(1);
  }
}

apply();