import type { AuditLogEntry, Category, DailyEntry, JournalEntry } from '../types';
import {
  createLocalStorageRepository,
  createUserScopedLocalStorageRepository,
  type AppStateSnapshot,
} from './repository';

const category: Category = {
  id: 'category-1',
  name: 'Yoga',
  icon: 'lotus',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  subComponents: [],
};

const dailyEntry: DailyEntry = {
  date: '2026-01-01',
  completions: { habit1: true },
  categoryScores: { 'category-1': 100 },
  overallScore: 100,
  updatedAt: '2026-01-01T01:00:00.000Z',
};

const journalEntry: JournalEntry = {
  date: '2026-01-01',
  content: 'A steady practice.',
  createdAt: '2026-01-01T01:00:00.000Z',
  updatedAt: '2026-01-01T01:00:00.000Z',
};

const auditEntry: AuditLogEntry = {
  id: 'audit-1',
  timestamp: '2026-01-01T01:00:00.000Z',
  actionType: 'category_created',
  entityType: 'category',
  entityId: 'category-1',
  oldValue: null,
  newValue: category,
  note: 'Created category "Yoga"',
};

describe('createLocalStorageRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads and writes the schema version using the existing storage key', () => {
    const repository = createLocalStorageRepository();

    expect(repository.getVersion(null)).toBeNull();
    repository.setVersion('1.1');

    expect(repository.getVersion('0.0')).toBe('1.1');
    expect(localStorage.getItem('sadhana:version')).toBe('"1.1"');
  });

  it('reads and writes categories', () => {
    const repository = createLocalStorageRepository();

    expect(repository.getCategories()).toEqual([]);
    repository.setCategories([category]);

    expect(repository.getCategories()).toEqual([category]);
    expect(JSON.parse(localStorage.getItem('sadhana:categories') ?? '[]')).toEqual([category]);
  });

  it('reads and writes daily entries', () => {
    const repository = createLocalStorageRepository();

    repository.setDailyEntries({ [dailyEntry.date]: dailyEntry });

    expect(repository.getDailyEntries()).toEqual({ [dailyEntry.date]: dailyEntry });
    expect(JSON.parse(localStorage.getItem('sadhana:entries') ?? '{}')).toEqual({
      [dailyEntry.date]: dailyEntry,
    });
  });

  it('reads and writes journal entries', () => {
    const repository = createLocalStorageRepository();

    repository.setJournalEntries({ [journalEntry.date]: journalEntry });

    expect(repository.getJournalEntries()).toEqual({ [journalEntry.date]: journalEntry });
    expect(JSON.parse(localStorage.getItem('sadhana:journal') ?? '{}')).toEqual({
      [journalEntry.date]: journalEntry,
    });
  });

  it('reads and writes audit logs', () => {
    const repository = createLocalStorageRepository();

    repository.setAuditLogs([auditEntry]);

    expect(repository.getAuditLogs()).toEqual([auditEntry]);
    expect(JSON.parse(localStorage.getItem('sadhana:audit') ?? '[]')).toEqual([auditEntry]);
  });

  it('reads and replaces the full app snapshot', () => {
    const repository = createLocalStorageRepository();
    const snapshot: AppStateSnapshot = {
      version: '1.1',
      categories: [category],
      dailyEntries: { [dailyEntry.date]: dailyEntry },
      journalEntries: { [journalEntry.date]: journalEntry },
      auditLogs: [auditEntry],
    };

    repository.replaceSnapshot(snapshot);

    expect(repository.getSnapshot()).toEqual(snapshot);
  });

  it('keeps user-scoped cloud cache separate from legacy local MVP storage', () => {
    const legacyRepository = createLocalStorageRepository();
    const userRepository = createUserScopedLocalStorageRepository('user-a');

    legacyRepository.setCategories([category]);

    expect(userRepository.getCategories()).toEqual([]);

    userRepository.setCategories([{ ...category, id: 'category-user-a', name: 'User A Practice' }]);

    expect(legacyRepository.getCategories()).toEqual([category]);
    expect(JSON.parse(localStorage.getItem('sadhana:users:user-a:categories') ?? '[]')).toEqual([
      { ...category, id: 'category-user-a', name: 'User A Practice' },
    ]);
  });

  it('keeps each signed-in user in a separate local cache namespace', () => {
    const userARepository = createUserScopedLocalStorageRepository('user-a');
    const userBRepository = createUserScopedLocalStorageRepository('user-b');

    userARepository.setCategories([{ ...category, id: 'category-user-a', name: 'User A Practice' }]);
    userBRepository.setCategories([{ ...category, id: 'category-user-b', name: 'User B Practice' }]);

    expect(userARepository.getCategories()).toEqual([
      { ...category, id: 'category-user-a', name: 'User A Practice' },
    ]);
    expect(userBRepository.getCategories()).toEqual([
      { ...category, id: 'category-user-b', name: 'User B Practice' },
    ]);
    expect(localStorage.getItem('sadhana:categories')).toBeNull();
  });
});
