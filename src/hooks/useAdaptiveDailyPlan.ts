import { useCallback, useMemo, useState } from 'react';
import type {
  Category,
  DailyEnergyLevel,
  DailyEntry,
  DailyPlanMode,
  DailySadhanaPlan,
  DateKey,
} from '../types';
import {
  confirmDailySadhanaPlan,
  generateAdaptiveDailyPlan,
  replaceDailyPlanItem,
  shortenDailyPlanItem,
} from '../lib/adaptiveDailyPlan';
import { recordAuditEntry } from '../lib/auditService';
import { appRepository } from '../lib/repository';

export interface DailyPlanContext {
  mode: DailyPlanMode;
  availableMinutes: number;
  energyLevel: DailyEnergyLevel;
  focusCategoryIds: string[];
  intention?: string;
}

interface UseAdaptiveDailyPlanInput {
  date: DateKey;
  categories: Category[];
  entries: Record<DateKey, DailyEntry>;
  currentCompletions: DailyEntry['completions'];
}

const DEFAULT_CONTEXT: DailyPlanContext = {
  mode: 'balanced',
  availableMinutes: 15,
  energyLevel: 3,
  focusCategoryIds: [],
};

export function useAdaptiveDailyPlan({
  date,
  categories,
  entries,
  currentCompletions,
}: UseAdaptiveDailyPlanInput) {
  const [savedPlans, setSavedPlans] = useState<Record<DateKey, DailySadhanaPlan>>(
    () => appRepository.getDailyPlans(),
  );
  const savedPlan = savedPlans[date];

  const plan = useMemo(() => {
    if (savedPlan) return savedPlan;

    return generateAdaptiveDailyPlan({
      date,
      ...DEFAULT_CONTEXT,
      categories,
      dailyEntries: entries,
      currentCompletions,
    });
  }, [categories, currentCompletions, date, entries, savedPlan]);

  const persist = useCallback((
    nextPlan: DailySadhanaPlan,
    actionType: 'daily_plan_generated' | 'daily_plan_adjusted' | 'daily_plan_confirmed',
    previousPlan: DailySadhanaPlan | undefined,
    note: string,
  ) => {
    const nextPlans = { ...savedPlans, [date]: nextPlan };
    appRepository.setDailyPlans(nextPlans);
    setSavedPlans(nextPlans);
    recordAuditEntry({
      actionType,
      entityType: 'daily_plan',
      entityId: date,
      oldValue: previousPlan ?? null,
      newValue: nextPlan,
      note,
    });
  }, [date, savedPlans]);

  const generate = useCallback((context: DailyPlanContext) => {
    const generated = generateAdaptiveDailyPlan({
      date,
      ...context,
      categories,
      dailyEntries: entries,
      currentCompletions,
      excludedHabitIds: savedPlan?.excludedHabitIds,
    });
    const nextPlan = savedPlan
      ? { ...generated, createdAt: savedPlan.createdAt }
      : generated;

    persist(
      nextPlan,
      savedPlan ? 'daily_plan_adjusted' : 'daily_plan_generated',
      savedPlan,
      savedPlan ? 'Adjusted adaptive daily plan' : 'Generated adaptive daily plan',
    );
  }, [categories, currentCompletions, date, entries, persist, savedPlan]);

  const setMode = useCallback((mode: DailyPlanMode) => {
    generate({
      mode,
      availableMinutes: plan.availableMinutes,
      energyLevel: plan.energyLevel,
      focusCategoryIds: plan.focusCategoryIds,
      intention: plan.intention,
    });
  }, [generate, plan]);

  const shorten = useCallback((habitId: string) => {
    const nextPlan = shortenDailyPlanItem(plan, habitId);
    persist(nextPlan, 'daily_plan_adjusted', savedPlan, 'Shortened a daily plan recommendation');
  }, [persist, plan, savedPlan]);

  const replace = useCallback((habitId: string) => {
    const nextPlan = replaceDailyPlanItem(plan, habitId, {
      date,
      mode: plan.mode,
      availableMinutes: plan.availableMinutes,
      energyLevel: plan.energyLevel,
      focusCategoryIds: plan.focusCategoryIds,
      intention: plan.intention,
      categories,
      dailyEntries: entries,
      currentCompletions,
    });
    persist(nextPlan, 'daily_plan_adjusted', savedPlan, 'Replaced a daily plan recommendation');
  }, [categories, currentCompletions, date, entries, persist, plan, savedPlan]);

  const confirm = useCallback(() => {
    if (plan.status === 'confirmed') return;
    const nextPlan = confirmDailySadhanaPlan(plan);
    persist(nextPlan, 'daily_plan_confirmed', savedPlan, 'Confirmed adaptive daily plan');
  }, [persist, plan, savedPlan]);

  return {
    plan,
    isSaved: Boolean(savedPlan),
    generate,
    setMode,
    shorten,
    replace,
    confirm,
  };
}
