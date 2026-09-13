-- Org-scoped RLS for Project Aqua (Better Auth user id via app.user_id).
-- App queries run as aqua_app (no BYPASSRLS). Better Auth keeps using postgres (bypass).
-- SafeSport remains application-layer and only for USA Swimming club/national teams.

create schema if not exists private;

create or replace function private.current_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '');
$$;

create or replace function private.is_org_member(org_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member m
    where m.organization_id = org_id
      and m.user_id = (select private.current_user_id())
  );
$$;

create or replace function private.can_access_meet(p_meet_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meets m
    where m.id = p_meet_id
      and private.is_org_member(m.organization_id)
  );
$$;

create or replace function private.can_access_membership(p_membership_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_swimmer_memberships tsm
    where tsm.id = p_membership_id
      and private.is_org_member(tsm.organization_id)
  );
$$;

create or replace function private.can_access_swimmer(p_swimmer_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_swimmer_memberships tsm
    where tsm.swimmer_id = p_swimmer_id
      and private.is_org_member(tsm.organization_id)
  );
$$;

create or replace function private.can_access_practice(p_practice_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.practice_sessions ps
    where ps.id = p_practice_id
      and private.is_org_member(ps.organization_id)
  );
$$;

create or replace function private.can_access_workout(p_workout_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workouts w
    where w.id = p_workout_id
      and private.is_org_member(w.organization_id)
  );
$$;

create or replace function private.can_access_calendar_event(p_event_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_calendar_events e
    where e.id = p_event_id
      and private.is_org_member(e.organization_id)
  );
$$;

create or replace function private.can_access_calendar_connection(p_connection_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.calendar_connections c
    where c.id = p_connection_id
      and private.is_org_member(c.organization_id)
  );
$$;

create or replace function private.can_access_time_standard_set(p_set_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.time_standard_sets s
    where s.id = p_set_id
      and private.is_org_member(s.organization_id)
  );
$$;

create or replace function private.can_access_relay_result(p_result_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meet_relay_results r
    where r.id = p_result_id
      and private.can_access_meet(r.meet_id)
  );
$$;

revoke all on schema private from public;
grant usage on schema private to postgres;
grant execute on all functions in schema private to postgres;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'aqua_app') then
    create role aqua_app nologin nobypassrls;
  end if;
end
$$;

grant aqua_app to postgres;
grant usage on schema public to aqua_app;
grant usage on schema private to aqua_app;
grant execute on all functions in schema private to aqua_app;
grant select, insert, update, delete on all tables in schema public to aqua_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to aqua_app;
alter default privileges in schema private
  grant execute on functions to aqua_app;

-- Deny Data API roles by default (RLS on + no grants beyond existing Supabase defaults)
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- ---------------------------------------------------------------------------
-- Helper: enable FORCE RLS + org policy
-- ---------------------------------------------------------------------------

create or replace function private.enable_org_rls(table_name text, org_column text default 'organization_id')
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', table_name);
  execute format('alter table public.%I force row level security', table_name);
  execute format('drop policy if exists %I on public.%I', table_name || '_org_member', table_name);
  execute format(
    'create policy %I on public.%I for all to aqua_app using ((select private.is_org_member(%I))) with check ((select private.is_org_member(%I)))',
    table_name || '_org_member',
    table_name,
    org_column,
    org_column
  );
end;
$$;

select private.enable_org_rls('meets');
select private.enable_org_rls('practice_sessions');
select private.enable_org_rls('subscriptions');
select private.enable_org_rls('workouts');
select private.enable_org_rls('training_groups');
select private.enable_org_rls('ai_generations');
select private.enable_org_rls('team_seasons');
select private.enable_org_rls('team_swimmer_memberships');
select private.enable_org_rls('meet_event_templates');
select private.enable_org_rls('time_standard_sets');
select private.enable_org_rls('safesport_reports');
select private.enable_org_rls('audit_log');
select private.enable_org_rls('import_jobs');
select private.enable_org_rls('team_calendar_events');
select private.enable_org_rls('calendar_feed_tokens');
select private.enable_org_rls('calendar_connections');
select private.enable_org_rls('calendar_sync_conflicts');
select private.enable_org_rls('user_team_preferences');

drop function private.enable_org_rls(text, text);

-- Meet children (via meet → org)
do $$
declare
  t text;
