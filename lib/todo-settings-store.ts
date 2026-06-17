'use client';

import type { CSSProperties } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TodoCompleteSoundPreset,
  TodoMoveSoundPreset,
} from '@/lib/todo-sounds';

export interface TodoSoundSettings {
  soundsEnabled: boolean;
  completeSound: TodoCompleteSoundPreset;
  completeSoundCustomName: string | null;
  moveSound: TodoMoveSoundPreset;
  moveSoundCustomName: string | null;
}

export interface TodoSettings extends TodoSoundSettings {
  containerWidth: number;
  cardWidth: number;
  cardHeight: number;
  columnWidth: number;
  fontSize: number;
}

export const DEFAULT_TODO_SOUND_SETTINGS: TodoSoundSettings = {
  soundsEnabled: true,
  completeSound: 'chime',
  completeSoundCustomName: null,
  moveSound: 'slide',
  moveSoundCustomName: null,
};

export const DEFAULT_TODO_SETTINGS: TodoSettings = {
  ...DEFAULT_TODO_SOUND_SETTINGS,
  containerWidth: 1100,
  cardWidth: 168,
  cardHeight: 72,
  columnWidth: 272,
  fontSize: 13,
};

export const TODO_SETTINGS_LIMITS = {
  containerWidth: { min: 480, max: 1400, step: 20 },
  cardWidth: { min: 120, max: 360, step: 4 },
  cardHeight: { min: 56, max: 240, step: 4 },
  columnWidth: { min: 180, max: 420, step: 4 },
  fontSize: { min: 10, max: 22, step: 1 },
} as const;

export const TODO_COMPLETE_SOUND_OPTIONS: {
  id: TodoCompleteSoundPreset;
  label: string;
}[] = [
  { id: 'chime', label: 'Chime' },
  { id: 'pop', label: 'Pop' },
  { id: 'success', label: 'Success' },
  { id: 'none', label: 'None' },
];

export const TODO_MOVE_SOUND_OPTIONS: {
  id: TodoMoveSoundPreset;
  label: string;
}[] = [
  { id: 'slide', label: 'Slide' },
  { id: 'whoosh', label: 'Whoosh' },
  { id: 'tap', label: 'Tap' },
  { id: 'none', label: 'None' },
];

type TodoSettingsState = TodoSettings & {
  setSettings: (partial: Partial<TodoSettings>) => void;
  resetGridSettings: () => void;
  resetKanbanSettings: () => void;
  resetSoundSettings: () => void;
  resetSettings: () => void;
};

export const useTodoSettingsStore = create<TodoSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_TODO_SETTINGS,

      setSettings: (partial) => set((state) => ({ ...state, ...partial })),

      resetGridSettings: () =>
        set({
          containerWidth: DEFAULT_TODO_SETTINGS.containerWidth,
          cardWidth: DEFAULT_TODO_SETTINGS.cardWidth,
          cardHeight: DEFAULT_TODO_SETTINGS.cardHeight,
        }),

      resetKanbanSettings: () =>
        set({
          columnWidth: DEFAULT_TODO_SETTINGS.columnWidth,
        }),

      resetSoundSettings: () =>
        set({
          ...DEFAULT_TODO_SOUND_SETTINGS,
        }),

      resetSettings: () => set({ ...DEFAULT_TODO_SETTINGS }),
    }),
    {
      name: 'todo-settings-v1',
      version: 3,
      migrate: (persisted) => {
        const legacy = persisted as Partial<TodoSettings> & {
          completeSoundCustom?: string | null;
          moveSoundCustom?: string | null;
        };

        const {
          completeSoundCustom: _completeSoundCustom,
          moveSoundCustom: _moveSoundCustom,
          ...rest
        } = legacy;

        return {
          ...DEFAULT_TODO_SETTINGS,
          ...rest,
        };
      },
      partialize: (state) => ({
        soundsEnabled: state.soundsEnabled,
        completeSound: state.completeSound,
        completeSoundCustomName: state.completeSoundCustomName,
        moveSound: state.moveSound,
        moveSoundCustomName: state.moveSoundCustomName,
        containerWidth: state.containerWidth,
        cardWidth: state.cardWidth,
        cardHeight: state.cardHeight,
        columnWidth: state.columnWidth,
        fontSize: state.fontSize,
      }),
    }
  )
);

export function todoSettingsToCssVars(
  settings: Pick<
    TodoSettings,
    'containerWidth' | 'cardWidth' | 'cardHeight' | 'columnWidth' | 'fontSize'
  >
): CSSProperties {
  return {
    '--todo-container-width': `${settings.containerWidth}px`,
    '--todo-card-width': `${settings.cardWidth}px`,
    '--todo-card-height': `${settings.cardHeight}px`,
    '--todo-column-width': `${settings.columnWidth}px`,
    '--todo-font-size': `${settings.fontSize}px`,
    '--todo-font-size-meta': `${Math.max(9, Math.round(settings.fontSize * 0.72))}px`,
  } as CSSProperties;
}

export function pickTodoSoundSettings(settings: TodoSettings): TodoSoundSettings {
  return {
    soundsEnabled: settings.soundsEnabled,
    completeSound: settings.completeSound,
    completeSoundCustomName: settings.completeSoundCustomName,
    moveSound: settings.moveSound,
    moveSoundCustomName: settings.moveSoundCustomName,
  };
}
