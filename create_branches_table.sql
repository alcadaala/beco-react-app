-- 1. Create the 'branches' table if it doesn't exist
create table if not exists public.branches (
  id bigint generated always as identity primary key,
  name text not null unique,
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Insert default branches (WSH, DRS, DKL, MDN, KPP)
-- using 'on conflict' to avoid errors if they already exist
insert into public.branches (name)
values 
  ('WSH'),
  ('DRS'),
  ('DKL'),
  ('MDN'),
  ('KPP')
on conflict (name) do nothing;

-- 3. Enable Row Level Security (RLS)
alter table public.branches enable row level security;

-- 4. Create a policy to allow everyone (even unauthenticated users during signup) to read branches
create policy "Allow public read access to branches"
on public.branches
for select
to anon, authenticated
using (true);

-- 5. Optional: Allow authenticated users (Admins) to insert/update (if you need it later)
create policy "Allow admins to manage branches"
on public.branches
for all
to authenticated
using (auth.uid() in (select id from public.profiles where role = 'Super Admin'));
