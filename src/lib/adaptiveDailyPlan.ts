import type {
  Category,
  DailyEnergyLevel,
  DailyEntry,
  DailyPlanMode,
  DailyPlanReason,
  DailySadhanaPlan,
  DailySadhanaPlanItem,
  DateKey,
  Habit,
  TrackingType,
} from '../types';
import { isCompleted } from './scoring';

export const ADAPTIVE_PLAN_ENGINE_VERSION = '1.0';

export interface AdaptivePlanInput {
  date: DateKey;
  mode: DailyPlanMode;
  availableMinutes: number;
  energyLevel: DailyEnergyLevel;
  focusCategoryIds: string[];
  intention?: string;
  categories: Category[];
  dailyEntries: Record<DateKey, DailyEntry>;
  currentCompletions: DailyEntry['completions'];
  excludedHabitIds?: string[];
  timestamp?: string;
}

interface RankedPractice {
  category: Category;
  habit: Habit;
  estimatedMinutes: number;
  score: number;
  reasons: DailyPlanReason[];
}

export interface ResolvedDailyPlanItem {
  item: DailySadhanaPlanItem;
  category: Category;
  habit: Habit;
}

const MODE_LIMITS: Record<DailyPlanMode, number> = {
  minimum: 1,
  balanced: 3,
  full: Number.POSITIVE_INFINITY,
};

const ESTIMATED_MINUTES: Record<TrackingType, number> = {
  boolean: 3,
  scale5: 2,
  scale10: 2,
  duration: 10,
  count: 5,
  numeric: 3,
  text: 8,
};

