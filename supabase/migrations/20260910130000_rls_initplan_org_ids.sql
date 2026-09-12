-- Rewrite hot RLS predicates so membership is a single InitPlan
-- (`organization_id in (select private.user_org_ids())`) instead of a
-- per-row SECURITY DEFINER call. Correlated can_access_meet(meet_id)
-- on meet_entries/best times made meet pages hang under aqua_app.

create or replace function private.user_org_ids()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.member m
  where m.user_id = (select private.current_user_id());
$$;

grant execute on function private.user_org_ids() to aqua_app;

-- Org-scoped tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'meets',
    'practice_sessions',
    'subscriptions',
    'workouts',
    'training_groups',
    'ai_generations',
    'team_seasons',
    'team_swimmer_memberships',
    'meet_event_templates',
    'time_standard_sets',
    'safesport_reports',
    'audit_log',
    'import_jobs',
    'team_calendar_events',
    'calendar_feed_tokens',
    'calendar_connections',
    'calendar_sync_conflicts',
    'user_team_preferences'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_org_member', t);
    execute format(
      'create policy %I on public.%I for all to aqua_app using (organization_id in (select private.user_org_ids())) with check (organization_id in (select private.user_org_ids()))',
      t || '_org_member',
      t
    );
  end loop;
end
$$;

-- Meet children
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
    execute format('drop policy if exists %I on public.%I', t || '_via_meet', t);
    execute format(
      'create policy %I on public.%I for all to aqua_app using (meet_id in (select m.id from public.meets m where m.organization_id in (select private.user_org_ids()))) with check (meet_id in (select m.id from public.meets m where m.organization_id in (select private.user_org_ids())))',
      t || '_via_meet',
      t
    );
  end loop;
end
$$;

drop policy if exists meet_relay_result_splits_via_result on public.meet_relay_result_splits;
create policy meet_relay_result_splits_via_result on public.meet_relay_result_splits
  for all to aqua_app
  using (
    result_id in (
      select r.id
      from public.meet_relay_results r
      join public.meets m on m.id = r.meet_id
      where m.organization_id in (select private.user_org_ids())
    )
  )
  with check (
    result_id in (
      select r.id
      from public.meet_relay_results r
      join public.meets m on m.id = r.meet_id
      where m.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists season_enrollments_via_membership on public.season_enrollments;
create policy season_enrollments_via_membership on public.season_enrollments
  for all to aqua_app
  using (
    membership_id in (
      select tsm.id
      from public.team_swimmer_memberships tsm
      where tsm.organization_id in (select private.user_org_ids())
    )
  )
  with check (
    membership_id in (
      select tsm.id
      from public.team_swimmer_memberships tsm
      where tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists swimmers_via_membership on public.swimmers;
create policy swimmers_via_membership on public.swimmers
  for select to aqua_app
  using (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmers.id
        and tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists swimmers_update_via_membership on public.swimmers;
create policy swimmers_update_via_membership on public.swimmers
  for update to aqua_app
  using (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmers.id
        and tsm.organization_id in (select private.user_org_ids())
    )
  )
  with check (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmers.id
        and tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists swimmers_delete_via_membership on public.swimmers;
create policy swimmers_delete_via_membership on public.swimmers
  for delete to aqua_app
  using (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmers.id
        and tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists swimmer_best_times_via_swimmer on public.swimmer_best_times;
create policy swimmer_best_times_via_swimmer on public.swimmer_best_times
  for all to aqua_app
  using (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmer_id
        and tsm.organization_id in (select private.user_org_ids())
    )
  )
  with check (
    exists (
      select 1
      from public.team_swimmer_memberships tsm
      where tsm.swimmer_id = swimmer_id
        and tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists swimmer_time_entries_via_swimmer on public.swimmer_time_entries;
drop policy if exists swimmer_time_entries_via_membership on public.swimmer_time_entries;
create policy swimmer_time_entries_via_membership on public.swimmer_time_entries
  for all to aqua_app
  using (
    membership_id in (
      select tsm.id
      from public.team_swimmer_memberships tsm
      where tsm.organization_id in (select private.user_org_ids())
    )
  )
  with check (
    membership_id in (
      select tsm.id
      from public.team_swimmer_memberships tsm
      where tsm.organization_id in (select private.user_org_ids())
    )
  );

drop policy if exists organization_member_select on public.organization;
create policy organization_member_select on public.organization
  for select to aqua_app
  using (id in (select private.user_org_ids()));

drop policy if exists organization_member_update on public.organization;
create policy organization_member_update on public.organization
  for update to aqua_app
  using (id in (select private.user_org_ids()))
  with check (id in (select private.user_org_ids()));

drop policy if exists invitation_org_member on public.invitation;
create policy invitation_org_member on public.invitation
  for all to aqua_app
  using (organization_id in (select private.user_org_ids()))
  with check (organization_id in (select private.user_org_ids()));
