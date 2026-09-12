-- Hot-path and FK indexes for Better Auth, organization, and meet/roster queries.
-- Postgres does not auto-index FK columns; cascades and JOINs need these.

-- Better Auth / organization (session revoke, org list, invites, verification)
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE INDEX IF NOT EXISTS "member_user_id_idx" ON "member" ("user_id");
CREATE INDEX IF NOT EXISTS "invitation_organization_id_status_idx"
  ON "invitation" ("organization_id", "status");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" ("email");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON "verification" ("identifier");

-- Meet child tables (dominant coach SaaS path: list by meet_id)
CREATE INDEX IF NOT EXISTS "meet_events_meet_id_idx" ON "meet_events" ("meet_id");
CREATE INDEX IF NOT EXISTS "meet_entries_meet_id_idx" ON "meet_entries" ("meet_id");
CREATE INDEX IF NOT EXISTS "meet_entries_membership_id_idx"
  ON "meet_entries" ("membership_id");
CREATE INDEX IF NOT EXISTS "meet_entries_meet_event_id_idx"
  ON "meet_entries" ("meet_event_id");
CREATE INDEX IF NOT EXISTS "meet_results_meet_id_idx" ON "meet_results" ("meet_id");
CREATE INDEX IF NOT EXISTS "meet_results_swimmer_id_idx"
  ON "meet_results" ("swimmer_id");
CREATE INDEX IF NOT EXISTS "meet_results_meet_event_id_idx"
  ON "meet_results" ("meet_event_id");
CREATE INDEX IF NOT EXISTS "meet_commitments_membership_id_idx"
  ON "meet_commitments" ("membership_id");
CREATE INDEX IF NOT EXISTS "meet_relay_legs_membership_id_idx"
  ON "meet_relay_legs" ("membership_id");
CREATE INDEX IF NOT EXISTS "meet_relay_legs_meet_event_id_idx"
  ON "meet_relay_legs" ("meet_event_id");
CREATE INDEX IF NOT EXISTS "meet_relay_result_splits_membership_id_idx"
  ON "meet_relay_result_splits" ("membership_id");

-- Meets list: org filter + start_date order (replaces single-column org index)
CREATE INDEX IF NOT EXISTS "meets_org_start_date_idx"
  ON "meets" ("organization_id", "start_date" DESC);
DROP INDEX IF EXISTS "idx_meets_org";

-- Roster reverse lookups and active membership filter
CREATE INDEX IF NOT EXISTS "team_swimmer_memberships_swimmer_id_idx"
  ON "team_swimmer_memberships" ("swimmer_id");
CREATE INDEX IF NOT EXISTS "team_swimmer_memberships_org_active_idx"
  ON "team_swimmer_memberships" ("organization_id")
  WHERE "status" = 'active';

-- Attendance
CREATE INDEX IF NOT EXISTS "attendance_records_practice_session_id_idx"
  ON "attendance_records" ("practice_session_id");
CREATE INDEX IF NOT EXISTS "attendance_records_membership_id_idx"
  ON "attendance_records" ("membership_id");

-- Calendar
CREATE INDEX IF NOT EXISTS "team_calendar_events_org_starts_at_idx"
  ON "team_calendar_events" ("organization_id", "starts_at");
CREATE INDEX IF NOT EXISTS "calendar_feed_tokens_organization_id_idx"
  ON "calendar_feed_tokens" ("organization_id");
CREATE INDEX IF NOT EXISTS "calendar_event_links_aqua_event_id_idx"
  ON "calendar_event_links" ("aqua_event_id");
CREATE INDEX IF NOT EXISTS "calendar_sync_conflicts_organization_id_idx"
  ON "calendar_sync_conflicts" ("organization_id");

-- Org-scoped support tables
CREATE INDEX IF NOT EXISTS "import_jobs_organization_id_idx"
  ON "import_jobs" ("organization_id");
CREATE INDEX IF NOT EXISTS "time_standard_sets_organization_id_idx"
  ON "time_standard_sets" ("organization_id");
CREATE INDEX IF NOT EXISTS "safesport_reports_organization_id_idx"
  ON "safesport_reports" ("organization_id");
CREATE INDEX IF NOT EXISTS "maapp_acknowledgments_season_id_idx"
  ON "maapp_acknowledgments" ("season_id");
