import { useCallback, useMemo, useState } from 'react';
import type { Category, SubComponent, TrackingType } from '../types';
import { recordAuditEntry } from '../lib/auditService';
import { appRepository } from '../lib/repository';

const DEFAULT_CATEGORY_ICON = 'sparkles';
const DEFAULT_CATEGORY_COLOR = '#7C3AED';
const DEFAULT_TRACKING_TYPE: TrackingType = 'boolean';

export interface CategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface SubComponentInput {
  name: string;
  trackingType?: TrackingType;
}

const sortByDisplayOrder = <T extends { displayOrder: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.displayOrder - b.displayOrder);

const loadCategories = (): Category[] => appRepository.getCategories();

const saveCategories = (categories: Category[]): void => {
  appRepository.setCategories(categories);
};

const requireName = (name: string, entity: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error(`${entity} name is required`);
  }
  return trimmed;
};

const nextDisplayOrder = <T extends { displayOrder: number }>(items: T[]): number =>
  items.length === 0 ? 0 : Math.max(...items.map((item) => item.displayOrder)) + 1;

const createCategory = (data: CategoryInput, displayOrder: number): Category => {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: requireName(data.name, 'Category'),
    icon: data.icon ?? DEFAULT_CATEGORY_ICON,
    color: data.color ?? DEFAULT_CATEGORY_COLOR,
    displayOrder,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    subComponents: [],
  };
};

