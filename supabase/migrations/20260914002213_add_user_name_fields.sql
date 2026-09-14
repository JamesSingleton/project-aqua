-- Store structured user names for personal greetings and staff directories.
-- `name` remains Better Auth's compatible full display name.
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Preserve the useful portion of names already stored by the earlier schema.
-- A one-word legacy display name has no safe last-name inference, so it remains
-- null and is collected on the user's next profile update.
UPDATE public."user"
SET
  first_name = NULLIF(split_part(btrim(name), ' ', 1), ''),
  last_name = NULLIF(btrim(regexp_replace(btrim(name), '^\S+\s*', '')), '')
WHERE first_name IS NULL
   OR last_name IS NULL;
