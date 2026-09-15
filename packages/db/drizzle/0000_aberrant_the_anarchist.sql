CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused', 'late');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('unknown', 'attending', 'absent', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('club', 'high_school', 'college', 'national', 'summer');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'processing', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."calendar_connection_status" AS ENUM('active', 'error', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('practice', 'meet', 'other');--> statement-breakpoint
CREATE TYPE "public"."calendar_provider" AS ENUM('google', 'microsoft');--> statement-breakpoint
CREATE TYPE "public"."course" AS ENUM('SCY', 'SCM', 'LCM');--> statement-breakpoint
CREATE TYPE "public"."event_gender" AS ENUM('male', 'female', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('individual', 'relay');--> statement-breakpoint
CREATE TYPE "public"."ai_generation_kind" AS ENUM('workout', 'relay');--> statement-breakpoint
CREATE TYPE "public"."meet_commitment_status" AS ENUM('pending', 'committed', 'declined', 'not_going', 'not_eligible');--> statement-breakpoint
CREATE TYPE "public"."meet_entry_status" AS ENUM('draft', 'approved', 'scratched');--> statement-breakpoint
CREATE TYPE "public"."meet_event_kind" AS ENUM('swim', 'dive');--> statement-breakpoint
CREATE TYPE "public"."meet_result_round" AS ENUM('prelim', 'swimoff', 'finals');--> statement-breakpoint
CREATE TYPE "public"."seed_time_source" AS ENUM('personal_best', 'manual', 'no_time');--> statement-breakpoint
CREATE TYPE "public"."swimmer_time_entry_source" AS ENUM('manual');--> statement-breakpoint
CREATE TYPE "public"."acknowledgment_by" AS ENUM('parent_guardian', 'athlete', 'adult_athlete');--> statement-breakpoint
CREATE TYPE "public"."credential_status" AS ENUM('current', 'expired', 'pending', 'not_started');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('safesport_core', 'safesport_refresher_1', 'safesport_refresher_2', 'safesport_refresher_3', 'background_check', 'cpr_aed', 'stsc');--> statement-breakpoint
CREATE TYPE "public"."credential_verified_by" AS ENUM('manual_upload', 'usa_swimming_sync', 'safesport_lms_webhook');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('emotional_misconduct', 'physical_misconduct', 'sexual_misconduct', 'maapp_violation', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('submitted', 'under_review', 'resolved', 'referred_to_center');--> statement-breakpoint
CREATE TYPE "public"."eligibility_status" AS ENUM('competing', 'redshirt', 'medical', 'exhausted', 'ineligible', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."governing_body" AS ENUM('usa_swimming');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."workout_distance_unit" AS ENUM('yards', 'meters');--> statement-breakpoint
CREATE TYPE "public"."workout_intensity" AS ENUM('easy', 'moderate', 'threshold', 'race', 'sprint', 'recovery', 'unknown');--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_session_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"rsvp_status" "rsvp_status" DEFAULT 'unknown' NOT NULL,
	"absence_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text,
	"notes" text,
	"workout_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"issuer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"team_code" text,
	"lsc_code" text,
	"team_type" "team_type" DEFAULT 'club' NOT NULL,
	"default_practice_location" text,
	"usa_swimming_club_id" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text,
	"max_scoring_entries_per_individual_event" integer,
	"max_relay_teams_per_event" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"status" "import_job_status" DEFAULT 'pending' NOT NULL,
	"file_path" text,
	"errors" text,
	"result_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"polar_customer_id" text,
	"polar_subscription_id" text,
	"plan" "plan_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"external_calendar_id" text NOT NULL,
	"external_calendar_name" text,
	"channel_id" text,
	"resource_id" text,
	"channel_expires_at" timestamp,
	"sync_token" text,
	"status" "calendar_connection_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_event_links" (
	"id" text PRIMARY KEY NOT NULL,
	"aqua_event_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"external_calendar_id" text NOT NULL,
	"external_event_id" text NOT NULL,
	"external_etag" text,
	"last_pushed_at" timestamp,
	"last_pulled_at" timestamp,
	"aqua_version_at_sync" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_feed_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"label" text,
	"created_by_user_id" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_conflicts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"aqua_event_id" text,
	"connection_id" text,
	"provider" "calendar_provider" NOT NULL,
	"external_event_id" text,
	"resolution" text DEFAULT 'aqua_wins' NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"event_type" "calendar_event_type" DEFAULT 'other' NOT NULL,
	"practice_session_id" text,
	"meet_id" text,
	"created_by_user_id" text,
	"aqua_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swim_events" (
	"event_key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"distance" integer NOT NULL,
	"stroke" text NOT NULL,
	"course" "course" NOT NULL,
	"gender" "event_gender" NOT NULL,
	"event_type" "event_type" DEFAULT 'individual' NOT NULL,
	"relay_legs" integer
);
--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"kind" "ai_generation_kind" NOT NULL,
	"tokens_in" integer,
	"tokens_out" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"status" "meet_commitment_status" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"meet_event_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"seed_time_ms" integer,
	"seed_time_source" "seed_time_source" DEFAULT 'no_time' NOT NULL,
	"entry_notes" text,
	"status" "meet_entry_status" DEFAULT 'draft' NOT NULL,
	"exhibition" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_event_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"course" "course" DEFAULT 'SCY' NOT NULL,
	"events" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_events" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"event_number" integer,
	"stroke" text NOT NULL,
	"distance" integer NOT NULL,
	"gender" "event_gender" NOT NULL,
	"age_group" text,
	"event_key" text NOT NULL,
	"qualifying_time_ms" integer,
	"event_kind" "meet_event_kind" DEFAULT 'swim' NOT NULL,
	"dive_count" integer,
	"imported_from_file" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_relay_legs" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"meet_event_id" text NOT NULL,
	"relay_letter" text DEFAULT 'A' NOT NULL,
	"leg_order" integer NOT NULL,
	"membership_id" text NOT NULL,
	"stroke" text,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_relay_result_members" (
	"id" text PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"leg_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_relay_result_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"leg_order" integer NOT NULL,
	"time_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_relay_results" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"meet_event_id" text NOT NULL,
	"relay_letter" text DEFAULT 'A' NOT NULL,
	"round" "meet_result_round",
	"time_ms" integer NOT NULL,
	"heat" integer,
	"lane" integer,
	"exhibition" boolean DEFAULT false NOT NULL,
	"is_dq" boolean DEFAULT false NOT NULL,
	"dq_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_relay_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"meet_event_id" text NOT NULL,
	"relay_letter" text DEFAULT 'A' NOT NULL,
	"seed_time_ms" integer,
	"seed_time_source" "seed_time_source" DEFAULT 'no_time' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_results" (
	"id" text PRIMARY KEY NOT NULL,
	"meet_id" text NOT NULL,
	"meet_event_id" text NOT NULL,
	"swimmer_id" text NOT NULL,
	"time_ms" integer NOT NULL,
	"previous_best_time_ms" integer,
	"place" integer,
	"is_dq" boolean DEFAULT false NOT NULL,
	"split_times" jsonb,
	"round" "meet_result_round",
	"heat" integer,
	"lane" integer,
	"exhibition" boolean DEFAULT false NOT NULL,
	"dq_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meets" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"season_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"entry_deadline" timestamp,
	"course" "course" DEFAULT 'SCY' NOT NULL,
	"location" text,
	"address" text,
	"opponents" text,
	"import_source" text,
	"raw_file_path" text,
	"max_individual_entries" integer,
	"max_relay_entries" integer,
	"max_combined_entries" integer,
	"entry_limit_packages" jsonb,
	"entry_limits_source" text,
	"max_scoring_entries_per_individual_event" integer,
	"max_relay_teams_per_event" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swimmer_best_times" (
	"id" text PRIMARY KEY NOT NULL,
	"swimmer_id" text NOT NULL,
	"event_key" text NOT NULL,
	"course" "course" NOT NULL,
	"time_ms" integer NOT NULL,
	"achieved_at" timestamp NOT NULL,
	"meet_id" text,
	"meet_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swimmer_time_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"swimmer_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"event_key" text NOT NULL,
	"course" "course" NOT NULL,
	"time_ms" integer NOT NULL,
	"achieved_at" timestamp NOT NULL,
	"source" "swimmer_time_entry_source" DEFAULT 'manual' NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_standard_cuts" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"event_key" text NOT NULL,
	"gender" "event_gender" NOT NULL,
	"age_group" text NOT NULL,
	"time_ms" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_standard_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"course" "course" DEFAULT 'SCY' NOT NULL,
	"season_label" text,
	"source_file_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"meet_reminders" boolean DEFAULT true NOT NULL,
	"invite_emails" boolean DEFAULT true NOT NULL,
	"safesport_reminders" boolean DEFAULT true NOT NULL,
	"billing_emails" boolean DEFAULT true NOT NULL,
	"product_updates" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_theme_check" CHECK ("user_preferences"."theme" in ('light', 'dark', 'system'))
);
--> statement-breakpoint
CREATE TABLE "user_team_preferences" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"ui" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_team_preferences_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maapp_acknowledgments" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"season_id" text NOT NULL,
	"acknowledged_by" "acknowledgment_by" NOT NULL,
	"signer_name" text NOT NULL,
	"signer_email" text NOT NULL,
	"acknowledged_at" timestamp DEFAULT now() NOT NULL,
	"document_version" text DEFAULT '2025' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safesport_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"reported_by_user_id" text NOT NULL,
	"subject_description" text NOT NULL,
	"category" "report_category" NOT NULL,
	"status" "report_status" DEFAULT 'submitted' NOT NULL,
	"referred_to_center_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "staff_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "season_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"group_id" text,
	"class_year" text,
	"academic_standing" text,
	"eligibility_status" "eligibility_status",
	"seasons_of_competition_used" integer,
	"eligibility_notes" text,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"label" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone" text,
	"certifications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "swimmer_club_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"usa_member_id" text NOT NULL,
	"club_id" text,
	"registration_status" text,
	"swims_record_id" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swimmer_contacts" (
	"membership_id" text PRIMARY KEY NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "swimmer_medical" (
	"membership_id" text PRIMARY KEY NOT NULL,
	"allergies" text,
	"medications" text,
	"conditions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swimmers" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"preferred_name" text,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"email" text,
	"phone" text,
	"governing_body" "governing_body",
	"governing_body_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_swimmer_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"swimmer_id" text NOT NULL,
	"group_id" text,
	"practice_group" text,
	"training_groups" text[],
	"class_year" text,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"workout_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"section" text,
	"reps" integer DEFAULT 1 NOT NULL,
	"distance" integer NOT NULL,
	"stroke" text DEFAULT 'free' NOT NULL,
	"intensity" "workout_intensity" DEFAULT 'unknown' NOT NULL,
	"interval" text,
	"notes" text,
	"raw_line" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"raw_text" text NOT NULL,
	"total_distance" integer,
	"distance_unit" "workout_distance_unit",
	"practice_group" text,
	"was_ai_generated" boolean DEFAULT false NOT NULL,
	"ai_prompt" text,
	"ai_draft_text" text,
	"edit_distance" integer,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_practice_session_id_practice_sessions_id_fk" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_links" ADD CONSTRAINT "calendar_event_links_aqua_event_id_team_calendar_events_id_fk" FOREIGN KEY ("aqua_event_id") REFERENCES "public"."team_calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_links" ADD CONSTRAINT "calendar_event_links_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_feed_tokens" ADD CONSTRAINT "calendar_feed_tokens_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_feed_tokens" ADD CONSTRAINT "calendar_feed_tokens_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_aqua_event_id_team_calendar_events_id_fk" FOREIGN KEY ("aqua_event_id") REFERENCES "public"."team_calendar_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_calendar_events" ADD CONSTRAINT "team_calendar_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_calendar_events" ADD CONSTRAINT "team_calendar_events_practice_session_id_practice_sessions_id_fk" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_calendar_events" ADD CONSTRAINT "team_calendar_events_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_calendar_events" ADD CONSTRAINT "team_calendar_events_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_commitments" ADD CONSTRAINT "meet_commitments_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_commitments" ADD CONSTRAINT "meet_commitments_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_entries" ADD CONSTRAINT "meet_entries_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_entries" ADD CONSTRAINT "meet_entries_meet_event_id_meet_events_id_fk" FOREIGN KEY ("meet_event_id") REFERENCES "public"."meet_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_entries" ADD CONSTRAINT "meet_entries_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_event_templates" ADD CONSTRAINT "meet_event_templates_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_events" ADD CONSTRAINT "meet_events_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_events" ADD CONSTRAINT "meet_events_event_key_swim_events_event_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."swim_events"("event_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_legs" ADD CONSTRAINT "meet_relay_legs_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_legs" ADD CONSTRAINT "meet_relay_legs_meet_event_id_meet_events_id_fk" FOREIGN KEY ("meet_event_id") REFERENCES "public"."meet_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_legs" ADD CONSTRAINT "meet_relay_legs_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_result_members" ADD CONSTRAINT "meet_relay_result_members_result_id_meet_relay_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."meet_relay_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_result_members" ADD CONSTRAINT "meet_relay_result_members_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_result_splits" ADD CONSTRAINT "meet_relay_result_splits_result_id_meet_relay_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."meet_relay_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_result_splits" ADD CONSTRAINT "meet_relay_result_splits_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_results" ADD CONSTRAINT "meet_relay_results_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_results" ADD CONSTRAINT "meet_relay_results_meet_event_id_meet_events_id_fk" FOREIGN KEY ("meet_event_id") REFERENCES "public"."meet_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_teams" ADD CONSTRAINT "meet_relay_teams_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_relay_teams" ADD CONSTRAINT "meet_relay_teams_meet_event_id_meet_events_id_fk" FOREIGN KEY ("meet_event_id") REFERENCES "public"."meet_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_results" ADD CONSTRAINT "meet_results_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_results" ADD CONSTRAINT "meet_results_meet_event_id_meet_events_id_fk" FOREIGN KEY ("meet_event_id") REFERENCES "public"."meet_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_results" ADD CONSTRAINT "meet_results_swimmer_id_swimmers_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."swimmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_season_id_team_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."team_seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_best_times" ADD CONSTRAINT "swimmer_best_times_swimmer_id_swimmers_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."swimmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_best_times" ADD CONSTRAINT "swimmer_best_times_event_key_swim_events_event_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."swim_events"("event_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_best_times" ADD CONSTRAINT "swimmer_best_times_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_time_entries" ADD CONSTRAINT "swimmer_time_entries_swimmer_id_swimmers_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."swimmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_time_entries" ADD CONSTRAINT "swimmer_time_entries_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_time_entries" ADD CONSTRAINT "swimmer_time_entries_event_key_swim_events_event_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."swim_events"("event_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_standard_cuts" ADD CONSTRAINT "time_standard_cuts_set_id_time_standard_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."time_standard_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_standard_cuts" ADD CONSTRAINT "time_standard_cuts_event_key_swim_events_event_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."swim_events"("event_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_standard_sets" ADD CONSTRAINT "time_standard_sets_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_team_preferences" ADD CONSTRAINT "user_team_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_team_preferences" ADD CONSTRAINT "user_team_preferences_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maapp_acknowledgments" ADD CONSTRAINT "maapp_acknowledgments_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maapp_acknowledgments" ADD CONSTRAINT "maapp_acknowledgments_season_id_team_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."team_seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safesport_reports" ADD CONSTRAINT "safesport_reports_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_credentials" ADD CONSTRAINT "staff_credentials_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_enrollments" ADD CONSTRAINT "season_enrollments_season_id_team_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."team_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_enrollments" ADD CONSTRAINT "season_enrollments_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_enrollments" ADD CONSTRAINT "season_enrollments_group_id_training_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."training_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_club_registrations" ADD CONSTRAINT "swimmer_club_registrations_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_contacts" ADD CONSTRAINT "swimmer_contacts_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimmer_medical" ADD CONSTRAINT "swimmer_medical_membership_id_team_swimmer_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_swimmer_memberships" ADD CONSTRAINT "team_swimmer_memberships_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_swimmer_memberships" ADD CONSTRAINT "team_swimmer_memberships_swimmer_id_swimmers_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."swimmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_swimmer_memberships" ADD CONSTRAINT "team_swimmer_memberships_group_id_training_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."training_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_records_practice_session_id_idx" ON "attendance_records" USING btree ("practice_session_id");--> statement-breakpoint
CREATE INDEX "attendance_records_membership_id_idx" ON "attendance_records" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_practice_sessions_org" ON "practice_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_status_idx" ON "invitation" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organizationId_userId_idx" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "import_jobs_organization_id_idx" ON "import_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_connections_org_user_provider_idx" ON "calendar_connections" USING btree ("organization_id","user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_event_links_connection_external_idx" ON "calendar_event_links" USING btree ("connection_id","external_event_id");--> statement-breakpoint
CREATE INDEX "calendar_event_links_aqua_event_id_idx" ON "calendar_event_links" USING btree ("aqua_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_feed_tokens_token_idx" ON "calendar_feed_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "calendar_feed_tokens_organization_id_idx" ON "calendar_feed_tokens" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_conflicts_organization_id_idx" ON "calendar_sync_conflicts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_calendar_events_org_starts_at_idx" ON "team_calendar_events" USING btree ("organization_id","starts_at");--> statement-breakpoint
CREATE INDEX "ai_generations_org_created_idx" ON "ai_generations" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "training_groups_org_idx" ON "training_groups" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meet_commitments_meet_membership_idx" ON "meet_commitments" USING btree ("meet_id","membership_id");--> statement-breakpoint
CREATE INDEX "meet_commitments_membership_id_idx" ON "meet_commitments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "meet_entries_meet_id_idx" ON "meet_entries" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_entries_membership_id_idx" ON "meet_entries" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "meet_entries_meet_event_id_idx" ON "meet_entries" USING btree ("meet_event_id");--> statement-breakpoint
CREATE INDEX "meet_event_templates_org_idx" ON "meet_event_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meet_events_meet_id_idx" ON "meet_events" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_relay_legs_meet_idx" ON "meet_relay_legs" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_relay_legs_membership_id_idx" ON "meet_relay_legs" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "meet_relay_legs_meet_event_id_idx" ON "meet_relay_legs" USING btree ("meet_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meet_relay_result_members_leg_idx" ON "meet_relay_result_members" USING btree ("result_id","leg_order");--> statement-breakpoint
CREATE INDEX "meet_relay_result_members_membership_id_idx" ON "meet_relay_result_members" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meet_relay_result_splits_leg_idx" ON "meet_relay_result_splits" USING btree ("result_id","leg_order");--> statement-breakpoint
CREATE INDEX "meet_relay_result_splits_membership_id_idx" ON "meet_relay_result_splits" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meet_relay_results_attempt_idx" ON "meet_relay_results" USING btree ("meet_id","meet_event_id","relay_letter","round");--> statement-breakpoint
CREATE INDEX "meet_relay_results_meet_idx" ON "meet_relay_results" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_relay_results_meet_event_id_idx" ON "meet_relay_results" USING btree ("meet_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meet_relay_teams_event_letter_idx" ON "meet_relay_teams" USING btree ("meet_id","meet_event_id","relay_letter");--> statement-breakpoint
CREATE INDEX "meet_relay_teams_meet_idx" ON "meet_relay_teams" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_relay_teams_meet_event_id_idx" ON "meet_relay_teams" USING btree ("meet_event_id");--> statement-breakpoint
CREATE INDEX "meet_results_meet_id_idx" ON "meet_results" USING btree ("meet_id");--> statement-breakpoint
CREATE INDEX "meet_results_swimmer_id_idx" ON "meet_results" USING btree ("swimmer_id");--> statement-breakpoint
CREATE INDEX "meet_results_meet_event_id_idx" ON "meet_results" USING btree ("meet_event_id");--> statement-breakpoint
CREATE INDEX "meets_org_start_date_idx" ON "meets" USING btree ("organization_id","start_date");--> statement-breakpoint
CREATE INDEX "meets_season_id_idx" ON "meets" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "swimmer_time_entries_membership_id_idx" ON "swimmer_time_entries" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "time_standard_cuts_set_id_idx" ON "time_standard_cuts" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "time_standard_cuts_lookup_idx" ON "time_standard_cuts" USING btree ("set_id","event_key","gender","age_group");--> statement-breakpoint
CREATE INDEX "time_standard_sets_organization_id_idx" ON "time_standard_sets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_team_preferences_organization_id_idx" ON "user_team_preferences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_org_created" ON "audit_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_maapp_ack_membership_season" ON "maapp_acknowledgments" USING btree ("membership_id","season_id");--> statement-breakpoint
CREATE INDEX "maapp_acknowledgments_season_id_idx" ON "maapp_acknowledgments" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "safesport_reports_organization_id_idx" ON "safesport_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_staff_credentials_member" ON "staff_credentials" USING btree ("member_id","credential_type");--> statement-breakpoint
CREATE UNIQUE INDEX "season_enrollments_season_membership_idx" ON "season_enrollments" USING btree ("season_id","membership_id");--> statement-breakpoint
CREATE INDEX "season_enrollments_season_status_idx" ON "season_enrollments" USING btree ("season_id","status");--> statement-breakpoint
CREATE INDEX "season_enrollments_membership_idx" ON "season_enrollments" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_seasons_org_label_idx" ON "team_seasons" USING btree ("organization_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "swimmer_club_registrations_membership_idx" ON "swimmer_club_registrations" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "swimmers_governing_body_id_idx" ON "swimmers" USING btree ("governing_body_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_swimmer_memberships_org_swimmer_idx" ON "team_swimmer_memberships" USING btree ("organization_id","swimmer_id");--> statement-breakpoint
CREATE INDEX "idx_team_swimmer_memberships_org" ON "team_swimmer_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_swimmer_memberships_swimmer_id_idx" ON "team_swimmer_memberships" USING btree ("swimmer_id");--> statement-breakpoint
CREATE INDEX "team_swimmer_memberships_org_active_idx" ON "team_swimmer_memberships" USING btree ("organization_id") WHERE "team_swimmer_memberships"."status" = 'active';--> statement-breakpoint
CREATE INDEX "workout_sets_workout_id_idx" ON "workout_sets" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "workouts_organization_id_idx" ON "workouts" USING btree ("organization_id");