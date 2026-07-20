-- Per-meet entry qualifying times imported from EV3/HYV event files.
ALTER TABLE "meet_events"
ADD COLUMN IF NOT EXISTS "qualifying_time_ms" integer;
