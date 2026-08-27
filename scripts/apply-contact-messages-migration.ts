// scripts/apply-contact-messages-migration.ts
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { contactMessages } from "@/database/schema";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const createTypeEnum = sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type
      WHERE typname = 'message_status'
        AND typcategory = 'E'
    ) THEN
      CREATE TYPE message_status AS ENUM ('UNREAD', 'READ', 'RESOLVED');
    END IF;
  END $$;
`;

const createTable = sql`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() UNIQUE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    message TEXT NOT NULL,
    status message_status DEFAULT 'UNREAD' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
  );
`;

const createIndex = sql`
  CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages (status);
`;

async function main() {
  try {
    console.log("Running contact messages migration...");
    const db = drizzle(neon(DATABASE_URL!));

    await db.execute(createTypeEnum);
    console.log("✓ Enum ready (message_status)");

    await db.execute(createTable);
    console.log("✓ Table created (contact_messages)");

    await db.execute(createIndex);
    console.log("✓ Index created (contact_messages_status_idx)");

    // Smoke test: insert a temp row then delete it.
    const [smoke] = await db
      .insert(contactMessages)
      .values({
        name: "__migration_smoke_test__",
        email: "smoke@test.local",
        message: "Temporary row to verify contact_messages works",
      })
      .returning({
        id: contactMessages.id,
        userId: contactMessages.userId,
        status: contactMessages.status,
        createdAt: contactMessages.createdAt,
      });

    console.log("✓ Insert smoke test passed:", smoke);

    await db.execute(
      sql`DELETE FROM contact_messages WHERE id = ${smoke.id};`,
    );
    console.log("✓ Smoke test row cleaned up");

    console.log("\nContact messages migration completed successfully!");
  } catch (error) {
    console.error("Error running contact messages migration:", error);
    process.exit(1);
  }
}

main();
