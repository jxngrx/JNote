'use client';

/** @deprecated Use navigation-settings-store */
export {
  DEFAULT_NAVIGATION_SETTINGS as DEFAULT_DOCK_SETTINGS,
  NAVIGATION_SETTINGS_LIMITS as DOCK_SETTINGS_LIMITS,
  useNavigationSettingsStore as useDockSettingsStore,
  type NavigationSettings as DockSettings,
} from '@/lib/navigation-settings-store';
