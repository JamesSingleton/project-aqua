import { init } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createId = init({ length: 20 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export const teamTypeEnum = pgEnum("team_type", [
  "club",
  "high_school",
  "college",
  "masters",
]);

export const staffRoleEnum = pgEnum("staff_role", [
  "head_coach",
  "assistant_coach",
  "team_manager",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "archived",
]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "rolled_back",
]);

export const importActionEnum = pgEnum("import_action", [
  "created",
  "matched",
  "updated",
  "conflict",
]);

export const importFileTypeEnum = pgEnum("import_file_type", [
  "hy3",
  "cl2",
  "sd3",
  "csv",
  "xlsx",
  "manual",
]);

// ─── Teams ────────────────────────────────────────────────────────────────────
// One row per team. One-to-one with a better-auth organization.
// organizationId is the better-auth org ID — used as the foreign key
// across all other tables so there's only ever one ID to pass around.

export const teams = pgTable(
  "teams",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    organizationId: text().notNull().unique(), // better-auth org ID, 1:1

    // Identity
    name: text().notNull(),
    abbreviation: text().notNull(), // e.g. 'AZSL', 'MARI'
    shortName: text(), // e.g. 'Seals', 'MHS'
    teamType: teamTypeEnum().notNull(),

    // Public-facing URL identifier — 20-char cuid2, globally unique
    // e.g. 'tz4a98xxat96iws9zmbax'
    // Generated client-side before insert so it's immediately available
    // in application code without a DB round-trip
    publicId: text()
      .notNull()
      .unique()
      .$defaultFn(() => createId()),

    // USA Swimming
    lscCode: text(), // 2-char LSC code e.g. 'AZ', 'CA'

    // Address
    addressLine1: text(),
    addressLine2: text(),
    city: text(),
    state: text(),
    zip: text(),
    country: text().default("USA"),

    // Online presence
    website: text(),
    instagram: text(),
    twitter: text(),
    facebook: text(),

    // Branding — store object keys / paths, not raw file data
    logoUrl: text(),
    primaryColor: text(), // hex e.g. '#E80022'
    secondaryColor: text(),

    ...timestamps,
  },
  (table) => [
    uniqueIndex("teams_organization_id_idx").on(table.organizationId),
    uniqueIndex("teams_public_id_idx").on(table.publicId),
    uniqueIndex("teams_abbreviation_lsc_idx").on(
      table.abbreviation,
      table.lscCode
    ),
    index("teams_team_type_idx").on(table.teamType),
  ]
);

// ─── Staff ────────────────────────────────────────────────────────────────────
// A staff member is a person — not a user account (that's better-auth's job).
// A staff member can belong to multiple teams via team_staff.
// If they also have a user account, link it via userId.

export const staff = pgTable(
  "staff",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),

    // Link to better-auth user if they have an account
    // NULL = invited but not yet signed up
    userId: text().unique(),

    // Identity
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull().unique(),
    phone: text(),

    // USA Swimming coach certification
    usasCoachId: text(), // USA-S coach certification number
    usasCoachCertExpires: date(),

    ...timestamps,
  },
  (table) => [
    uniqueIndex("staff_email_idx").on(table.email),
    index("staff_user_id_idx").on(table.userId),
  ]
);

// ─── Team Staff ───────────────────────────────────────────────────────────────
// The team ↔ staff membership. One staff member can be on multiple teams.
// Role is per-membership — someone can be head coach at one team
// and assistant coach at another.

export const teamStaff = pgTable(
  "team_staff",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    organizationId: text().notNull(), // FK → teams.organizationId
    staffId: uuid()
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    role: staffRoleEnum().notNull(),
    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (table) => [
    uniqueIndex("team_staff_org_staff_idx").on(
      table.organizationId,
      table.staffId
    ),
    index("team_staff_org_idx").on(table.organizationId),
    index("team_staff_org_active_idx").on(table.organizationId, table.isActive),
  ]
);

// ─── Athletes ─────────────────────────────────────────────────────────────────
// Global identity record — one row per real-world person.
// Shared across all teams. Team-specific data lives on team_athletes.

export const athletes = pgTable(
  "athletes",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),

    // Identity
    firstName: text().notNull(),
    lastName: text().notNull(),
    preferredName: text(), // nickname / goes-by name
    middleName: text(),

    // Demographics
    dateOfBirth: date(),
    gender: text(), // 'M' | 'F'
    citizenship: text(), // FINA 3-char code e.g. 'USA', 'CAN'

    // USA Swimming registration
    usasId: text().unique(), // 12-char hex, NULL for HS-only athletes
    usasRegistrationExpires: date(),

    // Address
    addressLine1: text(),
    addressLine2: text(),
    city: text(),
    state: text(),
    zip: text(),
    country: text(),

    // Emergency contact
    emergencyContactName: text(),
    emergencyContactPhone: text(),
    emergencyContactRelation: text(),

    ...timestamps,
  },
  (table) => [
    // Primary dedup key — match by USA-S ID
    uniqueIndex("athletes_usas_id_idx").on(table.usasId),
    // Fallback dedup for HS athletes without a USA-S ID
    index("athletes_name_dob_idx").on(
      table.lastName,
      table.firstName,
      table.dateOfBirth
    ),
  ]
);

