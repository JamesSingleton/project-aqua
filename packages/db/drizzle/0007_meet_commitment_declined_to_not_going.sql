UPDATE "meet_commitments"
SET "status" = 'not_going', "updated_at" = NOW()
WHERE "status" = 'declined';
