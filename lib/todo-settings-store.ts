'use client';

import type { CSSProperties } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoSettings {
  containerWidth: number;
  cardWidth: number;
  cardHeight: number;
  fontSize: number;
}

export const DEFAULT_TODO_SETTINGS: TodoSettings = {
  containerWidth: 900,
  cardWidth: 168,
  cardHeight: 72,
  fontSize: 13,
};

export const TODO_SETTINGS_LIMITS = {
  containerWidth: { min: 480, max: 1400, step: 20 },
  cardWidth: { min: 120, max: 360, step: 4 },
  cardHeight: { min: 56, max: 240, step: 4 },
  fontSize: { min: 10, max: 22, step: 1 },
} as const;

type TodoSettingsState = TodoSettings & {
  setSettings: (partial: Partial<TodoSettings>) => void;
  resetSettings: () => void;
};

export const useTodoSettingsStore = create<TodoSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_TODO_SETTINGS,

      setSettings: (partial) => set((state) => ({ ...state, ...partial })),

      resetSettings: () => set({ ...DEFAULT_TODO_SETTINGS }),
    }),
    {
      name: 'todo-settings-v1',
      partialize: (state) => ({
        containerWidth: state.containerWidth,
        cardWidth: state.cardWidth,
        cardHeight: state.cardHeight,
        fontSize: state.fontSize,
      }),
    }
  )
);

export function todoSettingsToCssVars(settings: TodoSettings): CSSProperties {
  return {
    '--todo-container-width': `${settings.containerWidth}px`,
    '--todo-card-width': `${settings.cardWidth}px`,
    '--todo-card-height': `${settings.cardHeight}px`,
    '--todo-font-size': `${settings.fontSize}px`,
    '--todo-font-size-meta': `${Math.max(9, Math.round(settings.fontSize * 0.72))}px`,
  } as CSSProperties;
}
