'use client';

import type { CSSProperties } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClockWidgetFontFamily = 'sans' | 'mono';

export const CLOCK_WIDGET_EXPAND_OFFSET = 44;
export const CLOCK_WIDGET_PADDING_X = 10;
export const CLOCK_WIDGET_PADDING_Y = 8;
export const CLOCK_WIDGET_BACKDROP_BLUR = 10;

export interface ClockWidgetSettings {
  collapsedWidth: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
  borderColor: string;
  titleFontSize: number;
  titleFontWeight: number;
  titleColor: string;
  titleFontFamily: ClockWidgetFontFamily;
  subtitleFontSize: number;
  subtitleFontWeight: number;
  subtitleColor: string;
  subtitleFontFamily: ClockWidgetFontFamily;
  showSeconds: boolean;
}

export const DEFAULT_CLOCK_WIDGET_SETTINGS: ClockWidgetSettings = {
  collapsedWidth: 104,
  height: 54,
  borderRadius: 14,
  backgroundColor: '',
  borderColor: '',
  titleFontSize: 14,
  titleFontWeight: 700,
  titleColor: '',
  titleFontFamily: 'mono',
  subtitleFontSize: 10,
  subtitleFontWeight: 500,
  subtitleColor: '',
  subtitleFontFamily: 'sans',
  showSeconds: true,
};

export function getClockWidgetExpandedWidth(collapsedWidth: number) {
  return collapsedWidth + CLOCK_WIDGET_EXPAND_OFFSET;
}

export const CLOCK_WIDGET_SETTINGS_LIMITS = {
  collapsedWidth: { min: 84, max: 180, step: 2 },
  height: { min: 44, max: 120, step: 2 },
  borderRadius: { min: 6, max: 28, step: 1 },
  titleFontSize: { min: 10, max: 28, step: 1 },
  titleFontWeight: { min: 400, max: 800, step: 100 },
  subtitleFontSize: { min: 8, max: 18, step: 1 },
  subtitleFontWeight: { min: 400, max: 700, step: 100 },
} as const;

type ClockWidgetSettingsState = ClockWidgetSettings & {
  setSettings: (partial: Partial<ClockWidgetSettings>) => void;
  resetSettings: () => void;
};

export const useClockWidgetSettingsStore = create<ClockWidgetSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_CLOCK_WIDGET_SETTINGS,

      setSettings: (partial) => set((state) => ({ ...state, ...partial })),

      resetSettings: () => set({ ...DEFAULT_CLOCK_WIDGET_SETTINGS }),
    }),
    {
      name: 'noterx-clock-widget-settings-v1',
      partialize: (state) => ({
        collapsedWidth: state.collapsedWidth,
        height: state.height,
        borderRadius: state.borderRadius,
        backgroundColor: state.backgroundColor,
        borderColor: state.borderColor,
        titleFontSize: state.titleFontSize,
        titleFontWeight: state.titleFontWeight,
        titleColor: state.titleColor,
        titleFontFamily: state.titleFontFamily,
        subtitleFontSize: state.subtitleFontSize,
        subtitleFontWeight: state.subtitleFontWeight,
        subtitleColor: state.subtitleColor,
        subtitleFontFamily: state.subtitleFontFamily,
        showSeconds: state.showSeconds,
      }),
    }
  )
);

function fontFamilyValue(family: ClockWidgetFontFamily) {
  return family === 'mono' ? 'var(--font-mono)' : 'var(--font)';
}

export function clockWidgetSettingsToStyle(
  settings: ClockWidgetSettings
): CSSProperties {
  const expandedWidth = getClockWidgetExpandedWidth(settings.collapsedWidth);

  return {
    '--clock-widget-collapsed-width': `${settings.collapsedWidth}px`,
    '--clock-widget-expanded-width': `${expandedWidth}px`,
    '--clock-widget-height': `${settings.height}px`,
    '--clock-widget-padding-x': `${CLOCK_WIDGET_PADDING_X}px`,
    '--clock-widget-padding-y': `${CLOCK_WIDGET_PADDING_Y}px`,
    '--clock-widget-radius': `${settings.borderRadius}px`,
    '--clock-widget-bg':
      settings.backgroundColor ||
      'color-mix(in srgb, var(--surface) 94%, transparent)',
    '--clock-widget-border':
      settings.borderColor || 'var(--border-strong)',
    '--clock-widget-title-size': `${settings.titleFontSize}px`,
    '--clock-widget-title-weight': String(settings.titleFontWeight),
    '--clock-widget-title-color':
      settings.titleColor || 'var(--text-primary)',
    '--clock-widget-title-font': fontFamilyValue(settings.titleFontFamily),
    '--clock-widget-subtitle-size': `${settings.subtitleFontSize}px`,
    '--clock-widget-subtitle-weight': String(settings.subtitleFontWeight),
    '--clock-widget-subtitle-color':
      settings.subtitleColor || 'var(--text-secondary)',
    '--clock-widget-subtitle-font': fontFamilyValue(settings.subtitleFontFamily),
    '--clock-widget-blur': `${CLOCK_WIDGET_BACKDROP_BLUR}px`,
  } as CSSProperties;
}
