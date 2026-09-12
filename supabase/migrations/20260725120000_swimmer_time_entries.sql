-- Dated coach-entered times for progression (club / mock / practice)

CREATE TYPE "public"."swimmer_time_entry_source" AS ENUM ('manual');

CREATE TABLE "public"."swimmer_time_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "swimmer_id" text NOT NULL REFERENCES "public"."swimmers"("id") ON DELETE CASCADE,
  "event_key" text NOT NULL REFERENCES "public"."swim_events"("event_key"),
  "course" "public"."course" NOT NULL,
  "time_ms" integer NOT NULL,
  "achieved_at" timestamp NOT NULL,
  "source" "public"."swimmer_time_entry_source" NOT NULL DEFAULT 'manual',
  "label" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "idx_swimmer_time_entries_swimmer_achieved"
  ON "public"."swimmer_time_entries" ("swimmer_id", "achieved_at");

CREATE INDEX "idx_swimmer_time_entries_swimmer_event"
  ON "public"."swimmer_time_entries" ("swimmer_id", "event_key", "course");
