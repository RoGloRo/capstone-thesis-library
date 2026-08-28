-- Migration: Add user_notifications table (User Notification Center).
--
-- The per-user inbox powering the header bell and the /notifications page.
-- Deliberately SEPARATE from the admin `notifications` activity feed (0019):
-- different audience, different wording and — critically — read-state
-- ownership (a user reading their notification must never flip the admin
-- feed's is_read, and vice versa).
--
-- Fan-out model: one row per recipient. user_id is NOT NULL with ON DELETE
-- CASCADE because an inbox row is personal and meaningless without its user
-- (the admin feed intentionally uses ON DELETE SET NULL to preserve history).
--
-- Dedup: a unique index over (user_id, type, entity_id) guarantees each user
-- is notified at most once per business event, so re-publishing or restoring
-- an announcement never re-notifies, and double-triggered actions stay
-- idempotent (inserts use ON CONFLICT DO NOTHING).
--
-- `link` is a server-generated INTERNAL route only (e.g. /announcements/{uuid},
-- /books/{uuid}) — never user-supplied, never an external URL.
--
-- Idempotent, additive, safe to re-run. Follows the convention of recent
-- hand-written migrations (0020 announcements, 0019 notifications, ...).
BEGIN;

-- 1. Create the user_notification_type enum (no CREATE TYPE IF NOT EXISTS in
--    PG, so guard with a DO block). Only types backed by real triggers are
--    listed; future types are added additively via ALTER TYPE ... ADD VALUE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_notification_type') THEN
    CREATE TYPE public.user_notification_type AS ENUM ('ANNOUNCEMENT', 'NEW_BOOK');
  END IF;
END
$$;

-- 2. Create the user_notifications table.
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.user_notification_type NOT NULL,
  title varchar(200) NOT NULL,
  message text NOT NULL,
  link varchar(500),
  entity_type varchar(50),
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
);

-- 3. Indexes (each in its own statement — neon prepared statements cannot
--    batch multiple commands).
--    Dedup: once per user per business event.
CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedup_idx
  ON public.user_notifications (user_id, type, entity_id);
--    Inbox list (filter by user, newest first).
CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications (user_id, created_at);
--    Unread badge count.
CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications (user_id, is_read);

COMMIT;