import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export type ThemePreference = "light" | "dark" | "system";

export type RosterUiState = {
  columnVisibility?: Record<string, boolean>;
  sorting?: { id: string; desc: boolean }[];
};

export type MeetEntriesView = "swimmer" | "event";

export type TeamUiState = {
  roster?: RosterUiState;
  meetEntriesView?: MeetEntriesView;
};

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").$type<ThemePreference>().notNull().default("system"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userTeamPreferences = pgTable(
  "user_team_preferences",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ui: jsonb("ui").$type<TeamUiState>().notNull().default({}),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.organizationId] }),
    index("user_team_preferences_organization_id_idx").on(table.organizationId),
  ],
);

export type UserPreferences = typeof userPreferences.$inferSelect;
export type UserTeamPreferences = typeof userTeamPreferences.$inferSelect;
