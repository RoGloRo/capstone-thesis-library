// scripts/apply-notifications-migration.ts
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { notifications } from "@/database/schema";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const createCategoryEnum = sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'notification_category'
    ) THEN
      CREATE TYPE public.notification_category AS ENUM ('BOOK', 'ACCOUNT', 'MESSAGE', 'SYSTEM');
    END IF;
  END $$;
`;

const createTypeEnum = sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'notification_type'
    ) THEN
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
  END $$;
`;

const createTable = sql`
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
`;

const createDedupIndex = sql`
  CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedup_idx
    ON public.notifications (type, entity_type, entity_id);
`;
const createCategoryIndex = sql`
  CREATE INDEX IF NOT EXISTS notifications_category_idx
    ON public.notifications (category);
`;
const createReadIndex = sql`
  CREATE INDEX IF NOT EXISTS notifications_is_read_idx
    ON public.notifications (is_read);
`;
const createCreatedIndex = sql`
  CREATE INDEX IF NOT EXISTS notifications_created_at_idx
    ON public.notifications (created_at);
`;

async function main() {
  try {
    console.log("Running notifications migration...");
    const db = drizzle(neon(DATABASE_URL!));

    await db.execute(createCategoryEnum);
    await db.execute(createTypeEnum);
    console.log("✓ Enums ready (notification_category, notification_type)");

    await db.execute(createTable);
    console.log("✓ Table created (notifications)");

    await db.execute(createDedupIndex);
    await db.execute(createCategoryIndex);
    await db.execute(createReadIndex);
    await db.execute(createCreatedIndex);
    console.log("✓ Indexes created");

    // Smoke test: insert a temp row then delete it.
    const [smoke] = await db
      .insert(notifications)
      .values({
        category: "BOOK",
        type: "BOOK_BORROWED",
        title: "__migration_smoke_test__",
        message: "Temporary row to verify notifications works",
      })
      .returning({
        id: notifications.id,
        category: notifications.category,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      });

    console.log("✓ Insert smoke test passed:", smoke);

    await db.execute(sql`DELETE FROM notifications WHERE id = ${smoke.id};`);
    console.log("✓ Smoke test row cleaned up");

    console.log("\nNotifications migration completed successfully!");
  } catch (error) {
    console.error("Error running notifications migration:", error);
    process.exit(1);
  }
}

main();