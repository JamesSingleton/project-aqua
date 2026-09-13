-- Migrate legacy commitment rows to the new attendance model.
UPDATE "meet_commitments"
SET "status" = 'not_going'
WHERE "status" = 'declined';

DELETE FROM "meet_commitments"
WHERE "status" IN ('pending', 'committed');
