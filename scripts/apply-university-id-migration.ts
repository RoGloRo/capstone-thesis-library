import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['\\"]|['\\"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying university_id integer -> varchar(50) migration (idempotent)...');

    await sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'univeristy_id'
            AND data_type = 'integer'
        ) THEN
          ALTER TABLE public.users
            ALTER COLUMN univeristy_id TYPE varchar(50)
            USING univeristy_id::varchar;
        END IF;
      END
      $$;
    `;

    console.log('✅ university_id column is now varchar(50) (or was already converted).');
  } catch (err) {
    console.error('❌ Failed to apply university_id migration:', err);
    process.exit(1);
  }
}

apply();