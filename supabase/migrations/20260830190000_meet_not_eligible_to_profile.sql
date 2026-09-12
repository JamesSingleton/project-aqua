-- Move meet-level not_eligible to season enrollment; entries use profile eligibility.
UPDATE season_enrollments se
SET
  eligibility_status = 'ineligible',
  updated_at = now()
FROM meet_commitments mc
WHERE mc.membership_id = se.membership_id
  AND mc.status = 'not_eligible'
  AND (se.eligibility_status IS NULL OR se.eligibility_status = 'competing');

DELETE FROM meet_commitments
WHERE status = 'not_eligible';
