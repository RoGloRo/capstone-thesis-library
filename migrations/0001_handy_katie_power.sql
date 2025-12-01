-- Drop any existing constraints that depend on the enum
ALTER TABLE "borrow_records" DROP CONSTRAINT IF EXISTS "borrow_records_status_check";

-- Change the column type to text temporarily
ALTER TABLE "borrow_records" ALTER COLUMN "status" TYPE text;

-- Drop the old enum type if it exists
DROP TYPE IF EXISTS "borrow_status";

-- Create the new enum type with the correct values
CREATE TYPE "public"."borrow_status" AS ENUM('BORROWED', 'STATUS');

-- Update the column to use the new enum type
ALTER TABLE "borrow_records" 
  ALTER COLUMN "status" TYPE "public"."borrow_status" 
  USING (
    CASE 
      WHEN status = 'RETURNED' OR status = 'OVERDUE' THEN 'BORROWED'::"public"."borrow_status"
      ELSE 'BORROWED'::"public"."borrow_status"
    END
  );

-- Set the default value
ALTER TABLE "borrow_records" 
  ALTER COLUMN "status" SET DEFAULT 'BORROWED'::"public"."borrow_status";

-- Add a check constraint to ensure only valid values are used
ALTER TABLE "borrow_records" 
  ADD CONSTRAINT "borrow_records_status_check" 
  CHECK (status = ANY (ARRAY['BORROWED', 'STATUS']::text[]));