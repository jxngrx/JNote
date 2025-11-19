'use client';

import { create } from 'zustand';
import { AppStore, AppMode } from './types';

const STORAGE_KEY = 'sticky-app-mode-v1';

const DEFAULT_MODE: AppMode = 'sticky-notes';

export const useAppStore = create<AppStore>((set, get) => ({
  mode: DEFAULT_MODE,
  lastMode: DEFAULT_MODE,

  setMode: (mode: AppMode) => {
    set({ mode, lastMode: mode });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          mode: data.mode || DEFAULT_MODE,
          lastMode: data.lastMode || DEFAULT_MODE,
        });
      }
    } catch (error) {
      console.error('Failed to load app mode from storage:', error);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const state = get();
      const data = {
        mode: state.mode,
        lastMode: state.lastMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save app mode to storage:', error);
    }
  },
}));
