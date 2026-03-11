require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_genres text`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false`;
  console.log('✅ Users table updated with preferred_genres and onboarding_completed');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
