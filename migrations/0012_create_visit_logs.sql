CREATE TABLE IF NOT EXISTS "visit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "visit_date" date NOT NULL,
  "visit_time" varchar(10) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "visit_logs_user_idx" ON "visit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "visit_logs_date_idx" ON "visit_logs" ("visit_date");
