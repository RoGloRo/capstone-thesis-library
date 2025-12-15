ALTER TABLE "borrow_records" ADD COLUMN "due_date_reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "borrow_records" DROP COLUMN "reminder_sent";