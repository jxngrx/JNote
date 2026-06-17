'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PomodoroFontId } from '@/lib/pomodoro-fonts';

export type PomodoroFontStyle = 'normal' | 'italic';
export type PomodoroFontWeight = 300 | 400 | 500 | 600;

export type PomodoroSettings = {
  fontFamily: PomodoroFontId;
  fontStyle: PomodoroFontStyle;
  fontWeight: PomodoroFontWeight;
  letterSpacingEm: number;
  displaySizePx: number;
  labelSizePx: number;
  defaultMinutes: number;
  showProgressRing: boolean;
  textColor: string | null;
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  fontFamily: 'playfair',
  fontStyle: 'normal',
  fontWeight: 400,
  letterSpacingEm: -0.03,
  displaySizePx: 112,
  labelSizePx: 13,
  defaultMinutes: 25,
  showProgressRing: true,
  textColor: null,
};

type PomodoroSettingsStore = PomodoroSettings & {
  setSettings: (patch: Partial<PomodoroSettings>) => void;
  resetSettings: () => void;
};

export const usePomodoroSettingsStore = create<PomodoroSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_POMODORO_SETTINGS,

      setSettings: (patch) => set(patch),
      resetSettings: () => set(DEFAULT_POMODORO_SETTINGS),
    }),
    {
      name: 'pomodoro-settings-v1',
    }
  )
);
