-- Meet entries: exhibition flag (Hy-Tek E1 col 84 `X`).

ALTER TABLE "public"."meet_entries"
  ADD COLUMN IF NOT EXISTS "exhibition" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."meet_entries"."exhibition" IS
  'Swum outside the scored field (Hy-Tek E1 col 84 X)';
