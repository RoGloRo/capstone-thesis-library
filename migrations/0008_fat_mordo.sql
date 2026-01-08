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
--> statement-breakpoint
DROP TABLE "saved_books" CASCADE;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::text;--> statement-breakpoint
DROP TYPE "public"."borrow_status";--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."email_type" AS ENUM('WELCOME', 'ACCOUNT_APPROVAL', 'ACCOUNT_REJECTION', 'BORROW_CONFIRMATION', 'DUE_REMINDER', 'OVERDUE_NOTICE', 'RETURN_CONFIRMATION', 'USER_ACTIVE', 'USER_INACTIVE', 'DUE_TODAY', 'PENALTY_NOTICE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."borrow_status" AS ENUM('BORROWED', 'STATUS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::"public"."borrow_status";--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE "public"."borrow_status" USING "status"::"public"."borrow_status";