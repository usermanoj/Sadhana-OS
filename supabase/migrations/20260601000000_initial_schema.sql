-- Sadhana OS v0.2 initial Supabase schema
-- User-owned production data with RLS enabled.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version text not null default '0.2',
  week_starts_on int not null default 1 check (week_starts_on between 0 and 6),
  reminder_enabled boolean not null default false,
  reminder_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  icon text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  display_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  tracking_type text not null default 'boolean' check (
    tracking_type in ('boolean', 'scale5', 'scale10', 'duration', 'count', 'numeric', 'text')
  ),
  display_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, category_id) references public.categories(user_id, id) on delete restrict
);

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  overall_score numeric(5, 2) not null default 0 check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, entry_date)
);

create table if not exists public.daily_habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  habit_id uuid not null,
  value jsonb not null default 'false'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date, habit_id),
  foreign key (user_id, entry_date) references public.daily_entries(user_id, entry_date) on delete cascade,
  foreign key (user_id, habit_id) references public.habits(user_id, id) on delete restrict
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood text,
  gratitude text,
  spiritual_insight text,
  trigger_observed text,
  lesson_learned text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.audit_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null default now(),
  action_type text not null,
  entity_type text not null check (entity_type in ('category', 'habit', 'system')),
  entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  note text,
  source text not null default 'client' check (source in ('client', 'migration', 'server')),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('localStorage', 'json')),
  mode text not null check (mode in ('merge', 'overwrite')),
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.sync_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_label text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_order_idx on public.categories(user_id, display_order);
create index if not exists habits_user_category_order_idx on public.habits(user_id, category_id, display_order);
create index if not exists daily_entries_user_date_idx on public.daily_entries(user_id, entry_date desc);
create index if not exists daily_habit_entries_user_date_idx on public.daily_habit_entries(user_id, entry_date desc);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, entry_date desc);
create index if not exists audit_log_entries_user_timestamp_idx on public.audit_log_entries(user_id, timestamp desc);
create index if not exists import_jobs_user_created_idx on public.import_jobs(user_id, created_at desc);
create index if not exists sync_devices_user_seen_idx on public.sync_devices(user_id, last_seen_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

create trigger daily_entries_set_updated_at
before update on public.daily_entries
for each row execute function public.set_updated_at();

create trigger daily_habit_entries_set_updated_at
before update on public.daily_habit_entries
for each row execute function public.set_updated_at();

create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

create trigger import_jobs_set_updated_at
before update on public.import_jobs
for each row execute function public.set_updated_at();

create trigger sync_devices_set_updated_at
before update on public.sync_devices
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.categories enable row level security;
alter table public.habits enable row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_habit_entries enable row level security;
alter table public.journal_entries enable row level security;
alter table public.audit_log_entries enable row level security;
alter table public.import_jobs enable row level security;
alter table public.sync_devices enable row level security;

create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

create policy profiles_insert_own on public.profiles
for insert with check (id = auth.uid());

create policy profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy user_settings_select_own on public.user_settings
for select using (user_id = auth.uid());

create policy user_settings_insert_own on public.user_settings
for insert with check (user_id = auth.uid());

create policy user_settings_update_own on public.user_settings
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_select_own on public.categories
for select using (user_id = auth.uid());

create policy categories_insert_own on public.categories
for insert with check (user_id = auth.uid());

create policy categories_update_own on public.categories
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy habits_select_own on public.habits
for select using (user_id = auth.uid());

create policy habits_insert_own on public.habits
for insert with check (user_id = auth.uid());

create policy habits_update_own on public.habits
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy daily_entries_select_own on public.daily_entries
for select using (user_id = auth.uid());

create policy daily_entries_insert_own on public.daily_entries
for insert with check (user_id = auth.uid());

create policy daily_entries_update_own on public.daily_entries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy daily_habit_entries_select_own on public.daily_habit_entries
for select using (user_id = auth.uid());

create policy daily_habit_entries_insert_own on public.daily_habit_entries
for insert with check (user_id = auth.uid());

create policy daily_habit_entries_update_own on public.daily_habit_entries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy journal_entries_select_own on public.journal_entries
for select using (user_id = auth.uid());

create policy journal_entries_insert_own on public.journal_entries
for insert with check (user_id = auth.uid());

create policy journal_entries_update_own on public.journal_entries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_log_entries_select_own on public.audit_log_entries
for select using (user_id = auth.uid());

create policy audit_log_entries_insert_own on public.audit_log_entries
for insert with check (user_id = auth.uid());

create policy import_jobs_select_own on public.import_jobs
for select using (user_id = auth.uid());

create policy import_jobs_insert_own on public.import_jobs
for insert with check (user_id = auth.uid());

create policy import_jobs_update_own on public.import_jobs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sync_devices_select_own on public.sync_devices
for select using (user_id = auth.uid());

create policy sync_devices_insert_own on public.sync_devices
for insert with check (user_id = auth.uid());

create policy sync_devices_update_own on public.sync_devices
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
