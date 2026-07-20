-- Two-factor auth (Better Auth plugin) + notification preferences + user avatars bucket

alter table "user"
  add column if not exists "two_factor_enabled" boolean not null default false;

create table if not exists "two_factor" (
  "id" text primary key,
  "secret" text not null,
  "backup_codes" text not null,
  "user_id" text not null references "user"("id") on delete cascade,
  "verified" boolean default true,
  "failed_verification_count" integer default 0,
  "locked_until" timestamp
);

create index if not exists "two_factor_user_id_idx" on "two_factor" ("user_id");
create index if not exists "two_factor_secret_idx" on "two_factor" ("secret");

create table if not exists "notification_preferences" (
  "user_id" text primary key references "user"("id") on delete cascade,
  "meet_reminders" boolean not null default true,
  "invite_emails" boolean not null default true,
  "safesport_reminders" boolean not null default true,
  "billing_emails" boolean not null default true,
  "product_updates" boolean not null default false,
  "updated_at" timestamp not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/svg+xml'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read user avatars" on storage.objects;
create policy "Public read user avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'user-avatars');
