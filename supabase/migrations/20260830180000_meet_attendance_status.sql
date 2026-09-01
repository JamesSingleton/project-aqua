-- Meet attendance: add exclusion statuses (must commit before using new values).
ALTER TYPE "public"."meet_commitment_status" ADD VALUE IF NOT EXISTS 'not_going';
ALTER TYPE "public"."meet_commitment_status" ADD VALUE IF NOT EXISTS 'not_eligible';
