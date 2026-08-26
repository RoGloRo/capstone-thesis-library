-- Migration: Add library information columns (shelf_location, book_format, acquisition_date) to books
BEGIN;

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS shelf_location varchar(100);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS book_format varchar(50);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS acquisition_date date;

COMMIT;