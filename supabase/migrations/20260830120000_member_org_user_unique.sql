-- One membership row per user per team (Better Auth organization 1.7).

CREATE UNIQUE INDEX IF NOT EXISTS "member_organizationId_userId_idx"
  ON "member" ("organization_id", "user_id");
