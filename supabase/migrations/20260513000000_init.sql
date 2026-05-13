-- =========================================================
-- PhiliFinds — initial schema
-- Run automatically by `supabase db push` or via the SQL editor.
-- =========================================================

-- profiles ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- trips ---------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  destination text not null,
  budget text not null check (budget in ('budget','mid-range','luxury')),
  group_size int not null check (group_size between 1 and 50),
  duration int not null check (duration between 1 and 60),
  activities text[] not null default '{}',
  itinerary jsonb,
  created_at timestamptz not null default now()
);
create index if not exists trips_user_id_idx on public.trips(user_id);

-- emergency_contacts --------------------------------------
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row-Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.emergency_contacts enable row level security;

-- profiles: each user can read & update only their own profile
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- trips: each user can fully manage only their own trips
drop policy if exists "users manage own trips" on public.trips;
create policy "users manage own trips" on public.trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- emergency_contacts:
--   any authenticated user can READ
--   only admins can INSERT / UPDATE / DELETE
drop policy if exists "anyone read contacts" on public.emergency_contacts;
create policy "anyone read contacts" on public.emergency_contacts
  for select using (auth.role() = 'authenticated');

drop policy if exists "admins write contacts" on public.emergency_contacts;
create policy "admins write contacts" on public.emergency_contacts
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- =========================================================
-- Auto-create profile on signup
-- =========================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email = 'admin@philifinds.ph'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Seed default emergency contacts (idempotent)
-- =========================================================
insert into public.emergency_contacts (name, number, category, description)
select * from (values
  ('Philippine Red Cross',     '143',              'Medical Emergency',   'Emergency medical services and disaster response'),
  ('NDRRMC',                   '(02) 8911-1406',   'Disaster Response',   'National Disaster Risk Reduction and Management Council'),
  ('PNP Hotline',              '117',              'Police',              'Philippine National Police emergency hotline'),
  ('Bureau of Fire Protection','(02) 8426-0219',   'Fire Emergency',      'Fire emergency and rescue services'),
  ('Coast Guard',              '(02) 8527-8481',   'Maritime Emergency',  'Philippine Coast Guard for maritime emergencies'),
  ('Department of Tourism',    '(02) 8524-1703',   'Tourist Assistance',  'Tourist assistance and information hotline')
) as v(name, number, category, description)
where not exists (select 1 from public.emergency_contacts);
