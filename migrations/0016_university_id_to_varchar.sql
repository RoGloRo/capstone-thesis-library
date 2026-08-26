-- Migration: users.univeristy_id integer -> varchar(50) to support large /
-- alphanumeric / leading-zero student IDs (e.g. 13033009272, 0013033009272,
-- MNHS-2026-001, STU-13033009272). Idempotent.
--
-- Note: the physical column name keeps the historical "univeristy_id" spelling
-- on purpose so no column rename is bundled with this type change.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'users'
      AND column_name = 'univeristy_id'
      AND data_type   = 'integer'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN univeristy_id TYPE varchar(50)
      USING univeristy_id::varchar;
  END IF;
END
$$;

COMMIT;