import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationsPath = resolve(process.cwd(), 'supabase/migrations');
const migrationSql = readdirSync(migrationsPath)
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort()
  .map((fileName) => readFileSync(resolve(migrationsPath, fileName), 'utf8'))
  .join('\n');

const userOwnedTables = [
  'profiles',
  'user_settings',
  'categories',
  'habits',
  'daily_entries',
  'daily_habit_entries',
  'journal_entries',
  'audit_log_entries',
  'import_jobs',
  'sync_devices',
  'sync_mutations',
  'daily_sadhana_plans',
];

describe('Supabase initial schema migration', () => {
  it('creates every required production table', () => {
    userOwnedTables.forEach((table) => {
      expect(migrationSql).toContain(`create table if not exists public.${table}`);
    });
  });

  it('enables row-level security for every user-owned table', () => {
    userOwnedTables.forEach((table) => {
      expect(migrationSql).toContain(`alter table public.${table} enable row level security;`);
    });
  });

  it('adds owner-scoped select, insert, and update policies for mutable user-owned tables', () => {
    [
      'categories',
      'habits',
      'daily_entries',
      'daily_habit_entries',
      'journal_entries',
      'import_jobs',
      'sync_devices',
      'sync_mutations',
      'user_settings',
      'daily_sadhana_plans',
    ].forEach((table) => {
      expect(migrationSql).toContain(`create policy ${table}_select_own on public.${table}`);
      expect(migrationSql).toContain(`create policy ${table}_insert_own on public.${table}`);
      expect(migrationSql).toContain(`create policy ${table}_update_own on public.${table}`);
      expect(migrationSql).toContain('using (user_id = auth.uid())');
      expect(migrationSql).toContain('with check (user_id = auth.uid())');
    });
  });

  it('keeps audit logs append-only for normal users', () => {
    expect(migrationSql).toContain('create policy audit_log_entries_select_own');
    expect(migrationSql).toContain('create policy audit_log_entries_insert_own');
    expect(migrationSql).not.toContain('audit_log_entries_update_own');
    expect(migrationSql).not.toContain('audit_log_entries_delete_own');
  });

  it('does not grant normal user delete policies on product tables', () => {
    expect(migrationSql).not.toMatch(/create policy \w+_delete_own/i);
    expect(migrationSql).not.toMatch(/for delete using/i);
  });

  it('adds a user-scoped idempotency key for sync mutations', () => {
    expect(migrationSql).toContain('create table if not exists public.sync_mutations');
    expect(migrationSql).toContain('client_mutation_id text not null');
    expect(migrationSql).toContain('mutation_type text not null');
    expect(migrationSql).toContain("status text not null default 'pending'");
    expect(migrationSql).toContain('unique (user_id, client_mutation_id)');
    expect(migrationSql).toContain('create index if not exists sync_mutations_user_updated_idx');
  });

  it('stores one owner-scoped adaptive plan per day without a client delete policy', () => {
    expect(migrationSql).toContain('create table if not exists public.daily_sadhana_plans');
    expect(migrationSql).toContain("mode text not null check (mode in ('minimum', 'balanced', 'full'))");
    expect(migrationSql).toContain("status text not null default 'suggested'");
    expect(migrationSql).toContain('unique (user_id, plan_date)');
    expect(migrationSql).toContain('create policy daily_sadhana_plans_select_own');
    expect(migrationSql).toContain('create policy daily_sadhana_plans_insert_own');
    expect(migrationSql).toContain('create policy daily_sadhana_plans_update_own');
    expect(migrationSql).not.toContain('daily_sadhana_plans_delete_own');
  });

  it('bootstraps profile and settings rows when an auth user is created', () => {
    expect(migrationSql).toContain('create or replace function public.handle_new_user()');
    expect(migrationSql).toContain('create trigger on_auth_user_created');
    expect(migrationSql).toContain('insert into public.profiles');
    expect(migrationSql).toContain('insert into public.user_settings');
  });
});
