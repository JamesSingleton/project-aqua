-- SwimCloud-style swimmer affiliations, swim_events catalog, SafeSport compliance

CREATE TYPE "public"."governing_body" AS ENUM('usa_swimming');
CREATE TYPE "public"."event_type" AS ENUM('individual', 'relay');
CREATE TYPE "public"."credential_type" AS ENUM(
  'safesport_core', 'safesport_refresher_1', 'safesport_refresher_2', 'safesport_refresher_3',
  'background_check', 'cpr_aed', 'stsc'
);
CREATE TYPE "public"."credential_status" AS ENUM('current', 'expired', 'pending', 'not_started');
CREATE TYPE "public"."credential_verified_by" AS ENUM('manual_upload', 'usa_swimming_sync', 'safesport_lms_webhook');
CREATE TYPE "public"."acknowledgment_by" AS ENUM('parent_guardian', 'athlete', 'adult_athlete');
CREATE TYPE "public"."report_category" AS ENUM(
  'emotional_misconduct', 'physical_misconduct', 'sexual_misconduct', 'maapp_violation', 'other'
);
CREATE TYPE "public"."report_status" AS ENUM('submitted', 'under_review', 'resolved', 'referred_to_center');

-- Extend swimmers
ALTER TABLE "swimmers" ADD COLUMN "middle_name" text;
ALTER TABLE "swimmers" ADD COLUMN "preferred_name" text;
ALTER TABLE "swimmers" ADD COLUMN "email" text;
ALTER TABLE "swimmers" ADD COLUMN "phone" text;
ALTER TABLE "swimmers" ADD COLUMN "governing_body" "governing_body";
ALTER TABLE "swimmers" ADD COLUMN "governing_body_id" text;

CREATE UNIQUE INDEX "swimmers_governing_body_id_idx" ON "swimmers" ("governing_body_id") WHERE "governing_body_id" IS NOT NULL;

-- swim_events reference table
CREATE TABLE "swim_events" (
  "event_key" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "distance" integer NOT NULL,
  "stroke" text NOT NULL,
  "course" "course" NOT NULL,
  "gender" text NOT NULL,
  "event_type" "event_type" DEFAULT 'individual' NOT NULL,
  "relay_legs" integer
);

