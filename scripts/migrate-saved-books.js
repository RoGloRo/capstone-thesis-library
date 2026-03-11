require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS saved_books (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS saved_books_user_book_unique ON saved_books (user_id, book_id)`;
  await sql`CREATE INDEX IF NOT EXISTS saved_books_user_idx ON saved_books (user_id)`;
  console.log('✅ saved_books table created successfully');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
