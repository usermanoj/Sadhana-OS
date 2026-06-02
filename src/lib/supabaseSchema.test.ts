import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260601000000_initial_schema.sql',
);

const migrationSql = readFileSync(migrationPath, 'utf8');

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

  it('adds owner-scoped select, insert, and update policies for mutable product tables', () => {
    [
      'categories',
      'habits',
      'daily_entries',
      'daily_habit_entries',
      'journal_entries',
      'import_jobs',
      'sync_devices',
      'user_settings',
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

  it('bootstraps profile and settings rows when an auth user is created', () => {
    expect(migrationSql).toContain('create or replace function public.handle_new_user()');
    expect(migrationSql).toContain('create trigger on_auth_user_created');
    expect(migrationSql).toContain('insert into public.profiles');
    expect(migrationSql).toContain('insert into public.user_settings');
  });
});
