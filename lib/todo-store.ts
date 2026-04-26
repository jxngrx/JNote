import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  titleMode?: 'auto' | 'custom';
  items: TodoItem[];
  createdAt: number;
  updatedAt: number;
}

export interface TodoState {
  lists: TodoList[];
  activeListId: string | null;
}

export interface TodoStore extends TodoState {
  createList: () => string;
  updateList: (id: string, updates: Partial<Pick<TodoList, 'title' | 'titleMode'>>) => void;
  deleteList: (id: string) => void;
  setActiveList: (id: string | null) => void;

  createItem: (title: string) => string | null;
  updateItem: (id: string, updates: Partial<TodoItem>) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'todo-storage';
const STORE_VERSION = 2;

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const computeAutoTitle = (text: string, maxLen = 24) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  return (normalized.slice(0, maxLen).trim() || 'Untitled');
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
          items: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          lists: [...state.lists, newList],
          activeListId: id,
        }));

        return id;
      },

      updateList: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== id) return l;
            const nextTitleMode =
              updates.title !== undefined ? ((updates.title || '').trim() ? 'custom' : 'auto') : (l.titleMode ?? 'auto');
            const nextTitle =
              updates.title !== undefined
                ? (updates.title || '').trim() || computeAutoTitle(l.items[0]?.title || '')
                : l.title;
            return { ...l, ...updates, title: nextTitle, titleMode: nextTitleMode, updatedAt: Date.now() };
          }),
        }));
      },

      deleteList: (id) => {
        set((state) => {
          const lists = state.lists.filter((l) => l.id !== id);
          const activeListId = state.activeListId === id ? (lists[0]?.id ?? null) : state.activeListId;
          return { lists, activeListId };
        });
      },

      setActiveList: (id) => {
        set({ activeListId: id });
      },

      createItem: (title) => {
        const listId = get().activeListId;
        if (!listId) return null;
        const trimmed = title.trim();
        if (!trimmed) return null;

        const now = Date.now();
        const newItem: TodoItem = {
          id: generateId('todo'),
          title: trimmed,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            const items = [...l.items, newItem];
            const titleMode = l.titleMode ?? 'auto';
            return {
              ...l,
              title: titleMode === 'custom' ? l.title : computeAutoTitle(items[0]?.title || ''),
              titleMode,
              items,
              updatedAt: now,
            };
          }),
        }));

        return newItem.id;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === id)) return l;
            const items = l.items.map((it) => (it.id === id ? { ...it, ...updates, updatedAt: Date.now() } : it));
            const titleMode = l.titleMode ?? 'auto';
            return {
              ...l,
              title: titleMode === 'custom' ? l.title : computeAutoTitle(items[0]?.title || ''),
              titleMode,
              items,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (!l.items.some((it) => it.id === id)) return l;
            const items = l.items.filter((it) => it.id !== id);
            const titleMode = l.titleMode ?? 'auto';
            return {
              ...l,
              title: titleMode === 'custom' ? l.title : computeAutoTitle(items[0]?.title || ''),
              titleMode,
              items,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      toggleItem: (id) => {
        const list = get().lists.find((l) => l.items.some((it) => it.id === id));
        const item = list?.items.find((it) => it.id === id);
        if (!item) return;
        get().updateItem(id, { completed: !item.completed });
      },

      loadFromStorage: () => {
        // handled by persist middleware
      },

      saveToStorage: () => {
        // handled by persist middleware
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      migrate: (persisted: unknown, version: number) => {
        // v1 legacy shape: { state: { tasks, categories, selectedDate } }
        if (version < 2) {
          try {
            const legacy = persisted as LegacyPersist;
            const tasks = legacy?.state?.tasks ?? [];
            const now = Date.now();
            const listId = generateId('todoList');
            const items: TodoItem[] = tasks.map((t) => ({
              id: t.id || generateId('todo'),
              title: (t.title || '').trim(),
              completed: !!t.completed,
              createdAt: t.createdAt ?? now,
              updatedAt: t.updatedAt ?? now,
            }));
            const list: TodoList = {
              id: listId,
              title: computeAutoTitle(items[0]?.title || ''),
              titleMode: 'auto',
              items,
              createdAt: now,
              updatedAt: now,
            };
            return { lists: items.length ? [list] : [], activeListId: items.length ? listId : null };
          } catch {
            return { lists: [], activeListId: null };
          }
        }
        return persisted as TodoState;
      },
      partialize: (state) => ({
        lists: state.lists,
        activeListId: state.activeListId,
      }),
    }
  )
);

