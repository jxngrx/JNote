import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  createdAt: number;
  updatedAt: number;
}

export interface TodoState {
  tasks: TodoTask[];
  categories: string[];
  selectedDate: string; // ISO date string
}

export interface TodoStore extends TodoState {
  createTask: (title: string, category?: string) => string;
  updateTask: (id: string, updates: Partial<TodoTask>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setSelectedDate: (date: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => {
      // Initialize selectedDate if not in storage
      const stored = typeof window !== 'undefined' ? localStorage.getItem('todo-storage') : null;
      let initialDate = getTodayDate();
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.selectedDate) {
            initialDate = parsed.state.selectedDate;
          }
        } catch (e) {
          // Use default
        }
      }

      return {
        tasks: [],
        categories: ['DESIGN', 'PERSONAL', 'HOUSE'],
        selectedDate: initialDate,

      createTask: (title: string, category?: string) => {
        const newTask: TodoTask = {
          id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: title.trim(),
          completed: false,
          category: category || 'PERSONAL',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        get().saveToStorage();
        return newTask.id;
      },

      updateTask: (id: string, updates: Partial<TodoTask>) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: Date.now() }
              : task
          ),
        }));

        get().saveToStorage();
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));

        get().saveToStorage();
      },

      toggleTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed, updatedAt: Date.now() }
              : task
          ),
        }));

        get().saveToStorage();
      },

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().saveToStorage();
      },

      addCategory: (category: string) => {
        const trimmed = category.trim().toUpperCase();
        if (!trimmed || get().categories.includes(trimmed)) return;

        set((state) => ({
          categories: [...state.categories, trimmed],
        }));

        get().saveToStorage();
      },

      deleteCategory: (category: string) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat !== category),
          tasks: state.tasks.map((task) =>
            task.category === category ? { ...task, category: 'PERSONAL' } : task
          ),
        }));

        get().saveToStorage();
      },

      loadFromStorage: () => {
        // Handled by persist middleware
      },

      saveToStorage: () => {
        // Handled by persist middleware
      },
      };
    },
    {
      name: 'todo-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        selectedDate: state.selectedDate,
      }),
    }
  )
);
