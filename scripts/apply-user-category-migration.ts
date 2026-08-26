import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!.replace(/^['\\"]|['\\"]$/g, '');
const sql = neon(dbUrl);

async function apply() {
  try {
    console.log('Applying user_category / grade_level migration (idempotent)...');

    await sql`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS user_category varchar(20);
    `;

    await sql`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS grade_level varchar(20);
    `;

    console.log('✅ user_category and grade_level columns applied (or already present).');
  } catch (err) {
    console.error('❌ Failed to apply user_category / grade_level migration:', err);
    process.exit(1);
  }
}

apply();