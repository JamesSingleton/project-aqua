-- Track when a time standard set was last changed (metadata or cuts).
ALTER TABLE "public"."time_standard_sets"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

UPDATE "public"."time_standard_sets"
SET "updated_at" = "created_at"
WHERE "updated_at" IS DISTINCT FROM "created_at";
