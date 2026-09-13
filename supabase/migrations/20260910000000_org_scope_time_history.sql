-- Org-scope coach-authored time entries; snapshot meet name on global best times.

alter table public.swimmer_time_entries
  add column if not exists membership_id text;

update public.swimmer_time_entries e
set membership_id = oldest.id
from (
  select distinct on (tsm.swimmer_id)
    tsm.swimmer_id,
    tsm.id
  from public.team_swimmer_memberships tsm
  order by tsm.swimmer_id, tsm.joined_at asc, tsm.created_at asc, tsm.id asc
) oldest
where e.swimmer_id = oldest.swimmer_id
  and e.membership_id is null;

delete from public.swimmer_time_entries
where membership_id is null;

alter table public.swimmer_time_entries
  alter column membership_id set not null;

alter table public.swimmer_time_entries
  drop constraint if exists swimmer_time_entries_membership_id_fkey;

alter table public.swimmer_time_entries
  add constraint swimmer_time_entries_membership_id_fkey
  foreign key (membership_id)
  references public.team_swimmer_memberships(id)
  on delete cascade;

create index if not exists swimmer_time_entries_membership_id_idx
  on public.swimmer_time_entries (membership_id);

drop policy if exists swimmer_time_entries_via_swimmer on public.swimmer_time_entries;
create policy swimmer_time_entries_via_membership on public.swimmer_time_entries
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.swimmer_best_times
  add column if not exists meet_name text;

update public.swimmer_best_times b
set meet_name = m.name
from public.meets m
where b.meet_id = m.id
  and (b.meet_name is null or b.meet_name = '');
