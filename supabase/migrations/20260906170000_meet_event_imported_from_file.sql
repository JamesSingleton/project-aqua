-- Track which meet events came from a host file vs Add event.
ALTER TABLE "meet_events"
  ADD COLUMN IF NOT EXISTS "imported_from_file" boolean NOT NULL DEFAULT false;

UPDATE "meet_events" AS e
SET "imported_from_file" = true
FROM "meets" AS m
WHERE e."meet_id" = m."id"
  AND m."import_source" IS NOT NULL
  AND btrim(m."import_source") <> '';

COMMENT ON COLUMN "public"."meet_events"."imported_from_file" IS
  'True when the event was created from a meet file. False for hand-added events.';
