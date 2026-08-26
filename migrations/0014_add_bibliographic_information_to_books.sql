-- Migration: Add nullable bibliographic information columns to books
BEGIN;

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS identifier varchar(200);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS publisher varchar(255);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS edition varchar(255);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS language varchar(100);

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS pages integer;

COMMIT;