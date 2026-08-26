-- Migration: Add nullable user_category and grade_level columns to users.
--
-- MNHS classifies library users into STUDENT / TEACHER / STAFF (userCategory).
-- grade_level only applies to STUDENT users (GRADE_7..GRADE_12) and is NULL for
-- everyone else. Both columns are nullable so pre-existing users remain valid
-- and are unaffected.
--
-- This is intentionally separate from the system `role` (USER / ADMIN) and does
-- NOT touch the univeristy_id / university_card columns.
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_category varchar(20);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS grade_level varchar(20);

COMMIT;