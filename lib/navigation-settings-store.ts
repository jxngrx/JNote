'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationChrome = 'dock' | 'sidebar';
export type SidebarPosition = 'left' | 'right';
export type SidebarAttach = 'fixed' | 'floating';
export type SidebarVisibility = 'always' | 'auto-hide';

export interface NavigationSettings {
  chrome: NavigationChrome;
  iconSize: number;
  maxScale: number;
  magneticDistance: number;
  showLabels: boolean;
  sidebarPosition: SidebarPosition;
  sidebarAttach: SidebarAttach;
  sidebarVisibility: SidebarVisibility;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  sidebarRadius: number;
  sidebarOffset: number;
  autoHideEdgeSize: number;
  autoHideDelayMs: number;
}

export const DEFAULT_NAVIGATION_SETTINGS: NavigationSettings = {
  chrome: 'dock',
  iconSize: 44,
  maxScale: 1.42,
  magneticDistance: 72,
  showLabels: true,
  sidebarPosition: 'left',
  sidebarAttach: 'floating',
  sidebarVisibility: 'always',
  sidebarWidth: 240,
  sidebarCollapsed: false,
  sidebarRadius: 22,
  sidebarOffset: 12,
  autoHideEdgeSize: 8,
  autoHideDelayMs: 400,
};

export const NAVIGATION_SETTINGS_LIMITS = {
  iconSize: { min: 32, max: 56, step: 2 },
  maxScale: { min: 1.1, max: 1.8, step: 0.02 },
  magneticDistance: { min: 40, max: 120, step: 4 },
  sidebarWidth: { min: 200, max: 320, step: 4 },
  sidebarRadius: { min: 10, max: 28, step: 2 },
  sidebarOffset: { min: 0, max: 32, step: 2 },
  autoHideEdgeSize: { min: 4, max: 24, step: 2 },
  autoHideDelayMs: { min: 0, max: 1200, step: 100 },
} as const;

export const SIDEBAR_COLLAPSED_WIDTH = 64;

type NavigationSettingsState = NavigationSettings & {
  setSettings: (partial: Partial<NavigationSettings>) => void;
  resetDockSettings: () => void;
  resetSidebarSettings: () => void;
  resetSettings: () => void;
};

const DOCK_ONLY_DEFAULTS = {
  iconSize: DEFAULT_NAVIGATION_SETTINGS.iconSize,
  maxScale: DEFAULT_NAVIGATION_SETTINGS.maxScale,
  magneticDistance: DEFAULT_NAVIGATION_SETTINGS.magneticDistance,
  showLabels: DEFAULT_NAVIGATION_SETTINGS.showLabels,
} as const;

const SIDEBAR_ONLY_DEFAULTS = {
  sidebarPosition: DEFAULT_NAVIGATION_SETTINGS.sidebarPosition,
  sidebarAttach: DEFAULT_NAVIGATION_SETTINGS.sidebarAttach,
  sidebarVisibility: DEFAULT_NAVIGATION_SETTINGS.sidebarVisibility,
  sidebarWidth: DEFAULT_NAVIGATION_SETTINGS.sidebarWidth,
  sidebarCollapsed: DEFAULT_NAVIGATION_SETTINGS.sidebarCollapsed,
  sidebarRadius: DEFAULT_NAVIGATION_SETTINGS.sidebarRadius,
  sidebarOffset: DEFAULT_NAVIGATION_SETTINGS.sidebarOffset,
  autoHideEdgeSize: DEFAULT_NAVIGATION_SETTINGS.autoHideEdgeSize,
  autoHideDelayMs: DEFAULT_NAVIGATION_SETTINGS.autoHideDelayMs,
} as const;

export const useNavigationSettingsStore = create<NavigationSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_NAVIGATION_SETTINGS,

      setSettings: (partial) => set((state) => ({ ...state, ...partial })),

      resetDockSettings: () => set({ ...DOCK_ONLY_DEFAULTS }),

      resetSidebarSettings: () => set({ ...SIDEBAR_ONLY_DEFAULTS }),

      resetSettings: () => set({ ...DEFAULT_NAVIGATION_SETTINGS }),
    }),
    {
      name: 'noterx-dock-settings-v1',
      version: 3,
      migrate: (persisted) => {
        const legacy = persisted as Partial<NavigationSettings> & {
          todoIconSize?: number;
        };
        const { todoIconSize, ...rest } = legacy;

        return {
          ...DEFAULT_NAVIGATION_SETTINGS,
          ...rest,
          iconSize:
            rest.iconSize ?? todoIconSize ?? DEFAULT_NAVIGATION_SETTINGS.iconSize,
        };
      },
    }
  )
);

export function getSidebarEffectiveWidth(settings: NavigationSettings) {
  return settings.sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : settings.sidebarWidth;
}
