-- Calendar system for Project Aqua

CREATE TYPE "public"."calendar_event_type" AS ENUM('practice', 'meet', 'other');
CREATE TYPE "public"."calendar_provider" AS ENUM('google', 'microsoft');
CREATE TYPE "public"."calendar_connection_status" AS ENUM('active', 'error', 'disconnected');

CREATE TABLE "team_calendar_events" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "location" text,
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp,
  "event_type" "calendar_event_type" DEFAULT 'other' NOT NULL,
  "practice_session_id" text REFERENCES "practice_sessions"("id") ON DELETE SET NULL,
  "meet_id" text REFERENCES "meets"("id") ON DELETE SET NULL,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "aqua_version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "calendar_feed_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "label" text,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "calendar_feed_tokens_token_idx" ON "calendar_feed_tokens" ("token");

CREATE TABLE "calendar_connections" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
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
CREATE UNIQUE INDEX "calendar_connections_org_user_provider_idx"
  ON "calendar_connections" ("organization_id", "user_id", "provider");

CREATE TABLE "calendar_event_links" (
  "id" text PRIMARY KEY NOT NULL,
  "aqua_event_id" text NOT NULL REFERENCES "team_calendar_events"("id") ON DELETE CASCADE,
  "connection_id" text NOT NULL REFERENCES "calendar_connections"("id") ON DELETE CASCADE,
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
CREATE UNIQUE INDEX "calendar_event_links_connection_external_idx"
  ON "calendar_event_links" ("connection_id", "external_event_id");

CREATE TABLE "calendar_sync_conflicts" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "aqua_event_id" text REFERENCES "team_calendar_events"("id") ON DELETE SET NULL,
  "connection_id" text REFERENCES "calendar_connections"("id") ON DELETE SET NULL,
  "provider" "calendar_provider" NOT NULL,
  "external_event_id" text,
  "resolution" text DEFAULT 'aqua_wins' NOT NULL,
  "details" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
