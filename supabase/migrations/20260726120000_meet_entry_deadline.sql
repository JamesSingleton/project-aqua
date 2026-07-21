alter table public.meets
add column if not exists entry_deadline timestamp;
