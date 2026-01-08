ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::text;--> statement-breakpoint
DROP TYPE "public"."borrow_status";--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."borrow_status" AS ENUM('BORROWED', 'RETURNED', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::"public"."borrow_status";--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE "public"."borrow_status" USING "status"::"public"."borrow_status";--> statement-breakpoint
ALTER TABLE "borrow_records" ADD COLUMN "reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "borrow_records" DROP COLUMN "due_date_reminder_sent";