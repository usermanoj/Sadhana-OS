import type { Category, SubComponent } from '../types';
import { getItem, setItem } from './storage';
import { addAuditEntry } from './audit';


export const APP_SCHEMA_VERSION = '1.0';

interface SubComponentSeedDefinition {
  id: string;
  name: string;
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
      { id: seedId(101), name: 'Yama' },
      { id: seedId(102), name: 'Niyama' },
      { id: seedId(103), name: 'Asana' },
      { id: seedId(104), name: 'Pranayama' },
      { id: seedId(105), name: 'Pratyahara' },
      { id: seedId(106), name: 'Dharana' },
      { id: seedId(107), name: 'Dhyana' },
      { id: seedId(108), name: 'Samadhi' },
    ],
  },
  {
    id: seedId(2),
    name: 'Speech / Vaani Control',
    icon: 'messages-square',
    color: '#C2410C',
    subComponents: [
      { id: seedId(201), name: 'Truthfulness' },
      { id: seedId(202), name: 'Non-gossip' },
      { id: seedId(203), name: 'Kind words' },
      { id: seedId(204), name: 'Silence practice' },
    ],
  },
  {
    id: seedId(3),
    name: 'Six Senses Control',
    icon: 'eye',
    color: '#0F766E',
    subComponents: [
      { id: seedId(301), name: 'Sight' },
      { id: seedId(302), name: 'Sound' },
      { id: seedId(303), name: 'Smell' },
      { id: seedId(304), name: 'Taste' },
      { id: seedId(305), name: 'Touch' },
      { id: seedId(306), name: 'Mind' },
    ],
  },
  {
    id: seedId(4),
    name: 'Spiritual',
    icon: 'sparkles',
    color: '#9333EA',
    subComponents: [
      { id: seedId(401), name: 'Prayer' },
      { id: seedId(402), name: 'Mantra' },
      { id: seedId(403), name: 'Satsang' },
      { id: seedId(404), name: 'Scripture study' },
    ],
  },
  {
    id: seedId(5),
    name: 'Physical',
    icon: 'dumbbell',
    color: '#16A34A',
    subComponents: [
      { id: seedId(501), name: 'Exercise' },
      { id: seedId(502), name: 'Diet' },
      { id: seedId(503), name: 'Sleep' },
      { id: seedId(504), name: 'Hydration' },
    ],
  },
  {
    id: seedId(6),
    name: 'Mental',
    icon: 'brain',
    color: '#2563EB',
    subComponents: [
      { id: seedId(601), name: 'Meditation' },
      { id: seedId(602), name: 'Journaling' },
      { id: seedId(603), name: 'Gratitude' },
      { id: seedId(604), name: 'Focus time' },
    ],
  },
  {
    id: seedId(7),
    name: 'Society',
    icon: 'hand-heart',
    color: '#DB2777',
    subComponents: [
      { id: seedId(701), name: 'Volunteering' },
      { id: seedId(702), name: 'Charity' },
      { id: seedId(703), name: 'Environmental care' },
      { id: seedId(704), name: 'Community service' },
    ],
  },
  {
    id: seedId(8),
    name: 'Professional',
    icon: 'briefcase-business',
    color: '#4F46E5',
    subComponents: [
      { id: seedId(801), name: 'Deep work' },
      { id: seedId(802), name: 'Learning' },
      { id: seedId(803), name: 'Mentoring' },
      { id: seedId(804), name: 'Planning' },
    ],
  },
  {
    id: seedId(9),
    name: 'Family',
    icon: 'home-heart',
    color: '#D97706',
    subComponents: [
      { id: seedId(901), name: 'Quality time' },
      { id: seedId(902), name: 'Support' },
      { id: seedId(903), name: 'Communication' },
      { id: seedId(904), name: 'Shared rituals' },
    ],
  },
];

const createSeedCategories = (): Category[] => {
  const timestamp = new Date().toISOString();
  return categorySeedDefinitions.map((category, categoryIndex) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    displayOrder: categoryIndex,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    subComponents: category.subComponents.map((sub, habitIndex) =>
      createSubComponent(sub, category.id, habitIndex, timestamp),
    ),
  }));
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
  displayOrder,
  isArchived: false,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const seedIfNeeded = (): void => {
  const version = getItem<string | null>('version', null);
  if (!version) {
    const categories = createSeedCategories();
    setItem('categories', categories);
    setItem('version', APP_SCHEMA_VERSION);
    addAuditEntry(
      'data_imported',
      'system',
      'system',
      null,
      null,
      'Initial seed data'
    );
  }
};
