-- Public bucket for team logos. Uploads go through the service role
-- from @project-aqua/storage; anonymous clients may only read.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-logos',
  'team-logos',
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

-- Public read for team logos (bucket is public; policy for explicit SELECT).
drop policy if exists "Public read team logos" on storage.objects;
create policy "Public read team logos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'team-logos');
