import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

// Remove quotes from DATABASE_URL if present
const dbUrl = process.env.DATABASE_URL!.replace(/^['"]|['"]$/g, '');
const sql = neon(dbUrl);

async function clearEmailLogs() {
  try {
    console.log('🗑️ Clearing all email logs...');
    
    // Get count before deletion
    const beforeCount = await sql`SELECT COUNT(*) FROM email_logs`;
    console.log(`📊 Found ${beforeCount[0].count} email log records`);
    
    // Delete all records
    await sql`DELETE FROM email_logs`;
    
    // Verify deletion
    const afterCount = await sql`SELECT COUNT(*) FROM email_logs`;
    console.log(`✅ Email logs cleared. Records remaining: ${afterCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error clearing email logs:', error);
  }
}

clearEmailLogs();