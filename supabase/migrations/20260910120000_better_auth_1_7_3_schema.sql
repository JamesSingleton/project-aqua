-- Better Auth 1.7.3: account.issuer is unused (NOT NULL blocked inserts).
-- Organization invitations now require created_at.

alter table public.account
  alter column issuer drop not null;

drop index if exists public."account_issuer_accountId_uidx";

alter table public.invitation
  add column if not exists created_at timestamp;

update public.invitation
set created_at = now()
where created_at is null;

alter table public.invitation
  alter column created_at set default now();

alter table public.invitation
  alter column created_at set not null;
