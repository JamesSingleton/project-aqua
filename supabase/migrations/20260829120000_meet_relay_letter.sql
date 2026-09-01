-- Relay team letter (A/B/C). Legs 1–4 are racing; 5–8 are championship alternates.

ALTER TABLE "public"."meet_relay_legs"
  ADD COLUMN IF NOT EXISTS "relay_letter" text NOT NULL DEFAULT 'A';

COMMENT ON COLUMN "public"."meet_relay_legs"."relay_letter" IS
  'Hy-Tek F1 relay letter; legs 1-4 primary, 5-8 alternates';
