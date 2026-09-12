-- Meet results: championship round, heat/lane, exhibition flag, DQ reason code
-- (Admin Hy-Tek roadmap Phase 3 — supports faithful HY3 E2/H1 import).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'meet_result_round'
  ) THEN
    CREATE TYPE "public"."meet_result_round" AS ENUM ('prelim', 'swimoff', 'finals');
  END IF;
END
$$;

ALTER TABLE "public"."meet_results"
  ADD COLUMN IF NOT EXISTS "round" "public"."meet_result_round",
  ADD COLUMN IF NOT EXISTS "heat" integer,
  ADD COLUMN IF NOT EXISTS "lane" integer,
  ADD COLUMN IF NOT EXISTS "exhibition" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "dq_code" text;

COMMENT ON COLUMN "public"."meet_results"."round" IS
  'Championship round when known (Hy-Tek E2/HYV): prelim | swimoff | finals';
COMMENT ON COLUMN "public"."meet_results"."dq_code" IS
  'Hy-Tek DQ reason code (E2/H1), e.g. "1F" false start, "2K" kick';
COMMENT ON COLUMN "public"."meet_results"."exhibition" IS
  'Swum outside the scored field (Hy-Tek E1 col 84 "X")';
