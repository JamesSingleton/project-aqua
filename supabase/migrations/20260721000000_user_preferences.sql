-- Global user preferences (theme) + per-team UI state

create table if not exists "user_preferences" (
  "user_id" text primary key references "user"("id") on delete cascade,
  "theme" text not null default 'system'
    constraint "user_preferences_theme_check"
    check ("theme" in ('light', 'dark', 'system')),
  "updated_at" timestamp not null default now()
);

create table if not exists "user_team_preferences" (
  "user_id" text not null references "user"("id") on delete cascade,
  "organization_id" text not null references "organization"("id") on delete cascade,
  "ui" jsonb not null default '{}'::jsonb,
  "updated_at" timestamp not null default now(),
  primary key ("user_id", "organization_id")
);

create index if not exists "user_team_preferences_organization_id_idx"
  on "user_team_preferences" ("organization_id");
