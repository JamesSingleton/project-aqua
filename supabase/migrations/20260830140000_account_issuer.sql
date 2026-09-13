-- Better Auth 1.7: account identity is keyed on (issuer, account_id).

ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;

UPDATE "account"
SET "issuer" = 'local:credential'
WHERE "issuer" IS NULL AND "provider_id" = 'credential';

UPDATE "account"
SET "issuer" = 'local:oauth:' || "provider_id"
WHERE "issuer" IS NULL AND "provider_id" <> 'credential';

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx"
  ON "account" ("issuer", "account_id");
