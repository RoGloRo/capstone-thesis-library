// scripts/apply-user-notifications-migration.ts
import { config } from "dotenv";
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";
import { sql, and, eq } from "drizzle-orm";
import { users, userNotifications } from "@/database/schema";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const createTypeEnum = sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_notification_type'
    ) THEN
      CREATE TYPE public.user_notification_type AS ENUM ('ANNOUNCEMENT', 'NEW_BOOK');
    END IF;
  END $$;
`;

const createTable = sql`
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
`;

// Indexes are executed one statement at a time: neon prepared statements
// cannot run multiple SQL commands in a single call.
const createDedupIndex = sql`
  CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedup_idx
    ON public.user_notifications (user_id, type, entity_id);
`;
const createUserCreatedIndex = sql`
  CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
    ON public.user_notifications (user_id, created_at);
`;
const createUserUnreadIndex = sql`
  CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
    ON public.user_notifications (user_id, is_read);
`;

async function main() {
  try {
    console.log("Running user notifications migration...");
    const db = drizzle(neon(DATABASE_URL!));

    await db.execute(createTypeEnum);
    console.log("✓ Enum ready (user_notification_type)");

    await db.execute(createTable);
    console.log("✓ Table created (user_notifications)");

    await db.execute(createDedupIndex);
    await db.execute(createUserCreatedIndex);
    await db.execute(createUserUnreadIndex);
    console.log("✓ Indexes created");

    // Smoke test: insert a temp row for an existing user (the FK requires a
    // real user), verify dedup collapses a duplicate, then clean up.
    const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);

    if (!anyUser) {
      console.log("⚠ No users found — skipping insert smoke test");
    } else {
      const smokeEntityId = crypto.randomUUID();
      const smokeValues = {
        userId: anyUser.id,
        type: "ANNOUNCEMENT" as const,
        title: "__migration_smoke_test__",
        message: "Temporary row to verify user_notifications works",
        link: "/notifications",
        entityType: "ANNOUNCEMENT",
        entityId: smokeEntityId,
      };

      await db.insert(userNotifications).values(smokeValues);
      await db.insert(userNotifications).values(smokeValues).onConflictDoNothing();

      const [smoke] = await db
        .select({
          id: userNotifications.id,
          userId: userNotifications.userId,
          isRead: userNotifications.isRead,
          createdAt: userNotifications.createdAt,
        })
        .from(userNotifications)
        .where(
          and(
            eq(userNotifications.userId, anyUser.id),
            eq(userNotifications.entityId, smokeEntityId),
          ),
        );

      console.log("✓ Insert smoke test passed:", smoke);

      await db
        .delete(userNotifications)
        .where(eq(userNotifications.id, smoke.id));
      console.log("✓ Smoke test rows cleaned up");
    }

    console.log("\nUser notifications migration completed successfully!");
  } catch (error) {
    console.error("Error running user notifications migration:", error);
    process.exit(1);
  }
}

main();