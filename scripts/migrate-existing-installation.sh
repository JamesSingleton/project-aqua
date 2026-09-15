#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL to the existing direct database URL.}"
: "${DATABASE_URL_UNPOOLED:?Run 'neon env pull --file .env.local' for the target project.}"

for command in pg_dump pg_restore psql; do
  if ! command -v "$command" >/dev/null; then
    echo "Missing $command. Install the PostgreSQL client tools." >&2
    exit 1
  fi
done

run_pg() {
  env \
    -u PGDATABASE \
    -u PGHOST \
    -u PGPASSWORD \
    -u PGPORT \
    -u PGUSER \
    PGCONNECT_TIMEOUT=15 \
    "$@"
}

count_query='
select concat_ws(
  '"'"'|'"'"',
  (select count(*) from "user"),
  (select count(*) from organization),
  (select count(*) from member),
  (select count(*) from swimmers),
  (select count(*) from meets),
  (select count(*) from swim_events)
)'

data_counts() {
  run_pg psql --dbname="$1" -XAt -v ON_ERROR_STOP=1 -c "$count_query"
}

source_counts=$(data_counts "$SOURCE_DATABASE_URL")
target_counts=$(data_counts "$DATABASE_URL_UNPOOLED")
target_rows=$(
  run_pg psql --dbname="$DATABASE_URL_UNPOOLED" -XAt -v ON_ERROR_STOP=1 \
    -c 'select (select count(*) from "user") + (select count(*) from organization)'
)
if [[ "$target_rows" == "0" ]]; then
  dump_file=$(mktemp "${TMPDIR:-/tmp}/project-aqua-data.XXXXXX.dump")
  trap 'rm -f "$dump_file"' EXIT

  run_pg pg_dump \
    --dbname="$SOURCE_DATABASE_URL" \
    --format=custom \
    --data-only \
    --schema=public \
    --no-owner \
    --no-privileges \
    --file="$dump_file"

  run_pg psql --dbname="$DATABASE_URL_UNPOOLED" -X -v ON_ERROR_STOP=1 \
    -c 'truncate table swim_events cascade'

  run_pg pg_restore \
    --data-only \
    --exit-on-error \
    --single-transaction \
    --no-owner \
    --no-privileges \
    --dbname="$DATABASE_URL_UNPOOLED" \
    "$dump_file"

  target_counts=$(data_counts "$DATABASE_URL_UNPOOLED")
  if [[ "$source_counts" != "$target_counts" ]]; then
    echo "Imported row counts do not match the source." >&2
    exit 1
  fi
elif [[ "$source_counts" == "$target_counts" ]]; then
  echo "Target row counts match the source; resuming image migration."
else
  echo "Target contains data that does not match the source; refusing to import." >&2
  exit 1
fi

env \
  -u PGDATABASE \
  -u PGHOST \
  -u PGPASSWORD \
  -u PGPORT \
  -u PGUSER \
  pnpm --filter @project-aqua/db exec tsx scripts/migrate-image-urls.ts

echo "Existing database rows and public images migrated."
