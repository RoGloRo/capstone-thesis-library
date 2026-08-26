import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['\"]|['\"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying bibliographic information migration (idempotent)...');

    // identifier (ISBN-10 / ISBN-13 / ISSN-8)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'identifier'
        ) THEN
          ALTER TABLE public.books ADD COLUMN identifier varchar(200);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'identifier' applied (or already present).");

    // publisher
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'publisher'
        ) THEN
          ALTER TABLE public.books ADD COLUMN publisher varchar(255);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'publisher' applied (or already present).");

    // edition
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'edition'
        ) THEN
          ALTER TABLE public.books ADD COLUMN edition varchar(255);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'edition' applied (or already present).");

    // language
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'language'
        ) THEN
          ALTER TABLE public.books ADD COLUMN language varchar(100);
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'language' applied (or already present).");

    // pages
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'pages'
        ) THEN
          ALTER TABLE public.books ADD COLUMN pages integer;
        END IF;
      END
      $$;
    `;
    console.log("  ✅ column 'pages' applied (or already present).");

    console.log('✅ bibliographic information columns applied.');
  } catch (err) {
    console.error('❌ Failed to apply bibliographic information migration:', err);
    process.exit(1);
  }
}

apply();