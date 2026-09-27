ALTER TABLE "team_calendar_events" RENAME COLUMN "aqua_version" TO "version";--> statement-breakpoint
ALTER TABLE "calendar_event_links" RENAME COLUMN "aqua_event_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "calendar_event_links" RENAME COLUMN "aqua_version_at_sync" TO "event_version_at_sync";--> statement-breakpoint
ALTER TABLE "calendar_event_links" RENAME CONSTRAINT "calendar_event_links_aqua_event_id_team_calendar_events_id_fk" TO "calendar_event_links_event_id_team_calendar_events_id_fk";--> statement-breakpoint
ALTER INDEX "calendar_event_links_aqua_event_id_idx" RENAME TO "calendar_event_links_event_id_idx";--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" RENAME COLUMN "aqua_event_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" RENAME CONSTRAINT "calendar_sync_conflicts_aqua_event_id_team_calendar_events_id_fk" TO "calendar_sync_conflicts_event_id_team_calendar_events_id_fk";--> statement-breakpoint
ALTER TABLE "calendar_sync_conflicts" ALTER COLUMN "resolution" SET DEFAULT 'local_wins';--> statement-breakpoint
UPDATE "calendar_sync_conflicts" SET "resolution" = 'local_wins' WHERE "resolution" = 'aqua_wins';
