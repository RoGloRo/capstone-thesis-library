import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

// Remove quotes from DATABASE_URL if present
const dbUrl = process.env.DATABASE_URL!.replace(/^['"]|['"]$/g, '');
const sql = neon(dbUrl);

async function createEmailLogsTable() {
  try {
    console.log('Creating email_logs table...');
    
    // Create enums first (if they don't exist)
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'PENDING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."email_type" AS ENUM(
          'WELCOME', 'ACCOUNT_APPROVAL', 'ACCOUNT_REJECTION', 
          'BORROW_CONFIRMATION', 'DUE_REMINDER', 'OVERDUE_NOTICE', 
          'RETURN_CONFIRMATION', 'USER_ACTIVE', 'USER_INACTIVE', 
          'DUE_TODAY', 'PENALTY_NOTICE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS "email_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "recipient_email" text NOT NULL,
        "recipient_name" varchar(255),
        "email_type" "email_type" NOT NULL,
        "status" "email_status" DEFAULT 'SENT' NOT NULL,
        "subject" text NOT NULL,
        "error_message" text,
        "sent_at" timestamp with time zone DEFAULT now(),
        "metadata" text,
        CONSTRAINT "email_logs_id_unique" UNIQUE("id")
      );
    `;
    
    console.log('✅ Email logs table created successfully!');
    
    // Test if we can query the table
    const result = await sql`SELECT COUNT(*) FROM email_logs`;
    console.log(`📊 Email logs table has ${result[0].count} records`);
    
  } catch (error) {
    console.error('❌ Error creating email_logs table:', error);
  }
}

createEmailLogsTable();