import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import { appRepository } from '../../lib/repository';
import type { Category } from '../../types';
import LocalMigrationPanel from './LocalMigrationPanel';

const category: Category = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Yoga',
  icon: 'lotus',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  subComponents: [],
};

const signedInAuthContext: AuthContextValue = {
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedIn',
  user: {
    id: 'user-1',
    email: 'practitioner@example.com',
  } as User,
  profile: {
    id: 'user-1',
    email: 'practitioner@example.com',
    displayName: 'Mira',
    timezone: 'Asia/Singapore',
    onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    weekStartsOn: 1,
  },
};

describe('LocalMigrationPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not render without a signed-in cloud user', () => {
    appRepository.setCategories([category]);

    const { container } = render(<LocalMigrationPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows migration summary for signed-in users with local data', () => {
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <LocalMigrationPanel />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Local Data Migration' })).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Migrate Local Data')).toBeInTheDocument();
  });
});