export function generateAdaptiveDailyPlan(input: AdaptivePlanInput): DailySadhanaPlan {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const availableMinutes = clamp(Math.round(input.availableMinutes), 1, 180);
  const focusCategoryIds = [...new Set(input.focusCategoryIds)].slice(0, 2);
  const excludedHabitIds = [...new Set(input.excludedHabitIds ?? [])];
  const excluded = new Set(excludedHabitIds);

  const ranked = input.categories
    .filter((category) => !category.isArchived)
    .flatMap((category) =>
      category.subComponents
        .filter((habit) =>
          !habit.isArchived
          && !excluded.has(habit.id)
          && !isCompleted(input.currentCompletions[habit.id], habit.trackingType),
        )
        .map((habit) => rankPractice(category, habit, input, focusCategoryIds)),
    )
    .sort(compareRankedPractices);

  const items = selectWithinBudget(ranked, input.mode, availableMinutes);

  return {
    date: input.date,
    mode: input.mode,
    status: 'suggested',
    availableMinutes,
    energyLevel: input.energyLevel,
    focusCategoryIds,
    intention: normalizeIntention(input.intention),
    items,
    excludedHabitIds,
    engineVersion: ADAPTIVE_PLAN_ENGINE_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function shortenDailyPlanItem(
  plan: DailySadhanaPlan,
  habitId: string,
  timestamp = new Date().toISOString(),
): DailySadhanaPlan {
  return {
    ...plan,
    status: 'suggested',
    items: plan.items.map((item) =>
      item.habitId === habitId
        ? { ...item, plannedMinutes: Math.max(1, Math.ceil(item.plannedMinutes / 2)) }
        : item,
    ),
    updatedAt: timestamp,
  };
}

export function replaceDailyPlanItem(
  plan: DailySadhanaPlan,
  habitId: string,
  input: Omit<AdaptivePlanInput, 'excludedHabitIds' | 'timestamp'>,
  timestamp = new Date().toISOString(),
): DailySadhanaPlan {
  const targetIndex = plan.items.findIndex((item) => item.habitId === habitId);
  if (targetIndex < 0) return plan;

  const retainedIds = plan.items
    .filter((item) => item.habitId !== habitId)
    .map((item) => item.habitId);
  const excludedHabitIds = [...new Set([
    ...plan.excludedHabitIds,
    ...retainedIds,
    habitId,
  ])];
  const replacementPlan = generateAdaptiveDailyPlan({
    ...input,
    mode: 'minimum',
    excludedHabitIds,
    timestamp,
  });
  const replacement = replacementPlan.items[0];
  const nextItems = [...plan.items];

  if (replacement) {
    nextItems[targetIndex] = replacement;
  } else {
    nextItems.splice(targetIndex, 1);
  }

  return {
    ...plan,
    status: 'suggested',
    items: nextItems.map((item, index) => ({ ...item, rank: index + 1 })),
    excludedHabitIds: [...new Set([...plan.excludedHabitIds, habitId])],
    updatedAt: timestamp,
  };
}

export function confirmDailySadhanaPlan(
  plan: DailySadhanaPlan,
  timestamp = new Date().toISOString(),
): DailySadhanaPlan {
  return {
    ...plan,
    status: 'confirmed',
    updatedAt: timestamp,
  };
}

export function getPlanReasonText(
  item: DailySadhanaPlanItem,
  categoryName: string,
): string {
  if (item.reasons.includes('focus_area')) {
    return `${categoryName} is one of your chosen focus areas today.`;
  }
  if (item.reasons.includes('gentle_energy')) {
    return 'This is a lighter practice for the energy you reported.';
  }
  if (item.reasons.includes('growth_edge')) {
    return 'Your recent records suggest this practice could use gentle attention.';
  }
  if (item.reasons.includes('recent_rhythm')) {
    return 'This continues a rhythm you recorded recently.';
  }
  if (item.reasons.includes('time_fit')) {
    return 'This practice fits the time you set aside.';
  }
  return 'This keeps today grounded in your existing practice order.';
}

export function resolveDailyPlanItems(
  plan: DailySadhanaPlan,
  categories: Category[],
  completions: DailyEntry['completions'],
): ResolvedDailyPlanItem[] {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return plan.items.flatMap((item) => {
    const category = categoriesById.get(item.categoryId);
    const habit = category?.subComponents.find((candidate) => candidate.id === item.habitId);
    if (!category || !habit || category.isArchived || habit.isArchived) return [];
    if (isCompleted(completions[habit.id], habit.trackingType)) return [];
    return [{ item, category, habit }];
  });
}

function rankPractice(
  category: Category,
  habit: Habit,
  input: AdaptivePlanInput,
  focusCategoryIds: string[],
): RankedPractice {
  const estimatedMinutes = ESTIMATED_MINUTES[habit.trackingType];
  const recent = getRecentRecordedHistory(
    habit,
    input.date,
    input.dailyEntries,
  );
  const reasons: DailyPlanReason[] = [];
  let score = 100 - (category.displayOrder * 2) - (habit.displayOrder * 0.1);

  if (focusCategoryIds.includes(category.id)) {
    score += 50;
    reasons.push('focus_area');
  }

  if (recent.observed >= 2 && recent.completionRate < 0.5) {
    score += 25;
    reasons.push('growth_edge');
  }

  if (recent.completedYesterday) {
    score += 10;
    reasons.push('recent_rhythm');
  }

  if (input.energyLevel <= 2) {
    if (estimatedMinutes <= 5) {
      score += 15;
      reasons.push('gentle_energy');
    } else {
      score -= 15;
    }
  } else if (input.energyLevel >= 4 && estimatedMinutes >= 8) {
    score += 10;
  }

  if (estimatedMinutes <= input.availableMinutes) {
    score += 5;
    reasons.push('time_fit');
  }

  if (reasons.length === 0) {
    reasons.push('steady_foundation');
  }

  return { category, habit, estimatedMinutes, score, reasons };
}

function getRecentRecordedHistory(
  habit: Habit,
  date: DateKey,
  entries: Record<DateKey, DailyEntry>,
): { observed: number; completionRate: number; completedYesterday: boolean } {
  let observed = 0;
  let completed = 0;
  let completedYesterday = false;

  for (let offset = 1; offset <= 7; offset += 1) {
    const key = shiftDateKey(date, -offset);
    const value = entries[key]?.completions[habit.id];
    if (value === undefined) continue;

    observed += 1;
    const didComplete = isCompleted(value, habit.trackingType);
    if (didComplete) completed += 1;
    if (offset === 1 && didComplete) completedYesterday = true;
  }

  return {
    observed,
    completionRate: observed === 0 ? 0 : completed / observed,
    completedYesterday,
  };
}

function selectWithinBudget(
  ranked: RankedPractice[],
  mode: DailyPlanMode,
  availableMinutes: number,
): DailySadhanaPlanItem[] {
  const selected: DailySadhanaPlanItem[] = [];
  let remainingMinutes = availableMinutes;

  for (const practice of ranked) {
    if (selected.length >= MODE_LIMITS[mode] || remainingMinutes <= 0) break;

    const plannedMinutes = Math.max(1, Math.min(practice.estimatedMinutes, remainingMinutes));
    selected.push({
      habitId: practice.habit.id,
      categoryId: practice.category.id,
      rank: selected.length + 1,
      plannedMinutes,
      recommendationScore: Number(practice.score.toFixed(2)),
      reasons: practice.reasons,
    });
    remainingMinutes -= plannedMinutes;
  }

  return selected;
}

function compareRankedPractices(a: RankedPractice, b: RankedPractice): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.category.displayOrder !== b.category.displayOrder) {
    return a.category.displayOrder - b.category.displayOrder;
  }
  if (a.habit.displayOrder !== b.habit.displayOrder) {
    return a.habit.displayOrder - b.habit.displayOrder;
  }
  return a.habit.id.localeCompare(b.habit.id);
}

function shiftDateKey(date: DateKey, days: number): DateKey {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function normalizeIntention(intention: string | undefined): string | undefined {
  const normalized = intention?.trim().slice(0, 80);
  return normalized || undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
