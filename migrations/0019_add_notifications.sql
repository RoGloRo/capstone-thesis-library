-- Migration: Add notifications table (Admin Notification Center).
--
-- A centralized, event/activity layer for important library events an admin
-- should be aware of. This is intentionally separate from email_logs:
--   - email_logs answers "Did we send this email?"
--   - notifications answers "What important event happened that the admin
--     should know about?"
-- An event may produce both a notification and an email log, but they are
-- independent records.
--
-- Idempotent, additive, safe to re-run. Follows the convention of recent
-- hand-written migrations (0018 contact-messages, 0017 user-category, ...).
BEGIN;

-- 1. Create the notification_category enum (no CREATE TYPE IF NOT EXISTS in PG,
--    so guard with a DO block). "ALL" is a UI-only filter and is NOT stored here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category') THEN
    CREATE TYPE public.notification_category AS ENUM ('BOOK', 'ACCOUNT', 'MESSAGE', 'SYSTEM');
  END IF;
END
$$;

-- 2. Create the notification_type enum (only types backed by real features).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM (
      'BOOK_BORROWED',
      'BOOK_RETURNED',
      'BOOK_DUE_SOON',
      'BOOK_OVERDUE',
      'ACCOUNT_REQUEST',
      'ACCOUNT_APPROVED',
      'ACCOUNT_REJECTED',
      'NEW_MESSAGE'
    );
  END IF;
END
$$;

-- 3. Create the notifications table.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category public.notification_category NOT NULL,
  type public.notification_type NOT NULL,
  title varchar(200) NOT NULL,
  message text NOT NULL,
  user_id uuid,
  entity_type varchar(50),
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL
);

-- 4. Dedup: one notification per business event. Inserts use ON CONFLICT DO
--    NOTHING against this index, so repeated/re-run workflows never duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedup_idx
  ON public.notifications (type, entity_type, entity_id);

-- 5. Query-supporting indexes.
CREATE INDEX IF NOT EXISTS notifications_category_idx
  ON public.notifications (category);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx
  ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON public.notifications (created_at);

COMMIT;