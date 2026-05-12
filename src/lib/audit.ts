
import type { AuditAction, AuditLogEntry } from '../types';
import { getItem, setItem } from './storage';

export function addAuditEntry(
  action: AuditAction,
  entityType: 'category' | 'subComponent' | 'system',
  entityId: string,
  before: unknown | null,
  after: unknown | null,
  description: string,
): void {
  const newEntry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    before,
    after,
    description,
  };

  const auditLog = getItem<AuditLogEntry[]>('audit', []);
  auditLog.push(newEntry);
  setItem('audit', auditLog);
}
