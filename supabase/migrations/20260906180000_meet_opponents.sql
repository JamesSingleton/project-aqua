-- Coach-owned opponents line for a meet. Not taken from host files.
ALTER TABLE "meets"
  ADD COLUMN IF NOT EXISTS "opponents" text;

COMMENT ON COLUMN "public"."meets"."opponents" IS
  'Optional opponents list (e.g. dual/tri meet opponents). Coach-owned; import does not overwrite.';
