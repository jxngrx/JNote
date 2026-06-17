'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorldTimeView = 'clocks' | 'pomodoro';

type WorldTimeUiState = {
  view: WorldTimeView;
  setView: (view: WorldTimeView) => void;
};

export const useWorldTimeUiStore = create<WorldTimeUiState>()(
  persist(
    (set) => ({
      view: 'clocks',
      setView: (view) => set({ view }),
    }),
    {
      name: 'world-time-ui-v1',
      partialize: (state) => ({ view: state.view }),
    }
  )
);
