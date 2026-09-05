-- First-class org fields that used to live in Better Auth's text JSON `metadata`.
DO $$ BEGIN
  CREATE TYPE "public"."team_type" AS ENUM (
    'club',
    'high_school',
    'college',
    'national',
    'summer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "team_type" "team_type" NOT NULL DEFAULT 'club',
  ADD COLUMN IF NOT EXISTS "default_practice_location" text,
  ADD COLUMN IF NOT EXISTS "usa_swimming_club_id" text;

COMMENT ON COLUMN "public"."organization"."team_type" IS
  'Program type: drives SafeSport, SWIMS, and roster/export defaults.';
COMMENT ON COLUMN "public"."organization"."default_practice_location" IS
  'Default pool/venue for new practices and calendar events.';
COMMENT ON COLUMN "public"."organization"."usa_swimming_club_id" IS
  'Connected USA Swimming / SWIMS club identifier.';

-- Copy known keys out of metadata (skip rows that are not JSON objects).
DO $$
DECLARE
  r record;
  j jsonb;
  leftover jsonb;
  team_type_text text;
  plan_text text;
  loc text;
  club_id text;
BEGIN
  FOR r IN
    SELECT id, metadata FROM public.organization WHERE metadata IS NOT NULL
  LOOP
    BEGIN
      j := r.metadata::jsonb;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;
    IF jsonb_typeof(j) <> 'object' THEN
      CONTINUE;
    END IF;

    team_type_text := j->>'teamType';
    loc := nullif(btrim(coalesce(j->>'defaultPracticeLocation', '')), '');
    club_id := nullif(btrim(coalesce(j->>'usaSwimmingClubId', '')), '');
    plan_text := j->>'plan';

    UPDATE public.organization
    SET
      team_type = CASE
        WHEN team_type_text IN (
          'club', 'high_school', 'college', 'national', 'summer'
        ) THEN team_type_text::public.team_type
        ELSE team_type
      END,
      default_practice_location = COALESCE(loc, default_practice_location),
      usa_swimming_club_id = COALESCE(club_id, usa_swimming_club_id)
    WHERE id = r.id;

    -- Prefer subscriptions as source of truth; only lift paid plans off free.
    IF plan_text IN ('pro', 'enterprise') THEN
      UPDATE public.subscriptions
      SET
        plan = plan_text::public.plan_tier,
        updated_at = now()
      WHERE organization_id = r.id
        AND plan = 'free';
    END IF;

    leftover := j - 'teamType' - 'plan' - 'defaultPracticeLocation' - 'usaSwimmingClubId';
    UPDATE public.organization
    SET metadata = CASE
      WHEN leftover = '{}'::jsonb THEN NULL
      ELSE leftover::text
    END
    WHERE id = r.id;
  END LOOP;
END $$;
