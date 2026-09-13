-- Snapshot the racing lineup when a relay performance is recorded.
-- Unlike meet_relay_legs, these rows are never replaced by entry-lineup edits.

CREATE TABLE IF NOT EXISTS "meet_relay_result_members" (
  "id" text PRIMARY KEY NOT NULL,
  "result_id" text NOT NULL REFERENCES "meet_relay_results"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "leg_order" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "meet_relay_result_members_leg_idx"
  ON "meet_relay_result_members" ("result_id", "leg_order");

CREATE INDEX IF NOT EXISTS "meet_relay_result_members_membership_id_idx"
  ON "meet_relay_result_members" ("membership_id");

ALTER TABLE public.meet_relay_result_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_relay_result_members FORCE ROW LEVEL SECURITY;

CREATE POLICY meet_relay_result_members_via_result
  ON public.meet_relay_result_members
  FOR ALL TO aqua_app
  USING ((SELECT private.can_access_relay_result(result_id)))
  WITH CHECK ((SELECT private.can_access_relay_result(result_id)));

COMMENT ON TABLE public.meet_relay_result_members IS
  'Immutable racing-lineup snapshot for a recorded relay result; individual split times are stored separately.';
