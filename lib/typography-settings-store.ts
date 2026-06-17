'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppPrimaryFontId, AppSecondaryFontId } from '@/lib/app-fonts';

export const TYPOGRAPHY_STORAGE_KEY = 'typography-settings-v1';

export type AppFontStyle = 'normal' | 'italic';
export type AppFontWeight = 300 | 400 | 500 | 600;

export type TypographySettings = {
  primaryFontFamily: AppPrimaryFontId;
  secondaryFontFamily: AppSecondaryFontId;
  fontStyle: AppFontStyle;
  fontWeight: AppFontWeight;
};

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  primaryFontFamily: 'dm-sans',
  secondaryFontFamily: 'dm-mono',
  fontStyle: 'normal',
  fontWeight: 400,
};

type TypographySettingsStore = TypographySettings & {
  setSettings: (patch: Partial<TypographySettings>) => void;
  resetSettings: () => void;
};

export type PersistedTypographyState = Partial<TypographySettings> & {
  fontFamily?: string;
};

function normalizeTypographyState(
  state: PersistedTypographyState
): TypographySettings {
  const legacyFont = state.fontFamily;
  let primaryFontFamily = state.primaryFontFamily;
  let secondaryFontFamily = state.secondaryFontFamily;

  if (!primaryFontFamily && legacyFont) {
    if (legacyFont === 'fira-code') {
      primaryFontFamily = 'dm-sans';
      secondaryFontFamily = 'fira-code';
    } else {
      primaryFontFamily = legacyFont as AppPrimaryFontId;
      secondaryFontFamily = 'dm-mono';
    }
  }

  const weight = state.fontWeight;
  const fontWeight =
    weight === 300 || weight === 400 || weight === 500 || weight === 600
      ? weight
      : DEFAULT_TYPOGRAPHY_SETTINGS.fontWeight;

  return {
    primaryFontFamily:
      primaryFontFamily ?? DEFAULT_TYPOGRAPHY_SETTINGS.primaryFontFamily,
    secondaryFontFamily:
      secondaryFontFamily ?? DEFAULT_TYPOGRAPHY_SETTINGS.secondaryFontFamily,
    fontStyle: state.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight,
  };
}

export const useTypographySettingsStore = create<TypographySettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      setSettings: (patch) => set(patch),
      resetSettings: () => set(DEFAULT_TYPOGRAPHY_SETTINGS),
    }),
    {
      name: TYPOGRAPHY_STORAGE_KEY,
      version: 2,
      migrate: (persistedState) =>
        normalizeTypographyState(
          (persistedState ?? {}) as PersistedTypographyState
        ),
    }
  )
);

export { normalizeTypographyState };
