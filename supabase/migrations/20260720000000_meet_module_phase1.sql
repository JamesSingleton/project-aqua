-- Meet module Phase 1: event gender enum, seed time source, previous best, time standards, entry limits

-- 1.1 Event gender enum (male | female | mixed)
-- Guard enum creation so this migration can recover from a partially failed
-- drizzle-kit push (Postgres can commit enum creation before a later cast fails).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'event_gender'
  ) THEN
    CREATE TYPE "public"."event_gender" AS ENUM ('male', 'female', 'mixed');
  END IF;
END
$$;

-- Migrate swim_events.gender text m/f → event_gender
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'swim_events'
      AND column_name = 'gender'
      AND udt_name <> 'event_gender'
  ) THEN
    ALTER TABLE "public"."swim_events"
      ALTER COLUMN "gender" DROP DEFAULT;
    ALTER TABLE "public"."swim_events"
      ALTER COLUMN "gender" TYPE "public"."event_gender"
      USING (
        CASE
          WHEN lower("gender") IN ('f', 'female', 'g', 'girl', 'w', 'women') THEN 'female'::"public"."event_gender"
          WHEN lower("gender") IN ('x', 'mixed', 'open', 'b') THEN 'mixed'::"public"."event_gender"
          ELSE 'male'::"public"."event_gender"
        END
      );
  END IF;
END
$$;

-- Migrate meet_events.gender
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meet_events'
      AND column_name = 'gender'
      AND udt_name <> 'event_gender'
  ) THEN
    ALTER TABLE "public"."meet_events"
      ALTER COLUMN "gender" TYPE "public"."event_gender"
      USING (
        CASE
          WHEN lower("gender") IN ('f', 'female', 'g', 'girl', 'w', 'women') THEN 'female'::"public"."event_gender"
          WHEN lower("gender") IN ('x', 'mixed', 'open') THEN 'mixed'::"public"."event_gender"
          ELSE 'male'::"public"."event_gender"
        END
      );
  END IF;
END
$$;

-- 1.2 Seed time source on meet_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'seed_time_source'
  ) THEN
    CREATE TYPE "public"."seed_time_source" AS ENUM ('personal_best', 'manual', 'no_time');
  END IF;
END
$$;

ALTER TABLE "public"."meet_entries"
  ADD COLUMN IF NOT EXISTS "seed_time_source" "public"."seed_time_source";

UPDATE "public"."meet_entries"
SET "seed_time_source" = CASE
  WHEN "seed_time_ms" IS NOT NULL THEN 'personal_best'::"public"."seed_time_source"
  ELSE 'no_time'::"public"."seed_time_source"
END
WHERE "seed_time_source" IS NULL;

ALTER TABLE "public"."meet_entries"
  ALTER COLUMN "seed_time_source" SET DEFAULT 'no_time'::"public"."seed_time_source",
  ALTER COLUMN "seed_time_source" SET NOT NULL;

-- 1.3 Previous best snapshot on meet_results
ALTER TABLE "public"."meet_results"
  ADD COLUMN IF NOT EXISTS "previous_best_time_ms" integer;

-- 1.4 Time standard tables
CREATE TABLE IF NOT EXISTS "public"."time_standard_sets" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "public"."organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "course" "public"."course" NOT NULL DEFAULT 'SCY',
  "season_label" text,
  "source_file_path" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."time_standard_cuts" (
  "id" text PRIMARY KEY NOT NULL,
  "set_id" text NOT NULL REFERENCES "public"."time_standard_sets"("id") ON DELETE CASCADE,
  "event_key" text NOT NULL REFERENCES "public"."swim_events"("event_key"),
  "gender" "public"."event_gender" NOT NULL,
  "age_group" text NOT NULL,
  "time_ms" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "time_standard_cuts_set_id_idx"
  ON "public"."time_standard_cuts" ("set_id");

CREATE INDEX IF NOT EXISTS "time_standard_cuts_lookup_idx"
  ON "public"."time_standard_cuts" ("set_id", "event_key", "gender", "age_group");

-- 1.5 Entry limits on meets
ALTER TABLE "public"."meets"
  ADD COLUMN IF NOT EXISTS "max_individual_entries" integer,
  ADD COLUMN IF NOT EXISTS "max_relay_entries" integer,
  ADD COLUMN IF NOT EXISTS "max_combined_entries" integer,
  ADD COLUMN IF NOT EXISTS "entry_limit_packages" jsonb,
  ADD COLUMN IF NOT EXISTS "entry_limits_source" text;

COMMENT ON COLUMN "public"."meets"."entry_limits_source" IS
  'Provenance for entry limits: import | manual';

COMMENT ON COLUMN "public"."meet_results"."previous_best_time_ms" IS
  'Best time snapshot before this result was recorded; used for stable improvement display';
