'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  buildGradientCss,
  resolvePhotoBackground,
  type BackgroundKind,
  type BackgroundPresetId,
  type GradientPresetId,
  GRADIENT_PRESETS,
} from '@/lib/background-presets';

export type BackgroundSettings = {
  kind: BackgroundKind;
  presetId: BackgroundPresetId;
  customImageUrl: string | null;
  gradientPresetId: GradientPresetId;
  gradientColors: string[];
  gradientAngle: number;
  blurPx: number;
  mosaicStrength: number;
  overlayOpacity: number;
};

const DEFAULT_SETTINGS: BackgroundSettings = {
  kind: 'photo',
  presetId: 'misty-forest',
  customImageUrl: null,
  gradientPresetId: 'blue-mosaic',
  gradientColors: ['#0a1628', '#12325a', '#2c6edb', '#5b9fd4', '#a8d4f5'],
  gradientAngle: 145,
  blurPx: 28,
  mosaicStrength: 45,
  overlayOpacity: 0.52,
};

type BackgroundSettingsStore = BackgroundSettings & {
  setSettings: (patch: Partial<BackgroundSettings>) => void;
  setPreset: (presetId: BackgroundPresetId) => void;
  setKind: (kind: BackgroundKind) => void;
  setGradientPreset: (id: GradientPresetId) => void;
  setGradientColor: (index: number, color: string) => void;
  addGradientColor: () => void;
  removeGradientColor: (index: number) => void;
  setCustomImage: (dataUrl: string | null) => void;
  resetSettings: () => void;
  getResolvedBackground: () => string;
  isActive: () => boolean;
};

export const useBackgroundSettingsStore = create<BackgroundSettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setSettings: (patch) => set(patch),

      setKind: (kind) => set({ kind }),

      setPreset: (presetId) =>
        set({
          kind: presetId === 'none' ? 'theme' : 'photo',
          presetId,
        }),

      setGradientPreset: (id) => {
        const preset = GRADIENT_PRESETS.find((p) => p.id === id);
        if (!preset) return;
        set({
          kind: 'gradient',
          gradientPresetId: id,
          gradientColors: [...preset.colors],
          gradientAngle: preset.angle,
        });
      },

      setGradientColor: (index, color) => {
        const colors = [...get().gradientColors];
        if (index < 0 || index >= colors.length) return;
        colors[index] = color;
        set({ kind: 'gradient', gradientPresetId: 'custom', gradientColors: colors });
      },

      addGradientColor: () => {
        const colors = get().gradientColors;
        if (colors.length >= 5) return;
        const last = colors[colors.length - 1] ?? '#2c6edb';
        set({
          kind: 'gradient',
          gradientPresetId: 'custom',
          gradientColors: [...colors, last],
        });
      },

      removeGradientColor: (index) => {
        const colors = get().gradientColors;
        if (colors.length <= 2) return;
        set({
          kind: 'gradient',
          gradientPresetId: 'custom',
          gradientColors: colors.filter((_, i) => i !== index),
        });
      },

      setCustomImage: (dataUrl) =>
        set({ customImageUrl: dataUrl, presetId: 'custom', kind: 'photo' }),

      resetSettings: () => set(DEFAULT_SETTINGS),

      getResolvedBackground: () => {
        const state = get();
        if (state.kind === 'theme') return 'none';
        if (state.kind === 'gradient') {
          return buildGradientCss(state.gradientColors, state.gradientAngle);
        }
        return resolvePhotoBackground(state.presetId, state.customImageUrl);
      },

      isActive: () => get().kind !== 'theme',
    }),
    {
      name: 'background-settings-v2',
      migrate: (persisted: unknown) => {
        const prev = persisted as Partial<BackgroundSettings> & {
          presetId?: BackgroundPresetId;
        };
        if (!prev || typeof prev !== 'object') return DEFAULT_SETTINGS;
        const presetId = prev.presetId ?? DEFAULT_SETTINGS.presetId;
        return {
          ...DEFAULT_SETTINGS,
          ...prev,
          kind:
            prev.kind ??
            (presetId === 'none' ? 'theme' : 'photo'),
        };
      },
    }
  )
);

/** @deprecated use getResolvedBackground */
export function resolveBackgroundImageFromStore(
  presetId: BackgroundPresetId,
  customImageUrl: string | null
) {
  return resolvePhotoBackground(presetId, customImageUrl);
}
