-- Association scoring caps (HS) on the team, optional per-meet override.
ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "max_scoring_entries_per_individual_event" integer,
  ADD COLUMN IF NOT EXISTS "max_relay_teams_per_event" integer;

ALTER TABLE "meets"
  ADD COLUMN IF NOT EXISTS "max_scoring_entries_per_individual_event" integer,
  ADD COLUMN IF NOT EXISTS "max_relay_teams_per_event" integer;

COMMENT ON COLUMN "public"."organization"."max_scoring_entries_per_individual_event" IS
  'High-school association: max non-exhibition names per individual event. Null = unlimited.';
COMMENT ON COLUMN "public"."organization"."max_relay_teams_per_event" IS
  'High-school association: max relay teams (A/B/C) per relay event. Null = unlimited.';
COMMENT ON COLUMN "public"."meets"."max_scoring_entries_per_individual_event" IS
  'Optional meet override for scoring names per individual event. Null = inherit team.';
COMMENT ON COLUMN "public"."meets"."max_relay_teams_per_event" IS
  'Optional meet override for relay teams per relay event. Null = inherit team.';
