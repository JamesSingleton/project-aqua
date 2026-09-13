-- Named relay teams (A/B/C) hold the coach-entered team seed (Hy-Tek F1).
CREATE TABLE IF NOT EXISTS "meet_relay_teams" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "meet_event_id" text NOT NULL REFERENCES "meet_events"("id") ON DELETE CASCADE,
  "relay_letter" text NOT NULL DEFAULT 'A',
  "seed_time_ms" integer,
  "seed_time_source" "seed_time_source" NOT NULL DEFAULT 'no_time',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "meet_relay_teams_event_letter_idx"
  ON "meet_relay_teams" ("meet_id", "meet_event_id", "relay_letter");

CREATE INDEX IF NOT EXISTS "meet_relay_teams_meet_idx"
  ON "meet_relay_teams" ("meet_id");

COMMENT ON TABLE "public"."meet_relay_teams" IS
  'One row per named relay (event + A/B/C) for team seed time; legs stay on meet_relay_legs.';
