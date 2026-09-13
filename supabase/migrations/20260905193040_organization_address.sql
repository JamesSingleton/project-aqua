-- Team mailing address for Hy-Tek C2 records (street, city, region, postal, country).
ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "address_line1" text,
  ADD COLUMN IF NOT EXISTS "address_line2" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "region" text,
  ADD COLUMN IF NOT EXISTS "postal_code" text,
  ADD COLUMN IF NOT EXISTS "country" text;

COMMENT ON COLUMN "public"."organization"."address_line1" IS
  'Street address used on Team Manager C2 / Meet Manager team records.';
COMMENT ON COLUMN "public"."organization"."region" IS
  'State/province (US: 2-letter code, e.g. AZ).';
COMMENT ON COLUMN "public"."organization"."postal_code" IS
  'Postal / ZIP code.';
COMMENT ON COLUMN "public"."organization"."country" IS
  'ISO-style country label for Hy-Tek C2 (typically USA).';
