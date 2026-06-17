'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TodoViewMode = 'grid' | 'kanban';

type TodoUiState = {
  viewMode: TodoViewMode;
  editingItemId: string | null;
  setViewMode: (mode: TodoViewMode) => void;
  setEditingItemId: (id: string | null) => void;
};

export const useTodoUiStore = create<TodoUiState>()(
  persist(
    (set) => ({
      viewMode: 'kanban',
      editingItemId: null,

      setViewMode: (mode) => set({ viewMode: mode }),
      setEditingItemId: (id) => set({ editingItemId: id }),
    }),
    {
      name: 'todo-ui-v1',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
