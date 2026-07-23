/**
 * Sadhana OS — Data Model Type Definitions
 * Source of truth: docs/04-data-model.md
 */

// ---------------------------------------------------------------------------
// Tracking Types
// ---------------------------------------------------------------------------

/** The kind of input widget rendered for a habit */
export type TrackingType =
  | 'boolean'   // yes/no toggle
  | 'scale5'    // 1–5 rating
  | 'scale10'   // 0–10 rating
  | 'duration'  // minutes (numeric)
  | 'count'     // repetitions / quantity
  | 'numeric'   // generic number (e.g., hours of sleep)
  | 'text';     // free-text reflection

/** The runtime value stored for a single habit entry */
export type TrackingValue = boolean | number | string;

// ---------------------------------------------------------------------------
// Category & Habit/SubComponent
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;               // UUID v4
  categoryId: string;       // FK → Category.id
  name: string;             // e.g., "Yama"
  trackingType: TrackingType; // determines input widget & completion check
  displayOrder: number;
  isArchived: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

export type SubComponent = Habit;

export interface Category {
  id: string;               // UUID v4
  name: string;             // e.g., "8 Limbs of Yoga"
  icon: string;             // Lucide icon name, e.g., "lotus"
  color: string;            // Hex, e.g., "#7C3AED"
  displayOrder: number;     // Sort position (0-based)
  isArchived: boolean;      // true = hidden from tracker
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  subComponents: Habit[];
}

// ---------------------------------------------------------------------------
// Daily Entry
// ---------------------------------------------------------------------------

/** Date formatted as "YYYY-MM-DD" */
export type DateKey = string;

export interface DailyEntry {
  date: DateKey;
  completions: Record<string, TrackingValue>; // subComponentId -> value
  categoryScores: Record<string, number>;     // categoryId -> 0-100
  overallScore: number;                       // 0-100
  updatedAt: string;                          // ISO 8601
}

// ---------------------------------------------------------------------------
// Adaptive Daily Sadhana Plan
// ---------------------------------------------------------------------------

export type DailyPlanMode = 'minimum' | 'balanced' | 'full';
export type DailyPlanStatus = 'suggested' | 'confirmed';
export type DailyEnergyLevel = 1 | 2 | 3 | 4 | 5;

export type DailyPlanReason =
  | 'focus_area'
  | 'gentle_energy'
  | 'growth_edge'
  | 'recent_rhythm'
  | 'time_fit'
  | 'steady_foundation';

export interface DailySadhanaPlanItem {
  habitId: string;
  categoryId: string;
  rank: number;
  plannedMinutes: number;
  recommendationScore: number;
  reasons: DailyPlanReason[];
}

export interface DailySadhanaPlan {
  date: DateKey;
  mode: DailyPlanMode;
  status: DailyPlanStatus;
  availableMinutes: number;
  energyLevel: DailyEnergyLevel;
  focusCategoryIds: string[];
  intention?: string;
  items: DailySadhanaPlanItem[];
  excludedHabitIds: string[];
  engineVersion: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export interface JournalEntry {
  date: DateKey;
  mood?: string;
  gratitude?: string;
  spiritualInsight?: string;
  triggerObserved?: string;
  lessonLearned?: string;
  content: string;          // Free-text (plain or markdown)
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export type AuditActionType =
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'habit_created'
  | 'habit_updated'
  | 'habit_archived'
  | 'habit_restored'
  | 'tracking_type_changed'
  | 'smart_goal_changed'
  | 'target_value_changed'
  | 'frequency_changed'
  | 'weight_changed'
  | 'data_imported'
  | 'data_exported'
  | 'daily_plan_generated'
  | 'daily_plan_adjusted'
  | 'daily_plan_confirmed';

export type AuditAction = AuditActionType;

export type AuditEntityType = 'category' | 'habit' | 'daily_plan' | 'system';

export interface AuditLogEntry {
  id: string;               // UUID v4
  timestamp: string;        // ISO 8601
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;         // ID of affected entity (or "system")
  oldValue: unknown | null; // Snapshot/value before change
  newValue: unknown | null; // Snapshot/value after change
  note?: string;            // Optional human-readable context
}

export type AuditLog = AuditLogEntry[];

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export interface AppSettings {
  schemaVersion: string;
}

export interface ExportPayload {
  version: string;
  exportedAt: string;       // ISO 8601
  categories: Category[];
  habits: Habit[];
  dailyEntries: Record<DateKey, DailyEntry>;
  journalEntries: Record<DateKey, JournalEntry>;
  auditLogs: AuditLogEntry[];
  dailyPlans?: Record<DateKey, DailySadhanaPlan>;
  settings: AppSettings;
  // Legacy aliases kept for compatibility with earlier docs/tasks.
  entries: Record<DateKey, DailyEntry>;
  journal: Record<DateKey, JournalEntry>;
  audit: AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type TabId = 'today' | 'dashboard' | 'journal' | 'history' | 'settings';
