-- Migration: Add contact_messages table.
--
-- Backend for the public "Contact Us" / "Send Us a Message" form. Messages can
-- be submitted by guests (userId NULL) or authenticated users (userId set).
-- The userId FK uses ON DELETE SET NULL so historical messages survive even if
-- the linked account is later deleted.
--
-- Idempotent, following the convention of recent hand-written migrations
-- (0013 published-year, 0016 university-id, 0017 user-category/grade-level).
BEGIN;

-- 1. Create the message_status enum type (no CREATE TYPE IF NOT EXISTS in PG,
--    so guard with a DO block).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
    CREATE TYPE public.message_status AS ENUM ('UNREAD', 'READ', 'RESOLVED');
  END IF;
END
$$;

-- 2. Create the contact_messages table.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  message text NOT NULL,
  status public.message_status NOT NULL DEFAULT 'UNREAD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL
);

-- 3. Index for the dominant admin query (filter by status).
CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON public.contact_messages (status);

COMMIT;