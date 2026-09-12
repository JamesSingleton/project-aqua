-- Drop Wave 2–4 club-ops / engagement tables (MVP scale-back)

DROP TABLE IF EXISTS "volunteer_signups" CASCADE;
DROP TABLE IF EXISTS "volunteer_jobs" CASCADE;
DROP TABLE IF EXISTS "waiver_acknowledgments" CASCADE;
DROP TABLE IF EXISTS "program_registrations" CASCADE;
DROP TABLE IF EXISTS "waivers" CASCADE;
DROP TABLE IF EXISTS "registration_programs" CASCADE;
DROP TABLE IF EXISTS "family_invoices" CASCADE;
DROP TABLE IF EXISTS "family_swimmer_links" CASCADE;
DROP TABLE IF EXISTS "family_accounts" CASCADE;
DROP TABLE IF EXISTS "club_stripe_accounts" CASCADE;
DROP TABLE IF EXISTS "announcements" CASCADE;
DROP TABLE IF EXISTS "dm_messages" CASCADE;
DROP TABLE IF EXISTS "dm_participants" CASCADE;
DROP TABLE IF EXISTS "dm_threads" CASCADE;
DROP TABLE IF EXISTS "chat_messages" CASCADE;
DROP TABLE IF EXISTS "chat_channels" CASCADE;
DROP TABLE IF EXISTS "wellness_check_ins" CASCADE;
DROP TABLE IF EXISTS "team_feed_posts" CASCADE;
DROP TABLE IF EXISTS "team_websites" CASCADE;
DROP TABLE IF EXISTS "migration_jobs" CASCADE;

DROP TYPE IF EXISTS "public"."stripe_connect_status";
DROP TYPE IF EXISTS "public"."family_invoice_status";
DROP TYPE IF EXISTS "public"."registration_status";
DROP TYPE IF EXISTS "public"."message_channel_type";
