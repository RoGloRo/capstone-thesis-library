require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // Mark ALL current users as having completed onboarding.
  // They existed before this feature was introduced, so they skip the genre selection step.
  // New sign-ups will have onboarding_completed = false set explicitly in their JWT,
  // and the middleware will route them to the onboarding page only on that explicit false.
  const result = await sql`
    UPDATE users
    SET onboarding_completed = true
    WHERE onboarding_completed IS NULL OR onboarding_completed = false
  `;
  console.log(`✅ Marked ${result.count} existing user(s) as onboarding completed`);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
