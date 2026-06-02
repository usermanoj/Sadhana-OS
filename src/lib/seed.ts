import type { Category, SubComponent, TrackingType } from '../types';
import { addAuditEntry } from './audit';
import { appRepository, type AppStateSnapshot, type StoredAuditLogEntry } from './repository';


export const APP_SCHEMA_VERSION = '1.1';
export const CLOUD_SCHEMA_VERSION = '0.2';
export const STARTER_TEMPLATE_VERSION = '2026.06.default';

interface SubComponentSeedDefinition {
  id: string;
  name: string;
  trackingType: TrackingType;
}

interface CategorySeedDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  subComponents: SubComponentSeedDefinition[];
}

const seedId = (numericId: number): string =>
  `00000000-0000-4000-8000-${String(numericId).padStart(12, '0')}`;

const categorySeedDefinitions: CategorySeedDefinition[] = [
  {
    id: seedId(1),
    name: '8 Limbs of Yoga',
    icon: 'lotus',
    color: '#7C3AED',
    subComponents: [
      { id: seedId(101), name: 'Yama', trackingType: 'boolean' },
      { id: seedId(102), name: 'Niyama', trackingType: 'boolean' },
      { id: seedId(103), name: 'Asana', trackingType: 'boolean' },
      { id: seedId(104), name: 'Pranayama', trackingType: 'boolean' },
      { id: seedId(105), name: 'Pratyahara', trackingType: 'boolean' },
      { id: seedId(106), name: 'Dharana', trackingType: 'boolean' },
      { id: seedId(107), name: 'Dhyana', trackingType: 'boolean' },
      { id: seedId(108), name: 'Samadhi', trackingType: 'boolean' },
    ],
  },
  {
    id: seedId(2),
    name: 'Speech / Vaani Control',
    icon: 'messages-square',
    color: '#C2410C',
    subComponents: [
      { id: seedId(201), name: 'Truthfulness', trackingType: 'boolean' },
      { id: seedId(202), name: 'Non-gossip', trackingType: 'boolean' },
      { id: seedId(203), name: 'Kind words', trackingType: 'boolean' },
      { id: seedId(204), name: 'Silence practice', trackingType: 'boolean' },
    ],
  },
  {
    id: seedId(3),
    name: 'Six Senses Control',
    icon: 'eye',
    color: '#0F766E',
    subComponents: [
      { id: seedId(301), name: 'Sight', trackingType: 'scale5' },
      { id: seedId(302), name: 'Sound', trackingType: 'scale5' },
      { id: seedId(303), name: 'Smell', trackingType: 'scale5' },
      { id: seedId(304), name: 'Taste', trackingType: 'scale5' },
      { id: seedId(305), name: 'Touch', trackingType: 'scale5' },
      { id: seedId(306), name: 'Mind', trackingType: 'scale5' },
    ],
  },
  {
    id: seedId(4),
    name: 'Spiritual',
    icon: 'sparkles',
    color: '#9333EA',
    subComponents: [
      { id: seedId(401), name: 'Prayer', trackingType: 'boolean' },
      { id: seedId(402), name: 'Mantra', trackingType: 'count' },
      { id: seedId(403), name: 'Satsang', trackingType: 'boolean' },
      { id: seedId(404), name: 'Scripture study', trackingType: 'duration' },
    ],
  },
  {
    id: seedId(5),
    name: 'Physical',
    icon: 'dumbbell',
    color: '#16A34A',
    subComponents: [
      { id: seedId(501), name: 'Exercise', trackingType: 'duration' },
      { id: seedId(502), name: 'Diet', trackingType: 'scale5' },
      { id: seedId(503), name: 'Sleep', trackingType: 'numeric' },
      { id: seedId(504), name: 'Hydration', trackingType: 'count' },
    ],
  },
  {
    id: seedId(6),
    name: 'Mental',
    icon: 'brain',
    color: '#2563EB',
    subComponents: [
      { id: seedId(601), name: 'Meditation', trackingType: 'duration' },
      { id: seedId(602), name: 'Journaling', trackingType: 'text' },
      { id: seedId(603), name: 'Gratitude', trackingType: 'text' },
      { id: seedId(604), name: 'Focus time', trackingType: 'duration' },
    ],
  },
  {
    id: seedId(7),
    name: 'Society',
    icon: 'hand-heart',
    color: '#DB2777',
    subComponents: [
      { id: seedId(701), name: 'Volunteering', trackingType: 'boolean' },
      { id: seedId(702), name: 'Charity', trackingType: 'boolean' },
      { id: seedId(703), name: 'Environmental care', trackingType: 'boolean' },
      { id: seedId(704), name: 'Community service', trackingType: 'boolean' },
    ],
  },
  {
    id: seedId(8),
    name: 'Professional',
    icon: 'briefcase-business',
    color: '#4F46E5',
    subComponents: [
      { id: seedId(801), name: 'Deep work', trackingType: 'duration' },
      { id: seedId(802), name: 'Learning', trackingType: 'duration' },
      { id: seedId(803), name: 'Mentoring', trackingType: 'boolean' },
      { id: seedId(804), name: 'Planning', trackingType: 'boolean' },
    ],
  },
  {
    id: seedId(9),
    name: 'Family',
    icon: 'home-heart',
    color: '#D97706',
    subComponents: [
      { id: seedId(901), name: 'Quality time', trackingType: 'boolean' },
      { id: seedId(902), name: 'Support', trackingType: 'boolean' },
      { id: seedId(903), name: 'Communication', trackingType: 'boolean' },
      { id: seedId(904), name: 'Shared rituals', trackingType: 'boolean' },
    ],
  },
];

