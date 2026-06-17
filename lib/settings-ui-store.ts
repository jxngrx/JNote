'use client';

import { create } from 'zustand';
import type { SettingsSectionInput } from '@/components/app-settings-modal';

type SettingsUiState = {
  open: boolean;
  section: SettingsSectionInput;
  openSettings: (section?: SettingsSectionInput) => void;
  closeSettings: () => void;
};

export const useSettingsUiStore = create<SettingsUiState>()((set) => ({
  open: false,
  section: 'appearance',

  openSettings: (section = 'appearance') =>
    set({ open: true, section }),

  closeSettings: () => set({ open: false }),
}));
