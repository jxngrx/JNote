'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_DARK_PRESET_ID,
  getPresetById,
  THEME_PRESET_MAP,
} from '@/lib/theme-presets';
import type { ThemeColorKey, ThemeColors, ThemeMode } from '@/lib/theme-types';
import { themeToCssVars } from '@/lib/theme-utils';

export const THEME_STORAGE_KEY = 'noterx-theme-v1';

export type ThemeState = {
  presetId: string;
  mode: ThemeMode;
  colors: ThemeColors;
  isCustom: boolean;
  setMode: (mode: ThemeMode) => void;
  applyPreset: (presetId: string) => void;
  setColor: (key: ThemeColorKey, value: string) => void;
  setBorderOpacity: (value: number) => void;
  setBorderStrongOpacity: (value: number) => void;
  resetToPreset: () => void;
  importTheme: (payload: {
    presetId?: string;
    mode: ThemeMode;
    colors: ThemeColors;
    isCustom?: boolean;
  }) => void;
  exportTheme: () => string;
};

const defaultPreset = getPresetById(DEFAULT_DARK_PRESET_ID)!;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      presetId: DEFAULT_DARK_PRESET_ID,
      mode: defaultPreset.mode,
      colors: { ...defaultPreset.colors },
      isCustom: false,

      setMode: (mode) => {
        const { presetId, isCustom } = get();
        if (isCustom) {
          set({ mode });
          return;
        }

        const fallbackId = mode === 'dark' ? DEFAULT_DARK_PRESET_ID : 'noterx-light';
        const preset = getPresetById(presetId);
        const nextPreset =
          preset?.mode === mode ? preset : getPresetById(fallbackId)!;

        set({
          mode,
          presetId: nextPreset.id,
          colors: { ...nextPreset.colors },
        });
      },

      applyPreset: (presetId) => {
        const preset = getPresetById(presetId);
        if (!preset) return;

        set({
          presetId,
          mode: preset.mode,
          colors: { ...preset.colors },
          isCustom: false,
        });
      },

      setColor: (key, value) => {
        set((state) => ({
          colors: { ...state.colors, [key]: value },
          isCustom: true,
          presetId: 'custom',
        }));
      },

      setBorderOpacity: (value) => {
        set((state) => ({
          colors: { ...state.colors, borderOpacity: value },
          isCustom: true,
          presetId: 'custom',
        }));
      },

      setBorderStrongOpacity: (value) => {
        set((state) => ({
          colors: { ...state.colors, borderStrongOpacity: value },
          isCustom: true,
          presetId: 'custom',
        }));
      },

      resetToPreset: () => {
        const { presetId } = get();
        const preset =
          getPresetById(presetId) ?? getPresetById(DEFAULT_DARK_PRESET_ID)!;

        set({
          presetId: preset.id,
          mode: preset.mode,
          colors: { ...preset.colors },
          isCustom: false,
        });
      },

      importTheme: (payload) => {
        set({
          presetId: payload.presetId ?? 'custom',
          mode: payload.mode,
          colors: { ...payload.colors },
          isCustom: payload.isCustom ?? payload.presetId === 'custom',
        });
      },

      exportTheme: () => {
        const { presetId, mode, colors, isCustom } = get();
        return JSON.stringify(
          { presetId, mode, colors, isCustom, exportedAt: Date.now() },
          null,
          2
        );
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({
        presetId: state.presetId,
        mode: state.mode,
        colors: state.colors,
        isCustom: state.isCustom,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.presetId !== 'custom' && !THEME_PRESET_MAP[state.presetId]) {
          const fallback = getPresetById(DEFAULT_DARK_PRESET_ID)!;
          state.presetId = fallback.id;
          state.mode = fallback.mode;
          state.colors = { ...fallback.colors };
          state.isCustom = false;
        }
      },
    }
  )
);

export function getThemeCssVarsFromState(state: {
  colors: ThemeColors;
  mode: ThemeMode;
}) {
  return themeToCssVars(state.colors, state.mode);
}
