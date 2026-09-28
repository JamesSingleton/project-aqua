import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Processed SWIMS webhook deliveries for idempotency / replay protection. */
export const usaSwimmingWebhookDelivery = pgTable(
  "usa_swimming_webhook_delivery",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    clubId: text("club_id").notNull(),
    processedAt: timestamp("processed_at").notNull().defaultNow(),
  },
  (table) => [
    index("usa_swimming_webhook_delivery_club_id_idx").on(table.clubId),
  ],
);

export type UsaSwimmingWebhookDelivery =
  typeof usaSwimmingWebhookDelivery.$inferSelect;