-- Auto-generated swim_events seed (134 events)
INSERT INTO "swim_events" ("event_key", "label", "distance", "stroke", "course", "gender", "event_type", "relay_legs")
VALUES
('50_free_scy_m', '50 Freestyle SCY', 50, 'free', 'SCY', 'm', 'individual', NULL),
('50_free_scy_f', '50 Freestyle SCY', 50, 'free', 'SCY', 'f', 'individual', NULL),
('100_free_scy_m', '100 Freestyle SCY', 100, 'free', 'SCY', 'm', 'individual', NULL),
('100_free_scy_f', '100 Freestyle SCY', 100, 'free', 'SCY', 'f', 'individual', NULL),
('200_free_scy_m', '200 Freestyle SCY', 200, 'free', 'SCY', 'm', 'individual', NULL),
('200_free_scy_f', '200 Freestyle SCY', 200, 'free', 'SCY', 'f', 'individual', NULL),
('500_free_scy_m', '500 Freestyle SCY', 500, 'free', 'SCY', 'm', 'individual', NULL),
('500_free_scy_f', '500 Freestyle SCY', 500, 'free', 'SCY', 'f', 'individual', NULL),
('1000_free_scy_m', '1000 Freestyle SCY', 1000, 'free', 'SCY', 'm', 'individual', NULL),
('1000_free_scy_f', '1000 Freestyle SCY', 1000, 'free', 'SCY', 'f', 'individual', NULL),
('1650_free_scy_m', '1650 Freestyle SCY', 1650, 'free', 'SCY', 'm', 'individual', NULL),
('1650_free_scy_f', '1650 Freestyle SCY', 1650, 'free', 'SCY', 'f', 'individual', NULL),
('50_back_scy_m', '50 Backstroke SCY', 50, 'back', 'SCY', 'm', 'individual', NULL),
('50_back_scy_f', '50 Backstroke SCY', 50, 'back', 'SCY', 'f', 'individual', NULL),
('100_back_scy_m', '100 Backstroke SCY', 100, 'back', 'SCY', 'm', 'individual', NULL),
('100_back_scy_f', '100 Backstroke SCY', 100, 'back', 'SCY', 'f', 'individual', NULL),
('200_back_scy_m', '200 Backstroke SCY', 200, 'back', 'SCY', 'm', 'individual', NULL),
('200_back_scy_f', '200 Backstroke SCY', 200, 'back', 'SCY', 'f', 'individual', NULL),
('50_breast_scy_m', '50 Breaststroke SCY', 50, 'breast', 'SCY', 'm', 'individual', NULL),
('50_breast_scy_f', '50 Breaststroke SCY', 50, 'breast', 'SCY', 'f', 'individual', NULL),
('100_breast_scy_m', '100 Breaststroke SCY', 100, 'breast', 'SCY', 'm', 'individual', NULL),
('100_breast_scy_f', '100 Breaststroke SCY', 100, 'breast', 'SCY', 'f', 'individual', NULL),
('200_breast_scy_m', '200 Breaststroke SCY', 200, 'breast', 'SCY', 'm', 'individual', NULL),
('200_breast_scy_f', '200 Breaststroke SCY', 200, 'breast', 'SCY', 'f', 'individual', NULL),
('50_fly_scy_m', '50 Butterfly SCY', 50, 'fly', 'SCY', 'm', 'individual', NULL),
('50_fly_scy_f', '50 Butterfly SCY', 50, 'fly', 'SCY', 'f', 'individual', NULL),
('100_fly_scy_m', '100 Butterfly SCY', 100, 'fly', 'SCY', 'm', 'individual', NULL),
('100_fly_scy_f', '100 Butterfly SCY', 100, 'fly', 'SCY', 'f', 'individual', NULL),
('200_fly_scy_m', '200 Butterfly SCY', 200, 'fly', 'SCY', 'm', 'individual', NULL),
('200_fly_scy_f', '200 Butterfly SCY', 200, 'fly', 'SCY', 'f', 'individual', NULL),
('100_im_scy_m', '100 Individual Medley SCY', 100, 'im', 'SCY', 'm', 'individual', NULL),
('100_im_scy_f', '100 Individual Medley SCY', 100, 'im', 'SCY', 'f', 'individual', NULL),
('200_im_scy_m', '200 Individual Medley SCY', 200, 'im', 'SCY', 'm', 'individual', NULL),
('200_im_scy_f', '200 Individual Medley SCY', 200, 'im', 'SCY', 'f', 'individual', NULL),
('400_im_scy_m', '400 Individual Medley SCY', 400, 'im', 'SCY', 'm', 'individual', NULL),
('400_im_scy_f', '400 Individual Medley SCY', 400, 'im', 'SCY', 'f', 'individual', NULL),
('50_free_scm_m', '50 Freestyle SCM', 50, 'free', 'SCM', 'm', 'individual', NULL),
('50_free_scm_f', '50 Freestyle SCM', 50, 'free', 'SCM', 'f', 'individual', NULL),
('100_free_scm_m', '100 Freestyle SCM', 100, 'free', 'SCM', 'm', 'individual', NULL),
('100_free_scm_f', '100 Freestyle SCM', 100, 'free', 'SCM', 'f', 'individual', NULL),
('200_free_scm_m', '200 Freestyle SCM', 200, 'free', 'SCM', 'm', 'individual', NULL),
('200_free_scm_f', '200 Freestyle SCM', 200, 'free', 'SCM', 'f', 'individual', NULL),
('400_free_scm_m', '400 Freestyle SCM', 400, 'free', 'SCM', 'm', 'individual', NULL),
('400_free_scm_f', '400 Freestyle SCM', 400, 'free', 'SCM', 'f', 'individual', NULL),
('800_free_scm_m', '800 Freestyle SCM', 800, 'free', 'SCM', 'm', 'individual', NULL),
('800_free_scm_f', '800 Freestyle SCM', 800, 'free', 'SCM', 'f', 'individual', NULL),
('1500_free_scm_m', '1500 Freestyle SCM', 1500, 'free', 'SCM', 'm', 'individual', NULL),
('1500_free_scm_f', '1500 Freestyle SCM', 1500, 'free', 'SCM', 'f', 'individual', NULL),
('50_back_scm_m', '50 Backstroke SCM', 50, 'back', 'SCM', 'm', 'individual', NULL),
('50_back_scm_f', '50 Backstroke SCM', 50, 'back', 'SCM', 'f', 'individual', NULL),
('100_back_scm_m', '100 Backstroke SCM', 100, 'back', 'SCM', 'm', 'individual', NULL),
('100_back_scm_f', '100 Backstroke SCM', 100, 'back', 'SCM', 'f', 'individual', NULL),
('200_back_scm_m', '200 Backstroke SCM', 200, 'back', 'SCM', 'm', 'individual', NULL),
('200_back_scm_f', '200 Backstroke SCM', 200, 'back', 'SCM', 'f', 'individual', NULL),
('50_breast_scm_m', '50 Breaststroke SCM', 50, 'breast', 'SCM', 'm', 'individual', NULL),
('50_breast_scm_f', '50 Breaststroke SCM', 50, 'breast', 'SCM', 'f', 'individual', NULL),
('100_breast_scm_m', '100 Breaststroke SCM', 100, 'breast', 'SCM', 'm', 'individual', NULL),
('100_breast_scm_f', '100 Breaststroke SCM', 100, 'breast', 'SCM', 'f', 'individual', NULL),
('200_breast_scm_m', '200 Breaststroke SCM', 200, 'breast', 'SCM', 'm', 'individual', NULL),
('200_breast_scm_f', '200 Breaststroke SCM', 200, 'breast', 'SCM', 'f', 'individual', NULL),
('50_fly_scm_m', '50 Butterfly SCM', 50, 'fly', 'SCM', 'm', 'individual', NULL),
('50_fly_scm_f', '50 Butterfly SCM', 50, 'fly', 'SCM', 'f', 'individual', NULL),
('100_fly_scm_m', '100 Butterfly SCM', 100, 'fly', 'SCM', 'm', 'individual', NULL),
('100_fly_scm_f', '100 Butterfly SCM', 100, 'fly', 'SCM', 'f', 'individual', NULL),
('200_fly_scm_m', '200 Butterfly SCM', 200, 'fly', 'SCM', 'm', 'individual', NULL),
('200_fly_scm_f', '200 Butterfly SCM', 200, 'fly', 'SCM', 'f', 'individual', NULL),
('100_im_scm_m', '100 Individual Medley SCM', 100, 'im', 'SCM', 'm', 'individual', NULL),
('100_im_scm_f', '100 Individual Medley SCM', 100, 'im', 'SCM', 'f', 'individual', NULL),
('200_im_scm_m', '200 Individual Medley SCM', 200, 'im', 'SCM', 'm', 'individual', NULL),
('200_im_scm_f', '200 Individual Medley SCM', 200, 'im', 'SCM', 'f', 'individual', NULL),
('400_im_scm_m', '400 Individual Medley SCM', 400, 'im', 'SCM', 'm', 'individual', NULL),
('400_im_scm_f', '400 Individual Medley SCM', 400, 'im', 'SCM', 'f', 'individual', NULL),
('50_free_lcm_m', '50 Freestyle LCM', 50, 'free', 'LCM', 'm', 'individual', NULL),
('50_free_lcm_f', '50 Freestyle LCM', 50, 'free', 'LCM', 'f', 'individual', NULL),
('100_free_lcm_m', '100 Freestyle LCM', 100, 'free', 'LCM', 'm', 'individual', NULL),
('100_free_lcm_f', '100 Freestyle LCM', 100, 'free', 'LCM', 'f', 'individual', NULL),
('200_free_lcm_m', '200 Freestyle LCM', 200, 'free', 'LCM', 'm', 'individual', NULL),
('200_free_lcm_f', '200 Freestyle LCM', 200, 'free', 'LCM', 'f', 'individual', NULL),
('400_free_lcm_m', '400 Freestyle LCM', 400, 'free', 'LCM', 'm', 'individual', NULL),
('400_free_lcm_f', '400 Freestyle LCM', 400, 'free', 'LCM', 'f', 'individual', NULL),
('800_free_lcm_m', '800 Freestyle LCM', 800, 'free', 'LCM', 'm', 'individual', NULL),
('800_free_lcm_f', '800 Freestyle LCM', 800, 'free', 'LCM', 'f', 'individual', NULL),
('1500_free_lcm_m', '1500 Freestyle LCM', 1500, 'free', 'LCM', 'm', 'individual', NULL),
('1500_free_lcm_f', '1500 Freestyle LCM', 1500, 'free', 'LCM', 'f', 'individual', NULL),
('50_back_lcm_m', '50 Backstroke LCM', 50, 'back', 'LCM', 'm', 'individual', NULL),
('50_back_lcm_f', '50 Backstroke LCM', 50, 'back', 'LCM', 'f', 'individual', NULL),
('100_back_lcm_m', '100 Backstroke LCM', 100, 'back', 'LCM', 'm', 'individual', NULL),
('100_back_lcm_f', '100 Backstroke LCM', 100, 'back', 'LCM', 'f', 'individual', NULL),
('200_back_lcm_m', '200 Backstroke LCM', 200, 'back', 'LCM', 'm', 'individual', NULL),
('200_back_lcm_f', '200 Backstroke LCM', 200, 'back', 'LCM', 'f', 'individual', NULL),
('50_breast_lcm_m', '50 Breaststroke LCM', 50, 'breast', 'LCM', 'm', 'individual', NULL),
('50_breast_lcm_f', '50 Breaststroke LCM', 50, 'breast', 'LCM', 'f', 'individual', NULL),
('100_breast_lcm_m', '100 Breaststroke LCM', 100, 'breast', 'LCM', 'm', 'individual', NULL),
('100_breast_lcm_f', '100 Breaststroke LCM', 100, 'breast', 'LCM', 'f', 'individual', NULL),
('200_breast_lcm_m', '200 Breaststroke LCM', 200, 'breast', 'LCM', 'm', 'individual', NULL),
('200_breast_lcm_f', '200 Breaststroke LCM', 200, 'breast', 'LCM', 'f', 'individual', NULL),
('50_fly_lcm_m', '50 Butterfly LCM', 50, 'fly', 'LCM', 'm', 'individual', NULL),
('50_fly_lcm_f', '50 Butterfly LCM', 50, 'fly', 'LCM', 'f', 'individual', NULL),
('100_fly_lcm_m', '100 Butterfly LCM', 100, 'fly', 'LCM', 'm', 'individual', NULL),
('100_fly_lcm_f', '100 Butterfly LCM', 100, 'fly', 'LCM', 'f', 'individual', NULL),
('200_fly_lcm_m', '200 Butterfly LCM', 200, 'fly', 'LCM', 'm', 'individual', NULL),
('200_fly_lcm_f', '200 Butterfly LCM', 200, 'fly', 'LCM', 'f', 'individual', NULL),
('200_im_lcm_m', '200 Individual Medley LCM', 200, 'im', 'LCM', 'm', 'individual', NULL),
('200_im_lcm_f', '200 Individual Medley LCM', 200, 'im', 'LCM', 'f', 'individual', NULL),
('400_im_lcm_m', '400 Individual Medley LCM', 400, 'im', 'LCM', 'm', 'individual', NULL),
('400_im_lcm_f', '400 Individual Medley LCM', 400, 'im', 'LCM', 'f', 'individual', NULL),
('200_free_relay_scy_m', '200 Freestyle Relay SCY', 200, 'free_relay', 'SCY', 'm', 'relay', 4),
('200_free_relay_scy_f', '200 Freestyle Relay SCY', 200, 'free_relay', 'SCY', 'f', 'relay', 4),
('200_free_relay_scm_m', '200 Freestyle Relay SCM', 200, 'free_relay', 'SCM', 'm', 'relay', 4),
('200_free_relay_scm_f', '200 Freestyle Relay SCM', 200, 'free_relay', 'SCM', 'f', 'relay', 4),
('200_free_relay_lcm_m', '200 Freestyle Relay LCM', 200, 'free_relay', 'LCM', 'm', 'relay', 4),
('200_free_relay_lcm_f', '200 Freestyle Relay LCM', 200, 'free_relay', 'LCM', 'f', 'relay', 4),
('400_free_relay_scy_m', '400 Freestyle Relay SCY', 400, 'free_relay', 'SCY', 'm', 'relay', 4),
('400_free_relay_scy_f', '400 Freestyle Relay SCY', 400, 'free_relay', 'SCY', 'f', 'relay', 4),
('400_free_relay_scm_m', '400 Freestyle Relay SCM', 400, 'free_relay', 'SCM', 'm', 'relay', 4),
('400_free_relay_scm_f', '400 Freestyle Relay SCM', 400, 'free_relay', 'SCM', 'f', 'relay', 4),
('400_free_relay_lcm_m', '400 Freestyle Relay LCM', 400, 'free_relay', 'LCM', 'm', 'relay', 4),
('400_free_relay_lcm_f', '400 Freestyle Relay LCM', 400, 'free_relay', 'LCM', 'f', 'relay', 4),
('800_free_relay_scm_m', '800 Freestyle Relay SCM', 800, 'free_relay', 'SCM', 'm', 'relay', 4),
('800_free_relay_scm_f', '800 Freestyle Relay SCM', 800, 'free_relay', 'SCM', 'f', 'relay', 4),
('800_free_relay_lcm_m', '800 Freestyle Relay LCM', 800, 'free_relay', 'LCM', 'm', 'relay', 4),
('800_free_relay_lcm_f', '800 Freestyle Relay LCM', 800, 'free_relay', 'LCM', 'f', 'relay', 4),
('200_medley_relay_scy_m', '200 Medley Relay SCY', 200, 'medley_relay', 'SCY', 'm', 'relay', 4),
('200_medley_relay_scy_f', '200 Medley Relay SCY', 200, 'medley_relay', 'SCY', 'f', 'relay', 4),
('200_medley_relay_scm_m', '200 Medley Relay SCM', 200, 'medley_relay', 'SCM', 'm', 'relay', 4),
('200_medley_relay_scm_f', '200 Medley Relay SCM', 200, 'medley_relay', 'SCM', 'f', 'relay', 4),
('200_medley_relay_lcm_m', '200 Medley Relay LCM', 200, 'medley_relay', 'LCM', 'm', 'relay', 4),
('200_medley_relay_lcm_f', '200 Medley Relay LCM', 200, 'medley_relay', 'LCM', 'f', 'relay', 4),
('400_medley_relay_scy_m', '400 Medley Relay SCY', 400, 'medley_relay', 'SCY', 'm', 'relay', 4),
('400_medley_relay_scy_f', '400 Medley Relay SCY', 400, 'medley_relay', 'SCY', 'f', 'relay', 4),
('400_medley_relay_scm_m', '400 Medley Relay SCM', 400, 'medley_relay', 'SCM', 'm', 'relay', 4),
('400_medley_relay_scm_f', '400 Medley Relay SCM', 400, 'medley_relay', 'SCM', 'f', 'relay', 4),
('400_medley_relay_lcm_m', '400 Medley Relay LCM', 400, 'medley_relay', 'LCM', 'm', 'relay', 4),
('400_medley_relay_lcm_f', '400 Medley Relay LCM', 400, 'medley_relay', 'LCM', 'f', 'relay', 4)
ON CONFLICT ("event_key") DO NOTHING;

