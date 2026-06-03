#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SADHANA_RLS_USER_A_EMAIL',
  'SADHANA_RLS_USER_A_PASSWORD',
  'SADHANA_RLS_USER_B_EMAIL',
  'SADHANA_RLS_USER_B_PASSWORD',
];

const usage = `Sadhana OS live Supabase RLS validation

Required environment variables:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  SADHANA_RLS_USER_A_EMAIL
  SADHANA_RLS_USER_A_PASSWORD
  SADHANA_RLS_USER_B_EMAIL
  SADHANA_RLS_USER_B_PASSWORD

PowerShell example:
  $env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
  $env:VITE_SUPABASE_ANON_KEY="<anon-key>"
  $env:SADHANA_RLS_USER_A_EMAIL="user-a@example.com"
  $env:SADHANA_RLS_USER_A_PASSWORD="<password>"
  $env:SADHANA_RLS_USER_B_EMAIL="user-b@example.com"
  $env:SADHANA_RLS_USER_B_PASSWORD="<password>"
  npm run validate:cloud-rls

Notes:
  - Use a development/staging Supabase project.
  - Test users must already exist and be able to sign in.
  - This script creates test rows, archives the temporary category/habit, and leaves non-sensitive validation history.
  - It does not use a service-role key and does not hard-delete data.
`;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(usage);
  process.exit(0);
}

const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());

