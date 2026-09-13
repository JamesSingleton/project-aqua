-- Waves 1.5–4: Polar SaaS columns, club ops, engagement, website, migration

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "polar_customer_id" text,
  ADD COLUMN IF NOT EXISTS "polar_subscription_id" text;

CREATE TYPE "public"."stripe_connect_status" AS ENUM(
  'not_connected',
  'pending',
  'active',
  'restricted'
);

CREATE TYPE "public"."family_invoice_status" AS ENUM(
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible'
);

CREATE TYPE "public"."registration_status" AS ENUM(
  'pending',
  'submitted',
  'approved',
  'rejected'
);

CREATE TYPE "public"."message_channel_type" AS ENUM(
  'team',
  'squad',
  'meet',
  'announcement'
);

CREATE TABLE IF NOT EXISTS "club_stripe_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "stripe_account_id" text,
  "status" "stripe_connect_status" DEFAULT 'not_connected' NOT NULL,
  "charges_enabled" boolean DEFAULT false NOT NULL,
  "payouts_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "family_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "primary_email" text NOT NULL,
  "primary_name" text NOT NULL,
  "phone" text,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "stripe_customer_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "family_swimmer_links" (
  "id" text PRIMARY KEY NOT NULL,
  "family_account_id" text NOT NULL REFERENCES "family_accounts"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "team_swimmer_memberships"("id") ON DELETE CASCADE,
  "relationship" text DEFAULT 'parent' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "family_invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "family_account_id" text NOT NULL REFERENCES "family_accounts"("id") ON DELETE CASCADE,
  "description" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text DEFAULT 'usd' NOT NULL,
  "status" "family_invoice_status" DEFAULT 'draft' NOT NULL,
  "due_at" timestamp,
  "stripe_invoice_id" text,
  "stripe_payment_intent_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "registration_programs" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "fee_cents" integer DEFAULT 0 NOT NULL,
  "opens_at" timestamp,
  "closes_at" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "waivers" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "required" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "program_registrations" (
  "id" text PRIMARY KEY NOT NULL,
  "program_id" text NOT NULL REFERENCES "registration_programs"("id") ON DELETE CASCADE,
  "family_account_id" text NOT NULL REFERENCES "family_accounts"("id") ON DELETE CASCADE,
  "membership_id" text REFERENCES "team_swimmer_memberships"("id") ON DELETE SET NULL,
  "status" "registration_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "waiver_acknowledgments" (
  "id" text PRIMARY KEY NOT NULL,
  "waiver_id" text NOT NULL REFERENCES "waivers"("id") ON DELETE CASCADE,
  "family_account_id" text NOT NULL REFERENCES "family_accounts"("id") ON DELETE CASCADE,
  "signed_name" text NOT NULL,
  "signed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "channel" text DEFAULT 'email' NOT NULL,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "volunteer_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "meet_id" text,
  "title" text NOT NULL,
  "description" text,
  "slots" integer DEFAULT 1 NOT NULL,
  "starts_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "volunteer_signups" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text NOT NULL REFERENCES "volunteer_jobs"("id") ON DELETE CASCADE,
  "family_account_id" text NOT NULL REFERENCES "family_accounts"("id") ON DELETE CASCADE,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_channels" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" "message_channel_type" DEFAULT 'team' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "channel_id" text NOT NULL REFERENCES "chat_channels"("id") ON DELETE CASCADE,
  "author_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dm_threads" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "subject" text,
  "involves_minor" boolean DEFAULT false NOT NULL,
  "parent_observer_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "second_adult_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "blocked" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dm_participants" (
  "id" text PRIMARY KEY NOT NULL,
  "thread_id" text NOT NULL REFERENCES "dm_threads"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dm_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "thread_id" text NOT NULL REFERENCES "dm_threads"("id") ON DELETE CASCADE,
  "author_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wellness_check_ins" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "swimmer_id" text REFERENCES "swimmers"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "mood" integer NOT NULL,
  "sleep" integer,
  "energy" integer,
  "stress" integer,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_feed_posts" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "author_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_websites" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "domain" text,
  "title" text NOT NULL,
  "tagline" text,
  "about_html" text,
  "published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "migration_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "notes" text,
  "result_summary" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "family_accounts_org_idx" ON "family_accounts" ("organization_id");
CREATE INDEX IF NOT EXISTS "family_invoices_org_idx" ON "family_invoices" ("organization_id");
CREATE INDEX IF NOT EXISTS "chat_messages_channel_idx" ON "chat_messages" ("channel_id");
CREATE INDEX IF NOT EXISTS "wellness_org_idx" ON "wellness_check_ins" ("organization_id");
