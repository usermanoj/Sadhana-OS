-- Sadhana OS v0.2 sync mutation tracking
-- RLS-safe idempotency records for queued client cloud writes.

create table if not exists public.sync_mutations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_mutation_id text not null check (length(trim(client_mutation_id)) > 0),
  mutation_type text not null check (mutation_type in ('replaceSnapshot')),
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed', 'conflict')),
  attempt_count int not null default 0 check (attempt_count >= 0),
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, client_mutation_id)
);

create index if not exists sync_mutations_user_updated_idx
on public.sync_mutations(user_id, updated_at desc);

create trigger sync_mutations_set_updated_at
before update on public.sync_mutations
for each row execute function public.set_updated_at();

alter table public.sync_mutations enable row level security;

create policy sync_mutations_select_own on public.sync_mutations
for select using (user_id = auth.uid());

create policy sync_mutations_insert_own on public.sync_mutations
for insert with check (user_id = auth.uid());

create policy sync_mutations_update_own on public.sync_mutations
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