if (missingEnv.length > 0) {
  console.error('Missing required environment variables:');
  missingEnv.forEach((key) => console.error(`  - ${key}`));
  console.error('');
  console.error(usage);
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();

const createAnonClient = () =>
  createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

const userAClient = createAnonClient();
const userBClient = createAnonClient();

const checks = [];

function pass(name, detail = '') {
  checks.push({ name, status: 'pass', detail });
  console.log(`PASS ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, detail) {
  checks.push({ name, status: 'fail', detail });
  throw new Error(`${name}: ${detail}`);
}

function warn(name, detail) {
  checks.push({ name, status: 'warn', detail });
  console.warn(`WARN ${name} - ${detail}`);
}

async function signIn(client, label, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    fail(`${label} sign-in`, error.message);
  }

  if (!data.user?.id) {
    fail(`${label} sign-in`, 'Supabase returned no authenticated user ID.');
  }

  pass(`${label} sign-in`, data.user.id);
  return data.user;
}

async function insertAndReturnId(client, table, row, label) {
  const { data, error } = await client.from(table).insert(row).select('id').single();

  if (error) {
    fail(label, error.message);
  }

  if (!data?.id) {
    fail(label, 'Insert returned no row ID.');
  }

  pass(label, data.id);
  return data.id;
}

async function expectNoVisibleRows(client, table, column, value, label) {
  const { data, error } = await client.from(table).select(column).eq(column, value);

  if (error) {
    fail(label, error.message);
  }

  if ((data ?? []).length !== 0) {
    fail(label, `Expected 0 visible rows, received ${data.length}.`);
  }

  pass(label);
}

async function ensureOwnUserSettings(client, userId, label) {
  const { data, error } = await client
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    fail(label, error.message);
  }

  if (data?.user_id === userId) {
    pass(label, 'existing row');
    return;
  }

  const { error: insertError } = await client.from('user_settings').insert({ user_id: userId });

  if (insertError) {
    fail(label, insertError.message);
  }

  pass(label, 'created missing row through normal authenticated insert');
}

async function expectRowValue(client, table, id, columns, expected, label) {
  const { data, error } = await client.from(table).select(columns).eq('id', id).single();

  if (error) {
    fail(label, error.message);
  }

  Object.entries(expected).forEach(([key, value]) => {
    if (data?.[key] !== value) {
      fail(label, `Expected ${key}=${JSON.stringify(value)}, received ${JSON.stringify(data?.[key])}.`);
    }
  });

  pass(label);
  return data;
}

async function expectRejectedOrNoop(operation, verifyUnchanged, label) {
  const { error } = await operation();

  if (error) {
    pass(label, `rejected: ${error.message}`);
    return;
  }

  await verifyUnchanged();
  pass(label, 'no rows changed');
}

function testDateFromRunId(runId) {
  const base = Date.UTC(2040, 0, 1);
  const seconds = Number.parseInt(runId.slice(-8), 36);
  const dayOffset = Number.isFinite(seconds) ? seconds % 20000 : Math.floor(Date.now() / 1000) % 20000;
  return new Date(base + dayOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function run() {
  console.log('Starting live Supabase RLS validation for Sadhana OS.');
  console.log('Use this only against development or staging projects.');
  console.log('');

  const userA = await signIn(
    userAClient,
    'User A',
    process.env.SADHANA_RLS_USER_A_EMAIL.trim(),
    process.env.SADHANA_RLS_USER_A_PASSWORD,
  );
  const userB = await signIn(
    userBClient,
    'User B',
    process.env.SADHANA_RLS_USER_B_EMAIL.trim(),
    process.env.SADHANA_RLS_USER_B_PASSWORD,
  );

  if (userA.id === userB.id) {
    fail('Distinct test users', 'User A and User B resolved to the same auth user ID.');
  }
  pass('Distinct test users');
  await ensureOwnUserSettings(userAClient, userA.id, 'User A has own settings row');

  const runId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();
  const entryDate = testDateFromRunId(runId);
  const categoryId = crypto.randomUUID();
  const habitId = crypto.randomUUID();
  const dailyEntryId = crypto.randomUUID();
  const dailyHabitEntryId = crypto.randomUUID();
  const journalEntryId = crypto.randomUUID();
  const auditEntryId = crypto.randomUUID();
  const syncMutationId = crypto.randomUUID();
  const categoryName = `RLS Test ${runId}`;

  await insertAndReturnId(userAClient, 'categories', {
    id: categoryId,
    user_id: userA.id,
    name: categoryName,
    icon: 'shield-check',
    color: '#7C3AED',
    display_order: 9999,
    is_archived: false,
    created_at: timestamp,
    updated_at: timestamp,
  }, 'User A can insert own category');

  await insertAndReturnId(userAClient, 'habits', {
    id: habitId,
    user_id: userA.id,
    category_id: categoryId,
    name: `RLS Habit ${runId}`,
    tracking_type: 'boolean',
    display_order: 0,
    is_archived: false,
    created_at: timestamp,
    updated_at: timestamp,
  }, 'User A can insert own habit');

  await insertAndReturnId(userAClient, 'daily_entries', {
    id: dailyEntryId,
    user_id: userA.id,
    entry_date: entryDate,
    overall_score: 100,
    category_scores: { [categoryId]: 100 },
    created_at: timestamp,
    updated_at: timestamp,
  }, 'User A can insert own daily entry');

  await insertAndReturnId(userAClient, 'daily_habit_entries', {
    id: dailyHabitEntryId,
    user_id: userA.id,
    entry_date: entryDate,
    habit_id: habitId,
    value: true,
    created_at: timestamp,
    updated_at: timestamp,
  }, 'User A can insert own daily habit entry');

  await insertAndReturnId(userAClient, 'journal_entries', {
    id: journalEntryId,
    user_id: userA.id,
    entry_date: entryDate,
    mood: 'steady',
    gratitude: null,
    spiritual_insight: null,
    trigger_observed: null,
    lesson_learned: null,
    content: `RLS validation journal ${runId}`,
    created_at: timestamp,
    updated_at: timestamp,
  }, 'User A can insert own journal entry');

  await insertAndReturnId(userAClient, 'audit_log_entries', {
    id: auditEntryId,
    user_id: userA.id,
    timestamp,
    action_type: 'category_created',
    entity_type: 'category',
    entity_id: categoryId,
    old_value: null,
    new_value: { name: categoryName },
    note: `RLS validation ${runId}`,
    source: 'client',
  }, 'User A can insert own audit log');

  await insertAndReturnId(userAClient, 'sync_mutations', {
    id: syncMutationId,
    user_id: userA.id,
    client_mutation_id: `rls-validation-${runId}`,
    mutation_type: 'replaceSnapshot',
    status: 'running',
    attempt_count: 1,
    last_error: null,
    metadata: {
      validation: true,
      runId,
    },
  }, 'User A can insert own sync mutation');

  await expectNoVisibleRows(userBClient, 'profiles', 'id', userA.id, 'User B cannot select User A profile');
  await expectNoVisibleRows(userBClient, 'user_settings', 'user_id', userA.id, 'User B cannot select User A settings');
  await expectNoVisibleRows(userBClient, 'categories', 'id', categoryId, 'User B cannot select User A category');
  await expectNoVisibleRows(userBClient, 'habits', 'id', habitId, 'User B cannot select User A habit');
  await expectNoVisibleRows(userBClient, 'daily_entries', 'id', dailyEntryId, 'User B cannot select User A daily entry');
  await expectNoVisibleRows(
    userBClient,
    'daily_habit_entries',
    'id',
    dailyHabitEntryId,
    'User B cannot select User A daily habit entry',
  );
  await expectNoVisibleRows(userBClient, 'journal_entries', 'id', journalEntryId, 'User B cannot select User A journal');
  await expectNoVisibleRows(userBClient, 'audit_log_entries', 'id', auditEntryId, 'User B cannot select User A audit log');
  await expectNoVisibleRows(
    userBClient,
    'sync_mutations',
    'id',
    syncMutationId,
    'User B cannot select User A sync mutation',
  );

  const crossUserCategoryId = crypto.randomUUID();
  const { error: crossUserInsertError } = await userBClient.from('categories').insert({
    id: crossUserCategoryId,
    user_id: userA.id,
    name: `Cross User Insert ${runId}`,
    icon: 'shield-check',
    color: '#EF4444',
    display_order: 9999,
    is_archived: false,
  });

  if (!crossUserInsertError) {
    fail('User B cannot insert category with User A owner', 'Insert unexpectedly succeeded.');
  }
  pass('User B cannot insert category with User A owner', crossUserInsertError.message);

  const { error: crossUserFkError } = await userBClient.from('habits').insert({
    id: crypto.randomUUID(),
    user_id: userB.id,
    category_id: categoryId,
    name: `Cross User FK ${runId}`,
    tracking_type: 'boolean',
    display_order: 0,
    is_archived: false,
  });

  if (!crossUserFkError) {
    fail('Cross-user habit/category FK is rejected', 'Insert unexpectedly succeeded.');
  }
  pass('Cross-user habit/category FK is rejected', crossUserFkError.message);

  await expectRejectedOrNoop(
    () => userBClient.from('categories').update({ name: `Tampered ${runId}` }).eq('id', categoryId),
    () => expectRowValue(
      userAClient,
      'categories',
      categoryId,
      'name',
      { name: categoryName },
      'User A category stayed unchanged after User B update attempt',
    ),
    'User B cannot update User A category',
  );

  await expectRejectedOrNoop(
    () => userBClient.from('sync_mutations').update({ status: 'failed' }).eq('id', syncMutationId),
    () => expectRowValue(
      userAClient,
      'sync_mutations',
      syncMutationId,
      'status',
      { status: 'running' },
      'User A sync mutation stayed unchanged after User B update attempt',
    ),
    'User B cannot update User A sync mutation',
  );

  await expectRejectedOrNoop(
    () => userBClient.from('categories').delete().eq('id', categoryId),
    () => expectRowValue(
      userAClient,
      'categories',
      categoryId,
      'name',
      { name: categoryName },
      'User A category stayed present after User B delete attempt',
    ),
    'User B cannot delete User A category',
  );

  await expectRejectedOrNoop(
    () => userAClient.from('journal_entries').delete().eq('id', journalEntryId),
    () => expectRowValue(
      userAClient,
      'journal_entries',
      journalEntryId,
      'content',
      { content: `RLS validation journal ${runId}` },
      'User A journal stayed present after own delete attempt',
    ),
    'Normal user cannot hard-delete own journal entry',
  );

  await expectRejectedOrNoop(
    () => userAClient.from('sync_mutations').delete().eq('id', syncMutationId),
    () => expectRowValue(
      userAClient,
      'sync_mutations',
      syncMutationId,
      'status',
      { status: 'running' },
      'Sync mutation stayed present after own delete attempt',
    ),
    'Normal user cannot hard-delete own sync mutation',
  );

  await expectRejectedOrNoop(
    () => userAClient.from('audit_log_entries').update({ note: `Tampered ${runId}` }).eq('id', auditEntryId),
    () => expectRowValue(
      userAClient,
      'audit_log_entries',
      auditEntryId,
      'note',
      { note: `RLS validation ${runId}` },
      'Audit log stayed unchanged after own update attempt',
    ),
    'Normal user cannot update own audit log',
  );

  await expectRejectedOrNoop(
    () => userAClient.from('audit_log_entries').delete().eq('id', auditEntryId),
    () => expectRowValue(
      userAClient,
      'audit_log_entries',
      auditEntryId,
      'note',
      { note: `RLS validation ${runId}` },
      'Audit log stayed present after own delete attempt',
    ),
    'Normal user cannot hard-delete own audit log',
  );

  const { error: archiveHabitError } = await userAClient
    .from('habits')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', habitId);
  if (archiveHabitError) {
    warn('Archive temporary habit', archiveHabitError.message);
  } else {
    pass('Archive temporary habit');
  }

  const { error: archiveCategoryError } = await userAClient
    .from('categories')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', categoryId);
  if (archiveCategoryError) {
    warn('Archive temporary category', archiveCategoryError.message);
  } else {
    pass('Archive temporary category');
  }

  console.log('');
  console.log(`Completed ${checks.filter((check) => check.status === 'pass').length} passing checks.`);
  const warnings = checks.filter((check) => check.status === 'warn');
  if (warnings.length > 0) {
    console.log(`${warnings.length} warning(s) were recorded. Review output above.`);
  }
  console.log('Live Supabase RLS validation passed.');
}

run().catch((error) => {
  console.error('');
  console.error('Live Supabase RLS validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