type SeedIdFactory = (stableId: string) => string;

const useStableId: SeedIdFactory = (stableId) => stableId;
const createRandomId: SeedIdFactory = () => crypto.randomUUID();

export const createSeedCategories = (options: {
  timestamp?: string;
  idFactory?: SeedIdFactory;
} = {}): Category[] => {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const idFactory = options.idFactory ?? useStableId;

  return categorySeedDefinitions.map((category, categoryIndex) => {
    const categoryId = idFactory(category.id);

    return {
      id: categoryId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      displayOrder: categoryIndex,
      isArchived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      subComponents: category.subComponents.map((sub, habitIndex) =>
        createSubComponent(
          {
            ...sub,
            id: idFactory(sub.id),
          },
          categoryId,
          habitIndex,
          timestamp,
        ),
      ),
    };
  });
};

const createSubComponent = (
  sub: SubComponentSeedDefinition,
  categoryId: string,
  displayOrder: number,
  timestamp: string,
): SubComponent => ({
  id: sub.id,
  categoryId,
  name: sub.name,
  trackingType: sub.trackingType,
  displayOrder,
  isArchived: false,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export function createStarterTemplateSnapshot(options: {
  schemaVersion?: string;
  timestamp?: string;
  idFactory?: SeedIdFactory;
  auditIdFactory?: () => string;
} = {}): AppStateSnapshot {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const categories = createSeedCategories({
    timestamp,
    idFactory: options.idFactory ?? createRandomId,
  });
  const auditEntry: StoredAuditLogEntry = {
    id: options.auditIdFactory?.() ?? crypto.randomUUID(),
    timestamp,
    actionType: 'data_imported',
    entityType: 'system',
    entityId: 'system',
    oldValue: null,
    newValue: {
      starterTemplateVersion: STARTER_TEMPLATE_VERSION,
      categories: categories.length,
      habits: categories.reduce((total, category) => total + category.subComponents.length, 0),
    },
    note: `Applied starter template ${STARTER_TEMPLATE_VERSION}`,
  };

  return {
    version: options.schemaVersion ?? CLOUD_SCHEMA_VERSION,
    categories,
    dailyEntries: {},
    journalEntries: {},
    auditLogs: [auditEntry],
  };
}

export const shouldApplyStarterTemplate = (snapshot: AppStateSnapshot): boolean =>
  snapshot.categories.length === 0
  && Object.keys(snapshot.dailyEntries).length === 0
  && Object.keys(snapshot.journalEntries).length === 0
  && snapshot.auditLogs.length === 0;

export const seedIfNeeded = (): void => {
  const version = appRepository.getVersion(null);
  
  if (!version) {
    const categories = createSeedCategories();
    appRepository.setCategories(categories);
    appRepository.setVersion(APP_SCHEMA_VERSION);
    addAuditEntry(
      'data_imported',
      'system',
      'system',
      null,
      null,
      'Initial seed data'
    );
  } else if (version === '1.0') {
    // Migrate 1.0 to 1.1: Add tracking types to default sub-components
    const categories = appRepository.getCategories();
    
    const updatedCategories = categories.map(cat => {
      const seedCat = categorySeedDefinitions.find(sc => sc.id === cat.id);
      if (!seedCat) return cat;

      return {
        ...cat,
        subComponents: cat.subComponents.map(sub => {
          const seedSub = seedCat.subComponents.find(ss => ss.id === sub.id);
          if (seedSub && (!sub.trackingType || sub.trackingType === 'boolean')) {
            return { ...sub, trackingType: seedSub.trackingType };
          }
          return sub;
        })
      };
    });

    appRepository.setCategories(updatedCategories);
    appRepository.setVersion(APP_SCHEMA_VERSION);
    addAuditEntry(
      'data_imported',
      'system',
      'system',
      null,
      null,
      'Migrated schema from 1.0 to 1.1 to include tracking types'
    );
  }
};
