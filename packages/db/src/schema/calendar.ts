import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { practiceSessions } from "./attendance";
import { organization, user } from "./auth";
import { meets } from "./meets";

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "practice",
  "meet",
  "other",
]);

export const calendarProviderEnum = pgEnum("calendar_provider", [
  "google",
  "microsoft",
]);

export const calendarConnectionStatusEnum = pgEnum(
  "calendar_connection_status",
  ["active", "error", "disconnected"],
);

export const teamCalendarEvents = pgTable("team_calendar_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  eventType: calendarEventTypeEnum("event_type").notNull().default("other"),
  practiceSessionId: text("practice_session_id").references(
    () => practiceSessions.id,
    { onDelete: "set null" },
  ),
  meetId: text("meet_id").references(() => meets.id, { onDelete: "set null" }),
  createdByUserId: text("created_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  aquaVersion: integer("aqua_version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const calendarFeedTokens = pgTable(
  "calendar_feed_tokens",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    label: text("label"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("calendar_feed_tokens_token_idx").on(table.token)],
);

export const calendarConnections = pgTable(
  "calendar_connections",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: calendarProviderEnum("provider").notNull(),
    externalCalendarId: text("external_calendar_id").notNull(),
    externalCalendarName: text("external_calendar_name"),
    channelId: text("channel_id"),
    resourceId: text("resource_id"),
    channelExpiresAt: timestamp("channel_expires_at"),
    syncToken: text("sync_token"),
    status: calendarConnectionStatusEnum("status").notNull().default("active"),
    lastSyncedAt: timestamp("last_synced_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("calendar_connections_org_user_provider_idx").on(
      table.organizationId,
      table.userId,
      table.provider,
    ),
  ],
);

export const calendarEventLinks = pgTable(
  "calendar_event_links",
  {
    id: text("id").primaryKey(),
    aquaEventId: text("aqua_event_id")
      .notNull()
      .references(() => teamCalendarEvents.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => calendarConnections.id, { onDelete: "cascade" }),
    provider: calendarProviderEnum("provider").notNull(),
    externalCalendarId: text("external_calendar_id").notNull(),
    externalEventId: text("external_event_id").notNull(),
    externalEtag: text("external_etag"),
    lastPushedAt: timestamp("last_pushed_at"),
    lastPulledAt: timestamp("last_pulled_at"),
    aquaVersionAtSync: integer("aqua_version_at_sync").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("calendar_event_links_connection_external_idx").on(
      table.connectionId,
      table.externalEventId,
    ),
  ],
);

export const calendarSyncConflicts = pgTable("calendar_sync_conflicts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  aquaEventId: text("aqua_event_id").references(() => teamCalendarEvents.id, {
    onDelete: "set null",
  }),
  connectionId: text("connection_id").references(() => calendarConnections.id, {
    onDelete: "set null",
  }),
  provider: calendarProviderEnum("provider").notNull(),
  externalEventId: text("external_event_id"),
  resolution: text("resolution").notNull().default("aqua_wins"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamCalendarEventsRelations = relations(
  teamCalendarEvents,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [teamCalendarEvents.organizationId],
      references: [organization.id],
    }),
    links: many(calendarEventLinks),
  }),
);

export const calendarConnectionsRelations = relations(
  calendarConnections,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [calendarConnections.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [calendarConnections.userId],
      references: [user.id],
    }),
    links: many(calendarEventLinks),
  }),
);

export const calendarEventLinksRelations = relations(
  calendarEventLinks,
  ({ one }) => ({
    aquaEvent: one(teamCalendarEvents, {
      fields: [calendarEventLinks.aquaEventId],
      references: [teamCalendarEvents.id],
    }),
    connection: one(calendarConnections, {
      fields: [calendarEventLinks.connectionId],
      references: [calendarConnections.id],
    }),
  }),
);
