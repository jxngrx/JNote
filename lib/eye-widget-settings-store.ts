'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EyeTrackingVariant } from '@/components/ui/eye-tracking';

export interface EyeWidgetSettings {
  enabled: boolean;
  variant: EyeTrackingVariant;
  eyeSize: number;
  gap: number;
  irisColor: string;
  irisColorSecondary: string;
  pupilColor: string;
  scleraColor: string;
  pupilRange: number;
  blinkInterval: number;
  showReflection: boolean;
  showIrisDetail: boolean;
  idleAnimation: boolean;
  reactivePupil: boolean;
  showEyelids: boolean;
}

export const DEFAULT_EYE_WIDGET_SETTINGS: EyeWidgetSettings = {
  enabled: true,
  variant: 'realistic',
  eyeSize: 32,
  gap: 10,
  irisColor: '#c4623f',
  irisColorSecondary: '#e8a88c',
  pupilColor: '#0a0a0a',
  scleraColor: '#f0ebe6',
  pupilRange: 0.72,
  blinkInterval: 4200,
  showReflection: true,
  showIrisDetail: true,
  idleAnimation: true,
  reactivePupil: true,
  showEyelids: true,
};

export const EYE_WIDGET_SETTINGS_LIMITS = {
  eyeSize: { min: 18, max: 48, step: 1 },
  gap: { min: 2, max: 24, step: 1 },
  pupilRange: { min: 0.3, max: 1, step: 0.02 },
  blinkInterval: { min: 1500, max: 10000, step: 100 },
} as const;

export const EYE_WIDGET_VARIANTS: {
  id: EyeTrackingVariant;
  label: string;
}[] = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'cyber', label: 'Cyber' },
];

type EyeWidgetSettingsState = EyeWidgetSettings & {
  setSettings: (partial: Partial<EyeWidgetSettings>) => void;
  resetSettings: () => void;
};

export const useEyeWidgetSettingsStore = create<EyeWidgetSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_EYE_WIDGET_SETTINGS,

      setSettings: (partial) => set((state) => ({ ...state, ...partial })),

      resetSettings: () => set({ ...DEFAULT_EYE_WIDGET_SETTINGS }),
    }),
    {
      name: 'noterx-eye-widget-settings-v1',
    }
  )
);
