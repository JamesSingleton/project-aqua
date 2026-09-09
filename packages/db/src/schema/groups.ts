import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

/** Training groups within a team (Varsity, JV, Age Group, etc.) */
export const trainingGroups = pgTable(
  "training_groups",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("training_groups_org_idx").on(table.organizationId)],
);

export const aiGenerationKindEnum = pgEnum("ai_generation_kind", [
  "workout",
  "relay",
]);

export const aiGenerations = pgTable(
  "ai_generations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    kind: aiGenerationKindEnum("kind").notNull(),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_generations_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export const trainingGroupsRelations = relations(trainingGroups, ({ one }) => ({
  organization: one(organization, {
    fields: [trainingGroups.organizationId],
    references: [organization.id],
  }),
}));
