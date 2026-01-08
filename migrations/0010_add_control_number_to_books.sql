-- Migration: Add nullable unique control_number column to books
BEGIN;

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS control_number varchar(32);

-- Create a unique index to enforce uniqueness for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS books_control_number_idx ON public.books (control_number);

COMMIT;
