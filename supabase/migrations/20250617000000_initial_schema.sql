-- Initial schema for Project Aqua swim SaaS

CREATE TYPE "public"."gender" AS ENUM('male', 'female');
CREATE TYPE "public"."membership_status" AS ENUM('active', 'inactive');
CREATE TYPE "public"."course" AS ENUM('SCY', 'SCM', 'LCM');
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused', 'late');
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'pro', 'enterprise');
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'processing', 'complete', 'failed');

-- Better Auth tables
CREATE TABLE "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "active_organization_id" text
);

CREATE TABLE "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "organization" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "logo" text,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "member" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "title" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "invitation" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Domain tables
CREATE TABLE "swimmers" (
  "id" text PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "date_of_birth" date NOT NULL,
  "gender" "gender" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "team_swimmer_memberships" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "swimmer_id" text NOT NULL REFERENCES "swimmers"("id") ON DELETE CASCADE,
  "practice_group" text,
  "training_groups" text[],
  "status" "membership_status" DEFAULT 'active' NOT NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL,
  "left_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "team_swimmer_memberships_org_swimmer_idx" ON "team_swimmer_memberships" ("organization_id", "swimmer_id");

CREATE TABLE "usa_swimming_links" (
  "id" text PRIMARY KEY NOT NULL,
  "swimmer_id" text NOT NULL REFERENCES "swimmers"("id") ON DELETE CASCADE,
  "usa_member_id" text NOT NULL,
  "club_id" text,
  "registration_status" text,
  "swims_record_id" text,
  "last_synced_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "staff_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE,
  "phone" text,
  "certifications" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "practice_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "date" timestamp NOT NULL,
  "location" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "attendance_records" (
  "id" text PRIMARY KEY NOT NULL,
  "practice_session_id" text NOT NULL REFERENCES "practice_sessions"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "status" "attendance_status" DEFAULT 'present' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "meets" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp,
  "course" "course" DEFAULT 'SCY' NOT NULL,
  "location" text,
  "import_source" text,
  "raw_file_path" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "meet_events" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "event_number" integer,
  "stroke" text NOT NULL,
  "distance" integer NOT NULL,
  "gender" text NOT NULL,
  "age_group" text,
  "event_key" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "meet_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "meet_event_id" text NOT NULL REFERENCES "meet_events"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "seed_time_ms" integer,
  "entry_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "meet_results" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "meet_event_id" text NOT NULL REFERENCES "meet_events"("id") ON DELETE CASCADE,
  "swimmer_id" text NOT NULL REFERENCES "swimmers"("id") ON DELETE CASCADE,
  "time_ms" integer NOT NULL,
  "place" integer,
  "is_dq" boolean DEFAULT false NOT NULL,
  "split_times" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "swimmer_best_times" (
  "id" text PRIMARY KEY NOT NULL,
  "swimmer_id" text NOT NULL REFERENCES "swimmers"("id") ON DELETE CASCADE,
  "event_key" text NOT NULL,
  "course" "course" NOT NULL,
  "time_ms" integer NOT NULL,
  "achieved_at" timestamp NOT NULL,
  "meet_id" text REFERENCES "meets"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "plan" "plan_tier" DEFAULT 'free' NOT NULL,
  "status" "subscription_status" DEFAULT 'active' NOT NULL,
  "current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "import_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "status" "import_job_status" DEFAULT 'pending' NOT NULL,
  "file_path" text,
  "errors" text,
  "result_summary" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX "idx_team_swimmer_memberships_org" ON "team_swimmer_memberships" ("organization_id");
CREATE INDEX "idx_meets_org" ON "meets" ("organization_id");
CREATE INDEX "idx_swimmer_best_times_swimmer" ON "swimmer_best_times" ("swimmer_id", "event_key", "course");
CREATE INDEX "idx_practice_sessions_org" ON "practice_sessions" ("organization_id");

-- RLS (defense in depth)
ALTER TABLE "swimmers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_swimmer_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "practice_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
