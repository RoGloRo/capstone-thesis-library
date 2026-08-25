-- Migration: Add nullable published_year column to books
BEGIN;

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS published_year integer;

COMMIT;