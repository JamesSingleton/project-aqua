-- FK indexes for ON DELETE CASCADE from meet_events → relay children
CREATE INDEX IF NOT EXISTS "meet_relay_teams_meet_event_id_idx"
  ON "meet_relay_teams" ("meet_event_id");
CREATE INDEX IF NOT EXISTS "meet_relay_results_meet_event_id_idx"
  ON "meet_relay_results" ("meet_event_id");
