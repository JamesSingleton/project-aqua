-- High school class year (FR/SO/JR/SR) on team memberships.
alter table public.team_swimmer_memberships
  add column if not exists class_year text;

-- Legacy imports stored class year in practice_group; move those over.
update public.team_swimmer_memberships
set
  class_year = upper(practice_group),
  practice_group = null
where
  class_year is null
  and practice_group is not null
  and upper(practice_group) in ('FR', 'SO', 'JR', 'SR');

comment on column public.team_swimmer_memberships.class_year is
  'High school class year: FR, SO, JR, or SR';
