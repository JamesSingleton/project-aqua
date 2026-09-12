-- MVP: training groups, AI generations, relay legs, membership group_id

CREATE TABLE IF NOT EXISTS "training_groups" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TYPE "public"."ai_generation_kind" AS ENUM('workout', 'relay');

CREATE TABLE IF NOT EXISTS "ai_generations" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "kind" "ai_generation_kind" NOT NULL,
  "tokens_in" integer,
  "tokens_out" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "team_swimmer_memberships"
  ADD COLUMN IF NOT EXISTS "group_id" text REFERENCES "training_groups"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "meet_relay_legs" (
  "id" text PRIMARY KEY NOT NULL,
  "meet_id" text NOT NULL REFERENCES "meets"("id") ON DELETE CASCADE,
  "meet_event_id" text NOT NULL REFERENCES "meet_events"("id") ON DELETE CASCADE,
  "leg_order" integer NOT NULL,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "stroke" text,
  "reasoning" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_generations_org_created_idx"
  ON "ai_generations" ("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "training_groups_org_idx"
  ON "training_groups" ("organization_id");
CREATE INDEX IF NOT EXISTS "meet_relay_legs_meet_idx"
  ON "meet_relay_legs" ("meet_id");
