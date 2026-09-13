-- Wave 1: workouts, meet commitments/entries, practice RSVP

CREATE TYPE "public"."workout_intensity" AS ENUM(
  'easy',
  'moderate',
  'threshold',
  'race',
  'sprint',
  'recovery',
  'unknown'
);

CREATE TYPE "public"."rsvp_status" AS ENUM(
  'unknown',
  'attending',
  'absent',
  'maybe'
);

CREATE TYPE "public"."meet_commitment_status" AS ENUM(
  'pending',
  'committed',
  'declined'
);

CREATE TYPE "public"."meet_entry_status" AS ENUM(
  'draft',
  'approved',
  'scratched'
);

CREATE TABLE "workouts" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "raw_text" text NOT NULL,
  "total_distance" integer,
  "practice_group" text,
  "was_ai_generated" boolean DEFAULT false NOT NULL,
  "ai_prompt" text,
  "ai_draft_text" text,
  "edit_distance" integer,
  "created_by_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "workout_sets" (
  "id" text PRIMARY KEY NOT NULL,
  "workout_id" text NOT NULL REFERENCES "workouts"("id") ON DELETE CASCADE,
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

CREATE INDEX "workouts_organization_id_idx" ON "workouts" ("organization_id");
CREATE INDEX "workout_sets_workout_id_idx" ON "workout_sets" ("workout_id");

ALTER TABLE "practice_sessions"
  ADD COLUMN "workout_id" text REFERENCES "workouts"("id") ON DELETE SET NULL;

ALTER TABLE "attendance_records"
  ADD COLUMN "rsvp_status" "rsvp_status" DEFAULT 'unknown' NOT NULL,
  ADD COLUMN "absence_reason" text;

CREATE TABLE "meet_commitments" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "status" "meet_commitment_status" DEFAULT 'pending' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "meet_commitments_meet_membership_idx"
  ON "meet_commitments" ("meet_id", "membership_id");

ALTER TABLE "meet_entries"
  ADD COLUMN "status" "meet_entry_status" DEFAULT 'draft' NOT NULL,
  ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