// ─── Team Athletes ────────────────────────────────────────────────────────────
// The team ↔ athlete membership. One athlete can be on multiple teams
// simultaneously (e.g. club + high school). All team-specific data lives here.

export const teamAthletes = pgTable(
  "team_athletes",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    organizationId: text().notNull(), // FK → teams.organizationId
    athleteId: uuid()
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),

    // Membership
    status: memberStatusEnum().notNull().default("active"),
    joinedAt: date(),

    // Club-specific grouping (USS teams)
    // e.g. 'Rising', 'White', 'Red', 'Blue' — team defines their own groups
    trainingGroup: text(),

    // HS / college-specific
    gradeYear: text(), // 'FR' | 'SO' | 'JR' | 'SR'
    graduationYear: integer(), // e.g. 2027

    // Meet management
    competitiveCategory: text(), // 'Senior', 'Junior', 'Age Group', etc.

    // Admin
    coachNotes: text(),
    importedFrom: importFileTypeEnum(),

    ...timestamps,
  },
  (table) => [
    // One membership per org per athlete
    uniqueIndex("team_athletes_org_athlete_idx").on(
      table.organizationId,
      table.athleteId
    ),
    index("team_athletes_org_idx").on(table.organizationId),
    index("team_athletes_org_status_idx").on(
      table.organizationId,
      table.status
    ),
  ]
);

// ─── Roster Imports ───────────────────────────────────────────────────────────
// Audit log — every file upload creates one row.
// Enables conflict review and full rollback.

export const rosterImports = pgTable(
  "roster_imports",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    organizationId: text().notNull(),
    importedBy: text().notNull(), // better-auth user ID

    // File metadata
    fileName: text().notNull(),
    fileType: importFileTypeEnum().notNull(),
    fileCode: text(), // SDIF FILE Code: '03', '20', '01', etc.

    // Processing state
    status: importStatusEnum().notNull().default("pending"),

    athletesCreated: integer().notNull().default(0),
    athletesMatched: integer().notNull().default(0),
    athletesUpdated: integer().notNull().default(0),

    // Conflicts surfaced to coach for manual resolution.
    // Array of:
    // {
    //   type: 'usas_id_mismatch' | 'name_dob_mismatch' | 'duplicate'
    //   incomingData: RosterAthlete
    //   existingAthleteId: string
    //   field: string
    //   incomingValue: string
    //   existingValue: string
    // }
    conflicts: jsonb().notNull().default(sql`'[]'::jsonb`),

    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => [
    index("roster_imports_org_idx").on(table.organizationId, table.createdAt),
  ]
);

// ─── Roster Import Athletes ───────────────────────────────────────────────────
// One row per athlete touched by an import.
// Powers rollback — cascade delete these rows to undo the entire import.

export const rosterImportAthletes = pgTable(
  "roster_import_athletes",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    importId: uuid()
      .notNull()
      .references(() => rosterImports.id, { onDelete: "cascade" }),
    athleteId: uuid()
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    teamAthleteId: uuid()
      .notNull()
      .references(() => teamAthletes.id, { onDelete: "cascade" }),

    action: importActionEnum().notNull(),

    // Original parsed row from the file — preserved for debugging and rollback
    rawData: jsonb(),
  },
  (table) => [
    index("roster_import_athletes_import_idx").on(table.importId),
    index("roster_import_athletes_athlete_idx").on(table.athleteId),
  ]
);

// --- auth
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)]
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ]
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("twoFactor_secret_idx").on(table.secret),
    index("twoFactor_userId_idx").on(table.userId),
  ]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type TeamStaff = typeof teamStaff.$inferSelect;
export type NewTeamStaff = typeof teamStaff.$inferInsert;
export type Athlete = typeof athletes.$inferSelect;
export type NewAthlete = typeof athletes.$inferInsert;
export type TeamAthlete = typeof teamAthletes.$inferSelect;
export type NewTeamAthlete = typeof teamAthletes.$inferInsert;
export type RosterImport = typeof rosterImports.$inferSelect;
export type NewRosterImport = typeof rosterImports.$inferInsert;
export type RosterImportAthlete = typeof rosterImportAthletes.$inferSelect;
export type NewRosterImportAthlete = typeof rosterImportAthletes.$inferInsert;
