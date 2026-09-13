-- Season-based rosters: team_seasons, season_enrollments, meets/MAAPP FKs

CREATE TYPE "public"."eligibility_status" AS ENUM (
  'competing',
  'redshirt',
  'medical',
  'exhausted',
  'ineligible',
  'other'
);

CREATE TABLE "public"."team_seasons" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "public"."organization"("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "is_current" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "team_seasons_org_label_idx"
  ON "public"."team_seasons" ("organization_id", "label");

CREATE UNIQUE INDEX "team_seasons_one_current_per_org_idx"
  ON "public"."team_seasons" ("organization_id")
  WHERE "is_current" = true;

CREATE TABLE "public"."season_enrollments" (
  "id" text PRIMARY KEY NOT NULL,
  "season_id" text NOT NULL REFERENCES "public"."team_seasons"("id") ON DELETE CASCADE,
  "membership_id" text NOT NULL REFERENCES "public"."team_swimmer_memberships"("id") ON DELETE CASCADE,
  "group_id" text REFERENCES "public"."training_groups"("id") ON DELETE SET NULL,
  "class_year" text,
  "academic_standing" text,
  "eligibility_status" "public"."eligibility_status",
  "seasons_of_competition_used" integer,
  "eligibility_notes" text,
  "status" "public"."membership_status" NOT NULL DEFAULT 'active',
  "joined_at" timestamp NOT NULL DEFAULT now(),
  "left_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "season_enrollments_season_membership_idx"
  ON "public"."season_enrollments" ("season_id", "membership_id");

CREATE INDEX "season_enrollments_season_status_idx"
  ON "public"."season_enrollments" ("season_id", "status");

CREATE INDEX "season_enrollments_membership_idx"
  ON "public"."season_enrollments" ("membership_id");

-- Backfill: one current season per organization (USA Swimming Sep–Aug style)
INSERT INTO "public"."team_seasons" (
  "id",
  "organization_id",
  "label",
  "starts_on",
  "ends_on",
  "is_current"
)
SELECT
  gen_random_uuid()::text,
  o."id",
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::text
  END,
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 1)
    ELSE make_date((EXTRACT(YEAR FROM CURRENT_DATE) - 1)::int, 9, 1)
  END,
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN make_date((EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int, 8, 31)
    ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 8, 31)
  END,
  true
FROM "public"."organization" o;

-- Enroll every membership on the org's current season
INSERT INTO "public"."season_enrollments" (
  "id",
  "season_id",
  "membership_id",
  "group_id",
  "class_year",
  "status",
  "joined_at",
  "left_at"
)
SELECT
  gen_random_uuid()::text,
  s."id",
  m."id",
  m."group_id",
  m."class_year",
  m."status",
  m."joined_at",
  m."left_at"
FROM "public"."team_swimmer_memberships" m
INNER JOIN "public"."team_seasons" s
  ON s."organization_id" = m."organization_id"
 AND s."is_current" = true;

-- Meets: add season_id, backfill, enforce NOT NULL
ALTER TABLE "public"."meets"
  ADD COLUMN "season_id" text REFERENCES "public"."team_seasons"("id") ON DELETE RESTRICT;

UPDATE "public"."meets" m
SET "season_id" = matched."season_id"
FROM (
  SELECT
    mt."id" AS meet_id,
    COALESCE(
      (
        SELECT ts."id"
        FROM "public"."team_seasons" ts
        WHERE ts."organization_id" = mt."organization_id"
          AND mt."start_date"::date BETWEEN ts."starts_on" AND ts."ends_on"
        ORDER BY ts."starts_on" DESC
        LIMIT 1
      ),
      (
        SELECT ts."id"
        FROM "public"."team_seasons" ts
        WHERE ts."organization_id" = mt."organization_id"
          AND ts."is_current" = true
        LIMIT 1
      )
    ) AS season_id
  FROM "public"."meets" mt
) AS matched
WHERE m."id" = matched.meet_id;

ALTER TABLE "public"."meets"
  ALTER COLUMN "season_id" SET NOT NULL;

CREATE INDEX "meets_season_id_idx" ON "public"."meets" ("season_id");

-- MAAPP: add season_id, map from season_year, drop season_year
ALTER TABLE "public"."maapp_acknowledgments"
  ADD COLUMN "season_id" text REFERENCES "public"."team_seasons"("id") ON DELETE RESTRICT;

-- Ensure seasons exist for any MAAPP season_year labels that don't match current seasons
INSERT INTO "public"."team_seasons" (
  "id",
  "organization_id",
  "label",
  "starts_on",
  "ends_on",
  "is_current"
)
SELECT DISTINCT
  gen_random_uuid()::text,
  m."organization_id",
  a."season_year",
  CASE
    WHEN a."season_year" ~ '^\d{4}-\d{4}$'
      THEN make_date(split_part(a."season_year", '-', 1)::int, 9, 1)
    ELSE CURRENT_DATE
  END,
  CASE
    WHEN a."season_year" ~ '^\d{4}-\d{4}$'
      THEN make_date(split_part(a."season_year", '-', 2)::int, 8, 31)
    ELSE CURRENT_DATE
  END,
  false
FROM "public"."maapp_acknowledgments" a
INNER JOIN "public"."team_swimmer_memberships" m
  ON m."id" = a."membership_id"
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."team_seasons" ts
  WHERE ts."organization_id" = m."organization_id"
    AND ts."label" = a."season_year"
);

UPDATE "public"."maapp_acknowledgments" a
SET "season_id" = ts."id"
FROM "public"."team_swimmer_memberships" m
INNER JOIN "public"."team_seasons" ts
  ON ts."organization_id" = m."organization_id"
WHERE a."membership_id" = m."id"
  AND ts."label" = a."season_year";

-- Fallback: any remaining acks without a match → current season
UPDATE "public"."maapp_acknowledgments" a
SET "season_id" = s."id"
FROM "public"."team_swimmer_memberships" m
INNER JOIN "public"."team_seasons" s
  ON s."organization_id" = m."organization_id"
 AND s."is_current" = true
WHERE a."membership_id" = m."id"
  AND a."season_id" IS NULL;

ALTER TABLE "public"."maapp_acknowledgments"
  ALTER COLUMN "season_id" SET NOT NULL;

DROP INDEX IF EXISTS "idx_maapp_ack_membership_season";

ALTER TABLE "public"."maapp_acknowledgments"
  DROP COLUMN "season_year";

CREATE UNIQUE INDEX "idx_maapp_ack_membership_season"
  ON "public"."maapp_acknowledgments" ("membership_id", "season_id");

COMMENT ON TABLE "public"."team_seasons" IS
  'Annual team seasons (e.g. 2025-2026); one may be marked current per org';
COMMENT ON TABLE "public"."season_enrollments" IS
  'Per-season roster enrollment; class year and college eligibility are historical here';
COMMENT ON COLUMN "public"."team_swimmer_memberships"."class_year" IS
  'Deprecated: prefer season_enrollments.class_year';
COMMENT ON COLUMN "public"."team_swimmer_memberships"."group_id" IS
  'Deprecated: prefer season_enrollments.group_id';
