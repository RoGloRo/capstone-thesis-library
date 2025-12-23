-- Add email logs table for tracking email activity
CREATE TYPE "public"."email_type" AS ENUM('WELCOME', 'ACCOUNT_APPROVAL', 'ACCOUNT_REJECTION', 'BORROW_CONFIRMATION', 'DUE_REMINDER', 'OVERDUE_NOTICE', 'RETURN_CONFIRMATION', 'USER_ACTIVE', 'USER_INACTIVE', 'DUE_TODAY', 'PENALTY_NOTICE');
CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'PENDING');

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