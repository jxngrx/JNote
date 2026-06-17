import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  assignColumnProgress,
  buildReorderIds,
  isDoneColumnId,
  isLockedColumn,
  normalizeColumns,
  sortColumns,
  type ColumnRole,
} from '@/lib/todo-column-utils';

export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  progressPercent: number;
  role: ColumnRole;
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  columnId: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  titleMode?: 'auto' | 'custom';
  columns: KanbanColumn[];
  items: TodoItem[];
  trash: TodoItem[];
  createdAt: number;
  updatedAt: number;
}

export interface TodoState {
  lists: TodoList[];
  activeListId: string | null;
}

export interface TodoStore extends TodoState {
  createList: () => string;
  duplicateList: (id: string) => string | null;
  updateList: (id: string, updates: Partial<Pick<TodoList, 'title' | 'titleMode'>>) => void;
  deleteList: (id: string) => void;
  reorderLists: (orderedIds: string[]) => void;
  setActiveList: (id: string | null) => void;

  createItem: (title: string, columnId?: string) => string | null;
  createDraftItem: (columnId?: string) => string | null;
  updateItem: (id: string, updates: Partial<TodoItem>) => void;
  deleteItem: (id: string) => void;
  discardItem: (id: string) => void;
  restoreItem: (id: string) => void;
  purgeTrashItem: (id: string) => void;
  emptyTrash: () => void;
  toggleItem: (id: string) => void;
  moveItem: (itemId: string, toColumnId: string, toIndex: number) => void;

  addColumn: (title: string) => string | null;
  updateColumn: (
    columnId: string,
    updates: Partial<Pick<KanbanColumn, 'title' | 'order' | 'progressPercent' | 'role'>>
  ) => void;
  deleteColumn: (columnId: string) => void;
  reorderMiddleColumns: (orderedMiddleIds: string[]) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
  importJSON: (json: string) => void;
}

const STORAGE_KEY = 'todo-storage';
const STORE_VERSION = 8;

export const DONE_COLUMN_ID = 'col_done';
export const TODO_COLUMN_ID = 'col_todo';
export const PROGRESS_COLUMN_ID = 'col_progress';

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const computeAutoTitle = (text: string, maxLen = 24) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  return normalized.slice(0, maxLen).trim() || 'Untitled';
};

export const createDefaultColumns = (): KanbanColumn[] =>
  normalizeColumns([
    {
      id: TODO_COLUMN_ID,
      title: 'To Do',
      order: 0,
      progressPercent: 0,
      role: 'start',
    },
    {
      id: PROGRESS_COLUMN_ID,
      title: 'In Progress',
      order: 1,
      progressPercent: 50,
      role: null,
    },
    {
      id: DONE_COLUMN_ID,
      title: 'Done',
      order: 2,
      progressPercent: 100,
      role: 'done',
    },
  ]);

const isDoneColumn = (columnId: string, columns: KanbanColumn[]) =>
  isDoneColumnId(columnId, columns);

const normalizeItemOrders = (items: TodoItem[], columnId: string) => {
  const columnItems = items
    .filter((item) => item.columnId === columnId)
    .sort((a, b) => a.order - b.order);

  const orderMap = new Map(columnItems.map((item, index) => [item.id, index]));

  return items.map((item) =>
    item.columnId === columnId
      ? { ...item, order: orderMap.get(item.id) ?? item.order }
      : item
  );
};

const syncListAfterItemChange = (list: TodoList, items: TodoItem[]): TodoList => {
  const titleMode = list.titleMode ?? 'auto';
  return {
    ...list,
    title: titleMode === 'custom' ? list.title : computeAutoTitle(items[0]?.title || ''),
    titleMode,
    items,
    updatedAt: Date.now(),
  };
};

type LegacyTodoTask = {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  createdAt: number;
  updatedAt: number;
};

type LegacyPersist = {
  state?: {
    tasks?: LegacyTodoTask[];
  };
};

type V2TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

type V2TodoList = {
  id: string;
  title: string;
  titleMode?: 'auto' | 'custom';
  items: V2TodoItem[];
  createdAt: number;
  updatedAt: number;
};

type V2Persist = {
  lists?: V2TodoList[];
  activeListId?: string | null;
};

const migrateItemsToKanban = (items: V2TodoItem[]): TodoItem[] =>
  items.map((item, index) => ({
    ...item,
    columnId: item.completed ? DONE_COLUMN_ID : TODO_COLUMN_ID,
    order: index,
  }));

