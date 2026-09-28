CREATE TABLE "usa_swimming_webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"club_id" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "usa_swimming_webhook_delivery_club_id_idx" ON "usa_swimming_webhook_delivery" USING btree ("club_id");