begin
  foreach t in array array[
    'meet_events',
    'meet_entries',
    'meet_results',
    'meet_commitments',
    'meet_relay_legs',
    'meet_relay_teams',
    'meet_relay_results'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_via_meet', t);
    execute format(
      'create policy %I on public.%I for all to aqua_app using ((select private.can_access_meet(meet_id))) with check ((select private.can_access_meet(meet_id)))',
      t || '_via_meet',
      t
    );
  end loop;
end
$$;

alter table public.meet_relay_result_splits enable row level security;
alter table public.meet_relay_result_splits force row level security;
drop policy if exists meet_relay_result_splits_via_result on public.meet_relay_result_splits;
create policy meet_relay_result_splits_via_result on public.meet_relay_result_splits
  for all to aqua_app
  using ((select private.can_access_relay_result(result_id)))
  with check ((select private.can_access_relay_result(result_id)));

alter table public.workout_sets enable row level security;
alter table public.workout_sets force row level security;
drop policy if exists workout_sets_via_workout on public.workout_sets;
create policy workout_sets_via_workout on public.workout_sets
  for all to aqua_app
  using ((select private.can_access_workout(workout_id)))
  with check ((select private.can_access_workout(workout_id)));

alter table public.attendance_records enable row level security;
alter table public.attendance_records force row level security;
drop policy if exists attendance_records_via_practice on public.attendance_records;
create policy attendance_records_via_practice on public.attendance_records
  for all to aqua_app
  using ((select private.can_access_practice(practice_session_id)))
  with check ((select private.can_access_practice(practice_session_id)));

alter table public.season_enrollments enable row level security;
alter table public.season_enrollments force row level security;
drop policy if exists season_enrollments_via_membership on public.season_enrollments;
create policy season_enrollments_via_membership on public.season_enrollments
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.time_standard_cuts enable row level security;
alter table public.time_standard_cuts force row level security;
drop policy if exists time_standard_cuts_via_set on public.time_standard_cuts;
create policy time_standard_cuts_via_set on public.time_standard_cuts
  for all to aqua_app
  using ((select private.can_access_time_standard_set(set_id)))
  with check ((select private.can_access_time_standard_set(set_id)));

alter table public.calendar_event_links enable row level security;
alter table public.calendar_event_links force row level security;
drop policy if exists calendar_event_links_via_event on public.calendar_event_links;
create policy calendar_event_links_via_event on public.calendar_event_links
  for all to aqua_app
  using ((select private.can_access_calendar_event(aqua_event_id)))
  with check ((select private.can_access_calendar_event(aqua_event_id)));

-- Swimmer graph (global person + per-team memberships)
alter table public.swimmers enable row level security;
alter table public.swimmers force row level security;
drop policy if exists swimmers_via_membership on public.swimmers;
create policy swimmers_via_membership on public.swimmers
  for select to aqua_app
  using ((select private.can_access_swimmer(id)));
create policy swimmers_insert_authenticated on public.swimmers
  for insert to aqua_app
  with check ((select private.current_user_id()) is not null);
create policy swimmers_update_via_membership on public.swimmers
  for update to aqua_app
  using ((select private.can_access_swimmer(id)))
  with check ((select private.can_access_swimmer(id)));
create policy swimmers_delete_via_membership on public.swimmers
  for delete to aqua_app
  using ((select private.can_access_swimmer(id)));

alter table public.swimmer_contacts enable row level security;
alter table public.swimmer_contacts force row level security;
drop policy if exists swimmer_contacts_via_membership on public.swimmer_contacts;
create policy swimmer_contacts_via_membership on public.swimmer_contacts
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.swimmer_medical enable row level security;
alter table public.swimmer_medical force row level security;
drop policy if exists swimmer_medical_via_membership on public.swimmer_medical;
create policy swimmer_medical_via_membership on public.swimmer_medical
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.swimmer_club_registrations enable row level security;
alter table public.swimmer_club_registrations force row level security;
drop policy if exists swimmer_club_registrations_via_membership on public.swimmer_club_registrations;
create policy swimmer_club_registrations_via_membership on public.swimmer_club_registrations
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.maapp_acknowledgments enable row level security;
alter table public.maapp_acknowledgments force row level security;
drop policy if exists maapp_acknowledgments_via_membership on public.maapp_acknowledgments;
create policy maapp_acknowledgments_via_membership on public.maapp_acknowledgments
  for all to aqua_app
  using ((select private.can_access_membership(membership_id)))
  with check ((select private.can_access_membership(membership_id)));

alter table public.swimmer_best_times enable row level security;
alter table public.swimmer_best_times force row level security;
drop policy if exists swimmer_best_times_via_swimmer on public.swimmer_best_times;
create policy swimmer_best_times_via_swimmer on public.swimmer_best_times
  for all to aqua_app
  using ((select private.can_access_swimmer(swimmer_id)))
  with check ((select private.can_access_swimmer(swimmer_id)));

alter table public.swimmer_time_entries enable row level security;
alter table public.swimmer_time_entries force row level security;
drop policy if exists swimmer_time_entries_via_swimmer on public.swimmer_time_entries;
create policy swimmer_time_entries_via_swimmer on public.swimmer_time_entries
  for all to aqua_app
  using ((select private.can_access_swimmer(swimmer_id)))
  with check ((select private.can_access_swimmer(swimmer_id)));

-- Staff credentials via member → org
alter table public.staff_credentials enable row level security;
alter table public.staff_credentials force row level security;
drop policy if exists staff_credentials_via_member on public.staff_credentials;
create policy staff_credentials_via_member on public.staff_credentials
  for all to aqua_app
  using (
    exists (
      select 1 from public.member m
      where m.id = member_id
        and private.is_org_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.id = member_id
        and private.is_org_member(m.organization_id)
    )
  );

-- Global catalog (read-only for app role)
alter table public.swim_events enable row level security;
alter table public.swim_events force row level security;
drop policy if exists swim_events_read on public.swim_events;
create policy swim_events_read on public.swim_events
  for select to aqua_app
  using ((select private.current_user_id()) is not null);

-- Better Auth / identity tables for aqua_app (own-row). Primary path uses dbAdmin bypass.
alter table public."user" enable row level security;
alter table public."user" force row level security;
drop policy if exists user_self on public."user";
create policy user_self on public."user"
  for all to aqua_app
  using (id = (select private.current_user_id()))
  with check (id = (select private.current_user_id()));

alter table public.session enable row level security;
alter table public.session force row level security;
drop policy if exists session_self on public.session;
create policy session_self on public.session
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

alter table public.account enable row level security;
alter table public.account force row level security;
drop policy if exists account_self on public.account;
create policy account_self on public.account
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

alter table public.two_factor enable row level security;
alter table public.two_factor force row level security;
drop policy if exists two_factor_self on public.two_factor;
create policy two_factor_self on public.two_factor
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

alter table public.verification enable row level security;
alter table public.verification force row level security;
drop policy if exists verification_deny_app on public.verification;
create policy verification_deny_app on public.verification
  for all to aqua_app
  using (false)
  with check (false);

alter table public.organization enable row level security;
alter table public.organization force row level security;
drop policy if exists organization_member_select on public.organization;
create policy organization_member_select on public.organization
  for select to aqua_app
  using ((select private.is_org_member(id)));
drop policy if exists organization_member_update on public.organization;
create policy organization_member_update on public.organization
  for update to aqua_app
  using ((select private.is_org_member(id)))
  with check ((select private.is_org_member(id)));

alter table public.member enable row level security;
alter table public.member force row level security;
drop policy if exists member_org_select on public.member;
create policy member_org_select on public.member
  for select to aqua_app
  using (
    user_id = (select private.current_user_id())
    or (select private.is_org_member(organization_id))
  );
drop policy if exists member_org_write on public.member;
create policy member_org_write on public.member
  for insert to aqua_app
  with check ((select private.is_org_member(organization_id)));
drop policy if exists member_org_update on public.member;
create policy member_org_update on public.member
  for update to aqua_app
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));
drop policy if exists member_org_delete on public.member;
create policy member_org_delete on public.member
  for delete to aqua_app
  using ((select private.is_org_member(organization_id)));

alter table public.invitation enable row level security;
alter table public.invitation force row level security;
drop policy if exists invitation_org_member on public.invitation;
create policy invitation_org_member on public.invitation
  for all to aqua_app
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

alter table public.user_preferences enable row level security;
alter table public.user_preferences force row level security;
drop policy if exists user_preferences_self on public.user_preferences;
create policy user_preferences_self on public.user_preferences
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

alter table public.notification_preferences enable row level security;
alter table public.notification_preferences force row level security;
drop policy if exists notification_preferences_self on public.notification_preferences;
create policy notification_preferences_self on public.notification_preferences
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

alter table public.staff_profiles enable row level security;
alter table public.staff_profiles force row level security;
drop policy if exists staff_profiles_self on public.staff_profiles;
create policy staff_profiles_self on public.staff_profiles
  for all to aqua_app
  using (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));