-- FK from meet tables to swim_events (skip invalid keys in dev data)
DELETE FROM "meet_events" WHERE "event_key" NOT IN (SELECT "event_key" FROM "swim_events");
DELETE FROM "swimmer_best_times" WHERE "event_key" NOT IN (SELECT "event_key" FROM "swim_events");

ALTER TABLE "meet_events" ADD CONSTRAINT "meet_events_event_key_swim_events_fk"
  FOREIGN KEY ("event_key") REFERENCES "swim_events"("event_key");
ALTER TABLE "swimmer_best_times" ADD CONSTRAINT "swimmer_best_times_event_key_swim_events_fk"
  FOREIGN KEY ("event_key") REFERENCES "swim_events"("event_key");

-- swimmer_club_registrations (replaces usa_swimming_links)
CREATE TABLE "swimmer_club_registrations" (
  "id" text PRIMARY KEY NOT NULL,
  "membership_id" text NOT NULL UNIQUE REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "usa_member_id" text NOT NULL,
  "club_id" text,
  "registration_status" text,
  "swims_record_id" text,
  "last_synced_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "swimmer_club_registrations" ("id", "membership_id", "usa_member_id", "club_id", "registration_status", "swims_record_id", "last_synced_at", "created_at", "updated_at")
SELECT
  usl."id",
  tsm."id",
  usl."usa_member_id",
  usl."club_id",
  usl."registration_status",
  usl."swims_record_id",
  usl."last_synced_at",
  usl."created_at",
  usl."updated_at"
FROM "usa_swimming_links" usl
INNER JOIN LATERAL (
  SELECT "id" FROM "team_swimmer_memberships"
  WHERE "swimmer_id" = usl."swimmer_id"
  ORDER BY "joined_at" ASC
  LIMIT 1
) tsm ON true;

UPDATE "swimmers" s
SET
  "governing_body" = 'usa_swimming',
  "governing_body_id" = usl."usa_member_id"
FROM "usa_swimming_links" usl
WHERE s."id" = usl."swimmer_id" AND s."governing_body_id" IS NULL;

DROP TABLE "usa_swimming_links";

-- Team-scoped PII
CREATE TABLE "swimmer_contacts" (
  "membership_id" text PRIMARY KEY NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "parent_name" text,
  "parent_email" text,
  "parent_phone" text,
  "emergency_name" text,
  "emergency_phone" text,
  "address_line1" text,
  "address_line2" text,
  "city" text,
  "state" text,
  "postal_code" text,
  "country" text,
  "minor_direct_contact_consent" boolean DEFAULT false NOT NULL,
  "minor_direct_contact_consented_at" timestamp,
  "minor_direct_contact_consented_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "swimmer_medical" (
  "membership_id" text PRIMARY KEY NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "allergies" text,
  "medications" text,
  "conditions" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- SafeSport compliance tables
CREATE TABLE "staff_credentials" (
  "id" text PRIMARY KEY NOT NULL,
  "member_id" text NOT NULL REFERENCES "member"("id") ON DELETE CASCADE,
  "credential_type" "credential_type" NOT NULL,
  "status" "credential_status" DEFAULT 'not_started' NOT NULL,
  "completed_at" timestamp,
  "expires_at" timestamp,
  "external_id" text,
  "verified_by" "credential_verified_by" DEFAULT 'manual_upload' NOT NULL,
  "document_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_staff_credentials_member" ON "staff_credentials" ("member_id", "credential_type");

CREATE TABLE "maapp_acknowledgments" (
  "id" text PRIMARY KEY NOT NULL,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "acknowledged_by" "acknowledgment_by" NOT NULL,
  "signer_name" text NOT NULL,
  "signer_email" text NOT NULL,
  "season_year" text NOT NULL,
  "acknowledged_at" timestamp DEFAULT now() NOT NULL,
  "document_version" text DEFAULT '2025' NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_maapp_ack_membership_season" ON "maapp_acknowledgments" ("membership_id", "season_year");

CREATE TABLE "safesport_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "reported_by_user_id" text NOT NULL,
  "subject_description" text NOT NULL,
  "category" "report_category" NOT NULL,
  "status" "report_status" DEFAULT 'submitted' NOT NULL,
  "referred_to_center_at" timestamp,
  "resolution_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "resolved_at" timestamp
);

CREATE TABLE "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "actor_user_id" text NOT NULL,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text NOT NULL,
  "metadata" jsonb,
  "ip_address" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_audit_log_org_created" ON "audit_log" ("organization_id", "created_at" DESC);

ALTER TABLE "swimmer_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "swimmer_medical" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "maapp_acknowledgments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "safesport_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
