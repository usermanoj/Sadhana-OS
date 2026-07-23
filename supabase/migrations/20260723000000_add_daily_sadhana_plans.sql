create table if not exists public.daily_sadhana_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  mode text not null check (mode in ('minimum', 'balanced', 'full')),
  status text not null default 'suggested' check (status in ('suggested', 'confirmed')),
  available_minutes integer not null check (available_minutes between 1 and 180),
  energy_level integer not null check (energy_level between 1 and 5),
  focus_category_ids uuid[] not null default '{}',
  intention text check (char_length(intention) <= 80),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  excluded_habit_ids uuid[] not null default '{}',
  engine_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index if not exists daily_sadhana_plans_user_date_idx
on public.daily_sadhana_plans(user_id, plan_date desc);

drop trigger if exists daily_sadhana_plans_set_updated_at on public.daily_sadhana_plans;
create trigger daily_sadhana_plans_set_updated_at
before update on public.daily_sadhana_plans
for each row execute function public.set_updated_at();

alter table public.daily_sadhana_plans enable row level security;

create policy daily_sadhana_plans_select_own on public.daily_sadhana_plans
for select using (user_id = auth.uid());

create policy daily_sadhana_plans_insert_own on public.daily_sadhana_plans
for insert with check (user_id = auth.uid());

create policy daily_sadhana_plans_update_own on public.daily_sadhana_plans
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.audit_log_entries
drop constraint if exists audit_log_entries_entity_type_check;

alter table public.audit_log_entries
add constraint audit_log_entries_entity_type_check
check (entity_type in ('category', 'habit', 'daily_plan', 'system'));
