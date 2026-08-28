-- Migration: Add announcements table (text-only announcement system).
--
-- A news/notice feed for the library managed by admins/librarians and read
-- by all users. Announcements are TEXT ONLY for now (title + content):
--   - no media columns, no storage provider, no audience targeting — every
--     announcement is intended for everyone.
--   - future media support can be added additively without reshaping this
--     table (see the media-architecture audit).
--
-- Lifecycle: DRAFT -> PUBLISHED -> ARCHIVED. Publishing a DRAFT stamps
-- published_at; re-publishing an ARCHIVED/PUBLISHED announcement NEVER
-- overwrites the original published_at. Only PUBLISHED rows are ever exposed
-- to normal users; DRAFT/ARCHIVED are admin-facing only.
--
-- Idempotent, additive, safe to re-run. Follows the convention of recent
-- hand-written migrations (0019 notifications, 0018 contact-messages, ...).
BEGIN;

-- 1. Create the announcement_status enum (no CREATE TYPE IF NOT EXISTS in PG,
--    so guard with a DO block).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_status') THEN
    CREATE TYPE public.announcement_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END
$$;

-- 2. Create the announcements table.
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  content text NOT NULL,
  status public.announcement_status NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

-- 3. Query-supporting indexes.
--    status:    the dominant filter (admin list + user feed both filter on it)
--    published_at: the user feed sorts by it
--    created_at:   the admin list sorts/filters by it
CREATE INDEX IF NOT EXISTS announcements_status_idx
  ON public.announcements (status);
CREATE INDEX IF NOT EXISTS announcements_published_at_idx
  ON public.announcements (published_at);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx
  ON public.announcements (created_at);

COMMIT;