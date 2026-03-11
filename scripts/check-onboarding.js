require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE onboarding_completed = true) as completed, COUNT(*) FILTER (WHERE onboarding_completed = false OR onboarding_completed IS NULL) as pending FROM users`
  .then(r => console.log('DB state:', r[0]))
  .catch(e => console.error(e.message));