const migrateListToKanban = (list: V2TodoList): TodoList => ({
  ...list,
  columns: createDefaultColumns(),
  items: migrateItemsToKanban(list.items),
  trash: [],
});

export function normalizeTodoList(list: TodoList): TodoList {
  const columns =
    list.columns?.length > 0
      ? normalizeColumns(list.columns)
      : createDefaultColumns();

  const startColumnId =
    columns.find((col) => col.role === 'start')?.id ?? TODO_COLUMN_ID;
  const doneColumnId =
    columns.find((col) => col.role === 'done')?.id ?? DONE_COLUMN_ID;

  const items = (list.items ?? []).map((item, index) => ({
    ...item,
    columnId:
      item.columnId && columns.some((col) => col.id === item.columnId)
        ? item.columnId
        : item.completed
          ? doneColumnId
          : startColumnId,
    order: typeof item.order === 'number' ? item.order : index,
    completed: isDoneColumn(
      item.columnId && columns.some((col) => col.id === item.columnId)
        ? item.columnId
        : item.completed
          ? doneColumnId
          : startColumnId,
      columns
    ),
  }));

  return {
    ...list,
    columns,
    items,
    trash: list.trash ?? [],
  };
}

export function parseImportedTodoState(payload: unknown): TodoState {
  const parsed =
    payload && typeof payload === 'object'
      ? (payload as { lists?: unknown; activeListId?: unknown })
      : {};

  const rawLists = Array.isArray(parsed.lists) ? parsed.lists : [];

  const lists = rawLists.map((rawList) => {
    const list = rawList as Partial<TodoList> & V2TodoList;
    const items = Array.isArray(list.items) ? list.items : [];
    const hasColumns =
      Array.isArray(list.columns) && list.columns.length > 0;

    if (!hasColumns) {
      return normalizeTodoList(
        migrateListToKanban({
          id: typeof list.id === 'string' ? list.id : generateId('todoList'),
          title: typeof list.title === 'string' ? list.title : 'Untitled',
          titleMode: list.titleMode,
          items: items as V2TodoItem[],
          createdAt: typeof list.createdAt === 'number' ? list.createdAt : Date.now(),
          updatedAt: typeof list.updatedAt === 'number' ? list.updatedAt : Date.now(),
        })
      );
    }

    return normalizeTodoList({
      id: typeof list.id === 'string' ? list.id : generateId('todoList'),
      title: typeof list.title === 'string' ? list.title : 'Untitled',
      titleMode: list.titleMode,
      columns: list.columns as KanbanColumn[],
      items: items as TodoItem[],
      trash: Array.isArray(list.trash) ? (list.trash as TodoItem[]) : [],
      createdAt: typeof list.createdAt === 'number' ? list.createdAt : Date.now(),
      updatedAt: typeof list.updatedAt === 'number' ? list.updatedAt : Date.now(),
    });
  });

  const activeListId =
    typeof parsed.activeListId === 'string' &&
    lists.some((list) => list.id === parsed.activeListId)
      ? parsed.activeListId
      : (lists[0]?.id ?? null);

  return { lists, activeListId };
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      lists: [],
      activeListId: null,

      createList: () => {
        const id = generateId('todoList');
        const now = Date.now();
        const newList: TodoList = {
          id,
          title: 'Untitled',
          titleMode: 'auto',
          columns: createDefaultColumns(),
          items: [],
          trash: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          lists: [...state.lists, newList],
          activeListId: id,
        }));

        return id;
      },

      duplicateList: (id) => {
        const source = get().lists.find((list) => list.id === id);
        if (!source) return null;

        const newId = generateId('todoList');
        const now = Date.now();
        const duplicated: TodoList = normalizeTodoList({
          ...source,
          id: newId,
          title: `${source.title} copy`,
          titleMode: 'custom',
          columns: source.columns.map((column) => ({ ...column })),
          items: source.items.map((item) => ({
            ...item,
            id: generateId('todo'),
            createdAt: now,
            updatedAt: now,
          })),
          trash: [],
          createdAt: now,
          updatedAt: now,
        });

        set((state) => ({
          lists: [...state.lists, duplicated],
          activeListId: newId,
        }));

        return newId;
      },

      updateList: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== id) return l;
            const nextTitleMode =
              updates.title !== undefined
                ? (updates.title || '').trim()
                  ? 'custom'
                  : 'auto'
                : (l.titleMode ?? 'auto');
            const nextTitle =
              updates.title !== undefined
                ? (updates.title || '').trim() || computeAutoTitle(l.items[0]?.title || '')
                : l.title;
            return {
              ...l,
              ...updates,
              title: nextTitle,
              titleMode: nextTitleMode,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteList: (id) => {
        set((state) => {
          const lists = state.lists.filter((l) => l.id !== id);
          const activeListId =
            state.activeListId === id ? (lists[0]?.id ?? null) : state.activeListId;
          return { lists, activeListId };
        });
      },

      reorderLists: (orderedIds) => {
        set((state) => {
          if (orderedIds.length !== state.lists.length) return state;

          const listMap = new Map(state.lists.map((list) => [list.id, list]));
          if (!orderedIds.every((id) => listMap.has(id))) return state;

          return {
            ...state,
            lists: orderedIds.map((id) => listMap.get(id)!),
          };
        });
      },

      setActiveList: (id) => {
        set({ activeListId: id });
      },

      createItem: (title, columnId) => {
        const listId = get().activeListId;
        if (!listId) return null;
        const trimmed = title.trim();
        if (!trimmed) return null;

        const now = Date.now();
        let createdId: string | null = null;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;

            const targetColumnId =
              columnId && l.columns.some((col) => col.id === columnId)
                ? columnId
                : l.columns.find((col) => col.role === 'start')?.id ??
                  l.columns[0]?.id ??
                  TODO_COLUMN_ID;

            const columnItems = l.items.filter((item) => item.columnId === targetColumnId);
            const nextOrder =
              columnItems.length > 0
                ? Math.max(...columnItems.map((item) => item.order)) + 1
                : 0;

            const newItem: TodoItem = {
              id: generateId('todo'),
              title: trimmed,
              completed: isDoneColumn(targetColumnId, l.columns),
              columnId: targetColumnId,
              order: nextOrder,
              createdAt: now,
              updatedAt: now,
            };

            createdId = newItem.id;
            const items = [...l.items, newItem];
            return syncListAfterItemChange(l, items);
          }),
        }));

        return createdId;
      },

      createDraftItem: (columnId) => {
        const listId = get().activeListId;
        if (!listId) return null;

        const now = Date.now();
        let createdId: string | null = null;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;

            const targetColumnId =
              columnId && l.columns.some((col) => col.id === columnId)
                ? columnId
                : l.columns.find((col) => col.role === 'start')?.id ??
                  l.columns[0]?.id ??
                  TODO_COLUMN_ID;

            const columnItems = l.items.filter((item) => item.columnId === targetColumnId);
            const nextOrder =
              columnItems.length > 0
                ? Math.max(...columnItems.map((item) => item.order)) + 1
                : 0;

            const newItem: TodoItem = {
              id: generateId('todo'),
              title: '',
              completed: isDoneColumn(targetColumnId, l.columns),
              columnId: targetColumnId,
              order: nextOrder,
              createdAt: now,
              updatedAt: now,
            };

            createdId = newItem.id;
            const items = [...l.items, newItem];
            return syncListAfterItemChange(l, items);
          }),
        }));

        return createdId;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === id)) return l;
            const items = l.items.map((it) =>
              it.id === id ? { ...it, ...updates, updatedAt: Date.now() } : it
            );
            return syncListAfterItemChange(l, items);
          }),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === id)) return l;
            const removed = l.items.find((it) => it.id === id);
            if (!removed) return l;
            const items = l.items.filter((it) => it.id !== id);
            const normalized = normalizeItemOrders(items, removed.columnId);
            return {
              ...syncListAfterItemChange(l, normalized),
              trash: [
                { ...removed, updatedAt: Date.now() },
                ...(l.trash ?? []),
              ],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      discardItem: (id) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === id)) return l;
            const removed = l.items.find((it) => it.id === id);
            if (!removed) return l;
            const items = l.items.filter((it) => it.id !== id);
            const normalized = normalizeItemOrders(items, removed.columnId);
            return {
              ...syncListAfterItemChange(l, normalized),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      restoreItem: (id) => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            const trashed = (l.trash ?? []).find((it) => it.id === id);
            if (!trashed) return l;

            const startColumnId =
              l.columns.find((col) => col.role === 'start')?.id ??
              l.columns[0]?.id ??
              TODO_COLUMN_ID;

            const targetColumnId = l.columns.some((col) => col.id === trashed.columnId)
              ? trashed.columnId
              : startColumnId;

            const columnItems = l.items.filter((item) => item.columnId === targetColumnId);
            const nextOrder =
              columnItems.length > 0
                ? Math.max(...columnItems.map((item) => item.order)) + 1
                : 0;

            const restored: TodoItem = {
              ...trashed,
              columnId: targetColumnId,
              order: nextOrder,
              completed: isDoneColumn(targetColumnId, l.columns),
              updatedAt: Date.now(),
            };

            return {
              ...syncListAfterItemChange(l, [...l.items, restored]),
              trash: (l.trash ?? []).filter((it) => it.id !== id),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      purgeTrashItem: (id) => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  trash: (l.trash ?? []).filter((it) => it.id !== id),
                  updatedAt: Date.now(),
                }
              : l
          ),
        }));
      },

      emptyTrash: () => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, trash: [], updatedAt: Date.now() } : l
          ),
        }));
      },

      toggleItem: (id) => {
        const list = get().lists.find((l) => l.items.some((it) => it.id === id));
        const item = list?.items.find((it) => it.id === id);
        if (!item || !list) return;

        const startColumnId =
          list.columns.find((col) => col.role === 'start')?.id ??
          list.columns[0]?.id ??
          TODO_COLUMN_ID;
        const doneColumnId =
          list.columns.find((col) => col.role === 'done')?.id ?? DONE_COLUMN_ID;

        const targetColumnId = item.completed ? startColumnId : doneColumnId;

        const columnItems = list.items
          .filter((it) => it.columnId === targetColumnId && it.id !== id)
          .sort((a, b) => a.order - b.order);

        get().moveItem(id, targetColumnId, columnItems.length);
      },

      moveItem: (itemId, toColumnId, toIndex) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === itemId)) return l;
            if (!l.columns.some((col) => col.id === toColumnId)) return l;

            const movingItem = l.items.find((it) => it.id === itemId);
            if (!movingItem) return l;

            const fromColumnId = movingItem.columnId;
            const completed = isDoneColumn(toColumnId, l.columns);

            let items = l.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    columnId: toColumnId,
                    completed,
                    updatedAt: Date.now(),
                  }
                : it
            );

            const targetItems = items
              .filter((it) => it.columnId === toColumnId)
              .sort((a, b) => a.order - b.order)
              .filter((it) => it.id !== itemId);

            const clampedIndex = Math.max(0, Math.min(toIndex, targetItems.length));
            targetItems.splice(clampedIndex, 0, {
              ...movingItem,
              columnId: toColumnId,
              completed,
            });

            const targetOrderMap = new Map(
              targetItems.map((it, index) => [it.id, index])
            );

            items = items.map((it) =>
              it.columnId === toColumnId
                ? { ...it, order: targetOrderMap.get(it.id) ?? it.order, completed }
                : it
            );

            if (fromColumnId !== toColumnId) {
              items = normalizeItemOrders(items, fromColumnId);
            }

            return syncListAfterItemChange(l, items);
          }),
        }));
      },

      addColumn: (title) => {
        const listId = get().activeListId;
        if (!listId) return null;

        const trimmed = title.trim();
        if (!trimmed) return null;

        let createdId: string | null = null;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;

            const id = generateId('col');
            createdId = id;
            const sorted = sortColumns(l.columns);
            const doneIndex = sorted.findIndex(
              (col) => col.role === 'done' || col.id === DONE_COLUMN_ID
            );
            const insertAt = doneIndex >= 0 ? doneIndex : sorted.length;
            const nextColumns = [...sorted];
            nextColumns.splice(insertAt, 0, {
              id,
              title: trimmed,
              order: insertAt,
              progressPercent: 0,
              role: null,
            });

            return {
              ...l,
              columns: assignColumnProgress(
                nextColumns.map((col, index) => ({ ...col, order: index }))
              ),
              updatedAt: Date.now(),
            };
          }),
        }));

        return createdId;
      },

      updateColumn: (columnId, updates) => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            const target = l.columns.find((col) => col.id === columnId);
            if (!target) return l;
            if (isLockedColumn(target) && updates.title !== undefined) return l;
            return {
              ...l,
              columns: l.columns.map((col) =>
                col.id === columnId ? { ...col, ...updates } : col
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteColumn: (columnId) => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            if (!l.columns.some((col) => col.id === columnId)) return l;
            const target = l.columns.find((col) => col.id === columnId);
            if (!target || isLockedColumn(target)) return l;

            const fallbackColumnId =
              l.columns.find((col) => col.role === 'start')?.id ??
              l.columns.find((col) => col.id !== columnId)?.id;

            if (!fallbackColumnId) return l;

            const fallbackItems = l.items.filter((it) => it.columnId === fallbackColumnId);
            let nextOrder =
              fallbackItems.length > 0
                ? Math.max(...fallbackItems.map((it) => it.order)) + 1
                : 0;

            let items = l.items.map((it) => {
              if (it.columnId !== columnId) return it;
              const moved = {
                ...it,
                columnId: fallbackColumnId,
                order: nextOrder,
                completed: isDoneColumn(fallbackColumnId, l.columns),
                updatedAt: Date.now(),
              };
              nextOrder += 1;
              return moved;
            });

            items = normalizeItemOrders(items, fallbackColumnId);

            const remaining = l.columns.filter((col) => col.id !== columnId);
            const columns = assignColumnProgress(
              remaining.map((col, index) => ({ ...col, order: index }))
            );

            return {
              ...l,
              columns,
              items,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      reorderMiddleColumns: (orderedMiddleIds) => {
        const listId = get().activeListId;
        if (!listId) return;

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            const orderedIds = buildReorderIds(l.columns, orderedMiddleIds);
            if (!orderedIds) return l;

            const columnMap = new Map(l.columns.map((col) => [col.id, col]));
            const columns = assignColumnProgress(
              orderedIds
                .map((id, index) => {
                  const col = columnMap.get(id);
                  return col ? { ...col, order: index } : null;
                })
                .filter((col): col is KanbanColumn => col !== null)
            );

            return { ...l, columns, updatedAt: Date.now() };
          }),
        }));
      },

      loadFromStorage: () => {},

      saveToStorage: () => {},

      importJSON: (json) => {
        const next = parseImportedTodoState(JSON.parse(json));
        set(next);
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          try {
            const legacy = persisted as LegacyPersist;
            const tasks = legacy?.state?.tasks ?? [];
            const now = Date.now();
            const listId = generateId('todoList');
            const items: TodoItem[] = tasks.map((t, index) => ({
              id: t.id || generateId('todo'),
              title: (t.title || '').trim(),
              completed: !!t.completed,
              columnId: t.completed ? DONE_COLUMN_ID : TODO_COLUMN_ID,
              order: index,
              createdAt: t.createdAt ?? now,
              updatedAt: t.updatedAt ?? now,
            }));
            const list: TodoList = {
              id: listId,
              title: computeAutoTitle(items[0]?.title || ''),
              titleMode: 'auto',
              columns: createDefaultColumns(),
              items,
              trash: [],
              createdAt: now,
              updatedAt: now,
            };
            return { lists: items.length ? [list] : [], activeListId: items.length ? listId : null };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        if (version < 3) {
          try {
            const v2 = persisted as V2Persist;
            const lists = (v2.lists ?? []).map(migrateListToKanban).map(normalizeTodoList);
            return { lists, activeListId: v2.activeListId ?? null };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        if (version < 4) {
          try {
            const state = persisted as TodoState;
            return {
              lists: (state.lists ?? []).map(normalizeTodoList),
              activeListId: state.activeListId ?? null,
            };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        if (version < 5) {
          try {
            const state = persisted as TodoState;
            return {
              lists: (state.lists ?? []).map((list) =>
                normalizeTodoList({
                  ...list,
                  trash: (list as TodoList).trash ?? [],
                })
              ),
              activeListId: state.activeListId ?? null,
            };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        if (version < 6) {
          try {
            const state = persisted as TodoState;
            return {
              lists: (state.lists ?? []).map(normalizeTodoList),
              activeListId: state.activeListId ?? null,
            };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        if (version < 8) {
          try {
            const state = persisted as TodoState;
            return {
              lists: (state.lists ?? []).map(normalizeTodoList),
              activeListId: state.activeListId ?? null,
            };
          } catch {
            return { lists: [], activeListId: null };
          }
        }

        const state = persisted as TodoState;
        return {
          lists: (state.lists ?? []).map(normalizeTodoList),
          activeListId: state.activeListId ?? null,
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TodoState>;
        const lists = Array.isArray(persisted.lists)
          ? persisted.lists.map((list) => normalizeTodoList(list as TodoList))
          : currentState.lists;

        return {
          ...currentState,
          ...persisted,
          lists,
          activeListId:
            typeof persisted.activeListId === 'string'
              ? persisted.activeListId
              : currentState.activeListId,
        };
      },
      partialize: (state) => ({
        lists: state.lists,
        activeListId: state.activeListId,
      }),
    }
  )
);
