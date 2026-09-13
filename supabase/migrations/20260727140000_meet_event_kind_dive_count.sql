-- Meet events: diving events-list MVP (Admin Hy-Tek roadmap Phase 4).
-- Diving events (Hy-Tek EV3 stroke `F` / HYV stroke `6`) parse as unscored,
-- distance-0 rows with an optional dive count. `event_kind` lets the events
-- UI label them "Diving" instead of treating them as a swim stroke.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'meet_event_kind'
  ) THEN
    CREATE TYPE "public"."meet_event_kind" AS ENUM ('swim', 'dive');
  END IF;
END
$$;

ALTER TABLE "public"."meet_events"
  ADD COLUMN IF NOT EXISTS "event_kind" "public"."meet_event_kind" NOT NULL DEFAULT 'swim',
  ADD COLUMN IF NOT EXISTS "dive_count" integer;

COMMENT ON COLUMN "public"."meet_events"."event_kind" IS
  'swim | dive — diving events (Hy-Tek EV3 "F" / HYV "6") are unscored, distance-0 rows';
COMMENT ON COLUMN "public"."meet_events"."dive_count" IS
  'Number of dives (EV3/HYV dive-count field), diving events only';
