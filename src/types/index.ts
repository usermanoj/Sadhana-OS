/**
 * Sadhana OS — Data Model Type Definitions
 * Source of truth: docs/04-data-model.md
 */

// ---------------------------------------------------------------------------
// Category & Habit/SubComponent
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;               // UUID v4
  categoryId: string;       // FK → Category.id
  name: string;             // e.g., "Yama"
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
  completions: Record<string, boolean>;   // subComponentId → done
  categoryScores: Record<string, number>; // categoryId → 0–100
  overallScore: number;                   // 0–100
  updatedAt: string;                      // ISO 8601
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export interface JournalEntry {
  date: DateKey;
  content: string;          // Free-text (plain or markdown)
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'subcomponent_created'
  | 'subcomponent_updated'
  | 'subcomponent_archived'
  | 'subcomponent_restored'
  | 'data_imported'
  | 'data_exported';

export interface AuditLogEntry {
  id: string;               // UUID v4
  timestamp: string;        // ISO 8601
  action: AuditAction;
  entityType: 'category' | 'subComponent' | 'system';
  entityId: string;         // ID of affected entity (or "system")
  before: unknown | null;   // Snapshot before change
  after: unknown | null;    // Snapshot after change
  description: string;      // Human-readable summary
}

export type AuditLog = AuditLogEntry[];


// Export / Import
// ---------------------------------------------------------------------------

export interface ExportPayload {
  version: string;
  exportedAt: string;       // ISO 8601
  categories: Category[];
  entries: Record<DateKey, DailyEntry>;
  journal: Record<DateKey, JournalEntry>;
  audit: AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type TabId = 'today' | 'dashboard' | 'journal' | 'history' | 'settings';
