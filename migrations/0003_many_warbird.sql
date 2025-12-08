ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::text;--> statement-breakpoint
DROP TYPE "public"."borrow_status";--> statement-breakpoint
CREATE TYPE "public"."borrow_status" AS ENUM('BORROWED', 'RETURNED');--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DEFAULT 'BORROWED'::"public"."borrow_status";--> statement-breakpoint
ALTER TABLE "borrow_records" ALTER COLUMN "status" SET DATA TYPE "public"."borrow_status" USING "status"::"public"."borrow_status";