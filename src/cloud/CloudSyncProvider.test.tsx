import { render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, defaultAuthContext, type AuthContextValue } from '../auth/AuthProvider';
import {
  appRepository,
  createLocalStorageRepository,
  resetActiveAppRepository,
  type AppStateSnapshot,
} from '../lib/repository';
import type { Category } from '../types';
import CloudSyncProvider from './CloudSyncProvider';

const mocks = vi.hoisted(() => ({
  currentUserId: 'user-b',
  loadSnapshot: vi.fn(),
  saveCategories: vi.fn(),
  saveDailyEntries: vi.fn(),
  saveJournalEntries: vi.fn(),
  saveAuditLogs: vi.fn(),
  replaceSnapshot: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({}),
}));

vi.mock('../lib/cloudRepository', () => ({
  createSupabaseCloudGateway: vi.fn((_client: unknown, userId: string) => {
    mocks.currentUserId = userId;
    return {
      loadSnapshot: mocks.loadSnapshot,
      saveCategories: mocks.saveCategories,
      saveDailyEntries: mocks.saveDailyEntries,
      saveJournalEntries: mocks.saveJournalEntries,
      saveAuditLogs: mocks.saveAuditLogs,
      replaceSnapshot: mocks.replaceSnapshot,
    };
  }),
}));

const userACategory: Category = {
  id: 'category-user-a',
  name: 'User A Practice',
  icon: 'sparkles',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  subComponents: [],
};

const emptyCloudSnapshot: AppStateSnapshot = {
  version: '0.2',
  categories: [],
  dailyEntries: {},
  journalEntries: {},
  auditLogs: [],
};

const signedInContext = (userId: string): AuthContextValue => ({
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedIn',
  user: {
    id: userId,
    email: `${userId}@example.com`,
  } as User,
  profile: {
    id: userId,
    email: `${userId}@example.com`,
    displayName: 'Practitioner',
    timezone: 'Asia/Singapore',
    onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    weekStartsOn: 1,
  },
});

function CategoryProbe() {
  const names = appRepository.getCategories().map((category) => category.name);
  return <div data-testid="category-names">{names.join(',') || 'empty'}</div>;
}

describe('CloudSyncProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    resetActiveAppRepository();
    mocks.loadSnapshot.mockResolvedValue(emptyCloudSnapshot);
    mocks.saveCategories.mockResolvedValue(undefined);
    mocks.saveDailyEntries.mockResolvedValue(undefined);
    mocks.saveJournalEntries.mockResolvedValue(undefined);
    mocks.saveAuditLogs.mockResolvedValue(undefined);
    mocks.replaceSnapshot.mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetActiveAppRepository();
    vi.clearAllMocks();
  });

  it('does not mount the app with another user local cache during cloud sign-in', async () => {
    createLocalStorageRepository().setCategories([userACategory]);

    render(
      <AuthContext.Provider value={signedInContext('user-b')}>
        <CloudSyncProvider>
          <CategoryProbe />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Preparing your private practice space...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('category-names')).toHaveTextContent('8 Limbs of Yoga');
    });

    expect(screen.getByTestId('category-names')).not.toHaveTextContent('User A Practice');
    expect(mocks.currentUserId).toBe('user-b');
    expect(JSON.parse(localStorage.getItem('sadhana:users:user-b:categories') ?? '[]')).toHaveLength(9);
    expect(JSON.parse(localStorage.getItem('sadhana:categories') ?? '[]')).toEqual([userACategory]);
    expect(mocks.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      categories: expect.any(Array),
      auditLogs: expect.arrayContaining([
        expect.objectContaining({ note: 'Applied starter template 2026.06.default' }),
      ]),
    }));
  });
});
