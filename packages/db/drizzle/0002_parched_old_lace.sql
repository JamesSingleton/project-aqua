DROP INDEX "swimmer_club_registrations_membership_idx";--> statement-breakpoint
DROP INDEX "meets_org_start_date_idx";--> statement-breakpoint
DROP INDEX "idx_audit_log_org_created";--> statement-breakpoint
DROP INDEX "swimmers_governing_body_id_idx";--> statement-breakpoint
ALTER TABLE "meet_commitments" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "meet_event_templates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meet_event_templates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "meet_event_templates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meet_event_templates" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "idx_swimmer_best_times_swimmer" ON "swimmer_best_times" USING btree ("swimmer_id","event_key","course");--> statement-breakpoint
CREATE INDEX "idx_swimmer_time_entries_swimmer_achieved" ON "swimmer_time_entries" USING btree ("swimmer_id","achieved_at");--> statement-breakpoint
CREATE INDEX "idx_swimmer_time_entries_swimmer_event" ON "swimmer_time_entries" USING btree ("swimmer_id","event_key","course");--> statement-breakpoint
CREATE INDEX "meets_org_start_date_idx" ON "meets" USING btree ("organization_id","start_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_audit_log_org_created" ON "audit_log" USING btree ("organization_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "swimmers_governing_body_id_idx" ON "swimmers" USING btree ("governing_body_id") WHERE "swimmers"."governing_body_id" is not null;--> statement-breakpoint
ALTER TABLE "swimmer_club_registrations" ADD CONSTRAINT "swimmer_club_registrations_membership_id_key" UNIQUE("membership_id");