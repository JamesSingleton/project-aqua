-- Team relay results (overall + named splits). Separate from lineup
-- meet_relay_teams / meet_relay_legs so entries replace cannot wipe times.

CREATE TABLE IF NOT EXISTS "meet_relay_results" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "meet_event_id" text NOT NULL REFERENCES "meet_events"("id") ON DELETE CASCADE,
  "relay_letter" text NOT NULL DEFAULT 'A',
  "round" "meet_result_round",
  "time_ms" integer NOT NULL,
  "heat" integer,
  "lane" integer,
  "exhibition" boolean NOT NULL DEFAULT false,
  "is_dq" boolean NOT NULL DEFAULT false,
  "dq_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "meet_relay_results_attempt_idx"
  ON "meet_relay_results" ("meet_id", "meet_event_id", "relay_letter", "round")
  NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS "meet_relay_results_meet_idx"
  ON "meet_relay_results" ("meet_id");

CREATE TABLE IF NOT EXISTS "meet_relay_result_splits" (
  "id" text PRIMARY KEY NOT NULL,
  "result_id" text NOT NULL REFERENCES "meet_relay_results"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "leg_order" integer NOT NULL,
  "time_ms" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "meet_relay_result_splits_leg_idx"
  ON "meet_relay_result_splits" ("result_id", "leg_order");

COMMENT ON TABLE "public"."meet_relay_results" IS
  'Recorded team time for a named relay (event + letter + round); not used for Hy-Tek entry lineup.';
COMMENT ON TABLE "public"."meet_relay_result_splits" IS
  'Named swimmer split for a recorded relay result. Lead-off (leg 1) may credit an individual best.';
