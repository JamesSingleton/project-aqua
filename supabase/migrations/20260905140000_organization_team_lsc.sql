-- Hy-Tek / Meet Manager team identity used on entry pack C1 records.
ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "team_code" text,
  ADD COLUMN IF NOT EXISTS "lsc_code" text;

COMMENT ON COLUMN "public"."organization"."team_code" IS
  'Hy-Tek team abbreviation, typically 4-5 uppercase letters (MARI, DSUN, AZSL).';

COMMENT ON COLUMN "public"."organization"."lsc_code" IS
  'USA Swimming Local Swimming Committee code, 2 letters (AZ, GA, PC).';