const createSubComponent = (
  categoryId: string,
  data: SubComponentInput,
  displayOrder: number,
): SubComponent => {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    categoryId,
    name: requireName(data.name, 'Practice'),
    trackingType: data.trackingType ?? DEFAULT_TRACKING_TYPE,
    displayOrder,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());

  const persist = useCallback((nextCategories: Category[]) => {
    saveCategories(nextCategories);
    setCategories(nextCategories);
  }, []);

  const orderedCategories = useMemo(
    () => sortByDisplayOrder(categories),
    [categories],
  );

  const activeCategories = useMemo(
    () => orderedCategories.filter((category) => !category.isArchived),
    [orderedCategories],
  );

  const archivedCategories = useMemo(
    () => orderedCategories.filter((category) => category.isArchived),
    [orderedCategories],
  );

  const addCategory = useCallback(
    (data: CategoryInput): Category => {
      const category = createCategory(data, nextDisplayOrder(categories));
      const nextCategories = [...categories, category];

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'category_created',
        entityType: 'category',
        entityId: category.id,
        oldValue: null,
        newValue: category,
        note: `Created category "${category.name}"`,
      });

      return category;
    },
    [categories, persist],
  );

  const updateCategory = useCallback(
    (categoryId: string, data: CategoryInput): Category | null => {
      const before = categories.find((category) => category.id === categoryId);
      if (!before) return null;

      const after: Category = {
        ...before,
        name: requireName(data.name, 'Category'),
        icon: data.icon ?? before.icon,
        color: data.color ?? before.color,
        updatedAt: new Date().toISOString(),
      };

      const nextCategories = categories.map((category) =>
        category.id === categoryId ? after : category,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'category_updated',
        entityType: 'category',
        entityId: categoryId,
        oldValue: before,
        newValue: after,
        note: `Updated category "${before.name}"`,
      });

      return after;
    },
    [categories, persist],
  );

  const archiveCategory = useCallback(
    (categoryId: string): Category | null => {
      const before = categories.find((category) => category.id === categoryId);
      if (!before || before.isArchived) return before ?? null;

      const after: Category = {
        ...before,
        isArchived: true,
        updatedAt: new Date().toISOString(),
      };

      const nextCategories = categories.map((category) =>
        category.id === categoryId ? after : category,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'category_archived',
        entityType: 'category',
        entityId: categoryId,
        oldValue: before,
        newValue: after,
        note: `Archived category "${before.name}"`,
      });

      return after;
    },
    [categories, persist],
  );

  const restoreCategory = useCallback(
    (categoryId: string): Category | null => {
      const before = categories.find((category) => category.id === categoryId);
      if (!before || !before.isArchived) return before ?? null;

      const after: Category = {
        ...before,
        isArchived: false,
        updatedAt: new Date().toISOString(),
      };

      const nextCategories = categories.map((category) =>
        category.id === categoryId ? after : category,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'category_restored',
        entityType: 'category',
        entityId: categoryId,
        oldValue: before,
        newValue: after,
        note: `Restored category "${before.name}"`,
      });

      return after;
    },
    [categories, persist],
  );

  const addSubComponent = useCallback(
    (categoryId: string, data: SubComponentInput): SubComponent | null => {
      const categoryIndex = categories.findIndex((category) => category.id === categoryId);
      const category = categories[categoryIndex];
      if (!category) return null;

      const timestamp = new Date().toISOString();
      const created = createSubComponent(
        categoryId,
        data,
        nextDisplayOrder(category.subComponents),
      );
      const updatedCategory: Category = {
        ...category,
        updatedAt: timestamp,
        subComponents: [...category.subComponents, created],
      };
      const nextCategories = categories.map((item, index) =>
        index === categoryIndex ? updatedCategory : item,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'habit_created',
        entityType: 'habit',
        entityId: created.id,
        oldValue: null,
        newValue: created,
        note: `Created habit "${created.name}"`,
      });

      return created;
    },
    [categories, persist],
  );

  const updateSubComponent = useCallback(
    (
      categoryId: string,
      subComponentId: string,
      data: SubComponentInput,
    ): SubComponent | null => {
      const categoryIndex = categories.findIndex((category) => category.id === categoryId);
      const category = categories[categoryIndex];
      if (!category) return null;

      const subComponentIndex = category.subComponents.findIndex((sub) => sub.id === subComponentId);
      const before = category.subComponents[subComponentIndex];
      if (!before) return null;

      const timestamp = new Date().toISOString();
      const after: SubComponent = {
        ...before,
        name: requireName(data.name, 'Practice'),
        trackingType: data.trackingType ?? before.trackingType,
        updatedAt: timestamp,
      };
      const updatedCategory: Category = {
        ...category,
        updatedAt: timestamp,
        subComponents: category.subComponents.map((subComponent, index) =>
          index === subComponentIndex ? after : subComponent,
        ),
      };
      const nextCategories = categories.map((item, index) =>
        index === categoryIndex ? updatedCategory : item,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'habit_updated',
        entityType: 'habit',
        entityId: subComponentId,
        oldValue: before,
        newValue: after,
        note: `Updated habit "${before.name}"`,
      });

      if (before.trackingType !== after.trackingType) {
        recordAuditEntry({
          actionType: 'tracking_type_changed',
          entityType: 'habit',
          entityId: subComponentId,
          oldValue: before.trackingType,
          newValue: after.trackingType,
          note: `Changed tracking type for "${after.name}"`,
        });
      }

      return after;
    },
    [categories, persist],
  );

  const archiveSubComponent = useCallback(
    (categoryId: string, subComponentId: string): SubComponent | null => {
      const categoryIndex = categories.findIndex((category) => category.id === categoryId);
      const category = categories[categoryIndex];
      if (!category) return null;

      const subComponentIndex = category.subComponents.findIndex((sub) => sub.id === subComponentId);
      const before = category.subComponents[subComponentIndex];
      if (!before) return null;
      if (before.isArchived) return before;

      const timestamp = new Date().toISOString();
      const after: SubComponent = {
        ...before,
        isArchived: true,
        updatedAt: timestamp,
      };
      const updatedCategory: Category = {
        ...category,
        updatedAt: timestamp,
        subComponents: category.subComponents.map((subComponent, index) =>
          index === subComponentIndex ? after : subComponent,
        ),
      };
      const nextCategories = categories.map((item, index) =>
        index === categoryIndex ? updatedCategory : item,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'habit_archived',
        entityType: 'habit',
        entityId: subComponentId,
        oldValue: before,
        newValue: after,
        note: `Archived habit "${before.name}"`,
      });

      return after;
    },
    [categories, persist],
  );

  const restoreSubComponent = useCallback(
    (categoryId: string, subComponentId: string): SubComponent | null => {
      const categoryIndex = categories.findIndex((category) => category.id === categoryId);
      const category = categories[categoryIndex];
      if (!category) return null;

      const subComponentIndex = category.subComponents.findIndex((sub) => sub.id === subComponentId);
      const before = category.subComponents[subComponentIndex];
      if (!before) return null;
      if (!before.isArchived) return before;

      const timestamp = new Date().toISOString();
      const after: SubComponent = {
        ...before,
        isArchived: false,
        updatedAt: timestamp,
      };
      const updatedCategory: Category = {
        ...category,
        updatedAt: timestamp,
        subComponents: category.subComponents.map((subComponent, index) =>
          index === subComponentIndex ? after : subComponent,
        ),
      };
      const nextCategories = categories.map((item, index) =>
        index === categoryIndex ? updatedCategory : item,
      );

      persist(nextCategories);
      recordAuditEntry({
        actionType: 'habit_restored',
        entityType: 'habit',
        entityId: subComponentId,
        oldValue: before,
        newValue: after,
        note: `Restored habit "${before.name}"`,
      });

      return after;
    },
    [categories, persist],
  );

  const reorderCategories = useCallback(
    (orderedIds: string[]): void => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      const changed: { before: Category; after: Category }[] = [];
      const nextCategories = categories.map((category) => {
        const nextOrder = orderMap.get(category.id);
        if (nextOrder === undefined || nextOrder === category.displayOrder) {
          return category;
        }

        const after = {
          ...category,
          displayOrder: nextOrder,
          updatedAt: new Date().toISOString(),
        };
        changed.push({ before: category, after });
        return after;
      });

      if (changed.length === 0) return;

      persist(nextCategories);
      changed.forEach(({ before, after }) => {
        recordAuditEntry({
          actionType: 'category_updated',
          entityType: 'category',
          entityId: after.id,
          oldValue: before,
          newValue: after,
          note: `Reordered category "${after.name}"`,
        });
      });
    },
    [categories, persist],
  );

  const reorderSubComponents = useCallback(
    (categoryId: string, orderedIds: string[]): void => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      const timestamp = new Date().toISOString();
      const changed: { before: SubComponent; after: SubComponent }[] = [];
      const nextCategories = categories.map((category) => {
        if (category.id !== categoryId) return category;

        return {
          ...category,
          updatedAt: timestamp,
          subComponents: category.subComponents.map((subComponent) => {
            const nextOrder = orderMap.get(subComponent.id);
            if (nextOrder === undefined || nextOrder === subComponent.displayOrder) {
              return subComponent;
            }

            const after = { ...subComponent, displayOrder: nextOrder, updatedAt: timestamp };
            changed.push({ before: subComponent, after });
            return after;
          }),
        };
      });

      if (changed.length === 0) return;

      persist(nextCategories);
      changed.forEach(({ before, after }) => {
        recordAuditEntry({
          actionType: 'habit_updated',
          entityType: 'habit',
          entityId: after.id,
          oldValue: before,
          newValue: after,
          note: `Reordered habit "${after.name}"`,
        });
      });
    },
    [categories, persist],
  );

  return {
    categories: orderedCategories,
    activeCategories,
    archivedCategories,
    addCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
    addSubComponent,
    updateSubComponent,
    archiveSubComponent,
    restoreSubComponent,
    reorderCategories,
    reorderSubComponents,
  };
}
