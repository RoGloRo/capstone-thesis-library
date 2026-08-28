// scripts/apply-announcements-migration.ts
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { announcements } from "@/database/schema";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const createStatusEnum = sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'announcement_status'
    ) THEN
      CREATE TYPE public.announcement_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
    END IF;
  END $$;
`;

const createTable = sql`
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
`;

const createStatusIndex = sql`
  CREATE INDEX IF NOT EXISTS announcements_status_idx
    ON public.announcements (status);
`;
const createPublishedAtIndex = sql`
  CREATE INDEX IF NOT EXISTS announcements_published_at_idx
    ON public.announcements (published_at);
`;
const createCreatedAtIndex = sql`
  CREATE INDEX IF NOT EXISTS announcements_created_at_idx
    ON public.announcements (created_at);
`;

async function main() {
  try {
    console.log("Running announcements migration...");
    const db = drizzle(neon(DATABASE_URL!));

    await db.execute(createStatusEnum);
    console.log("✓ Enum ready (announcement_status)");

    await db.execute(createTable);
    console.log("✓ Table created (announcements)");

    await db.execute(createStatusIndex);
    await db.execute(createPublishedAtIndex);
    await db.execute(createCreatedAtIndex);
    console.log("✓ Indexes created");

    // Smoke test: insert a temp row then delete it.
    const [smoke] = await db
      .insert(announcements)
      .values({
        title: "__migration_smoke_test__",
        content: "Temporary row to verify announcements works",
      })
      .returning({
        id: announcements.id,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
      });

    console.log("✓ Insert smoke test passed:", smoke);

    await db.execute(sql`DELETE FROM announcements WHERE id = ${smoke.id};`);
    console.log("✓ Smoke test row cleaned up");

    console.log("\nAnnouncements migration completed successfully!");
  } catch (error) {
    console.error("Error running announcements migration:", error);
    process.exit(1);
  }
}

main();