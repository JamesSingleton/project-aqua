INSERT INTO staff_credentials (
  id,
  member_id,
  credential_type,
  status,
  completed_at,
  expires_at,
  verified_by
) VALUES (
  gen_random_uuid()::text,
  'zIjdcvDJmDGlDShXBsckdVk6BxB77Mhf',
  'safesport_core',
  'current',
  now(),
  now() + interval '1 year',
  'manual_upload'
);