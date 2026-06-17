'use client';

import { create } from 'zustand';

type GithubUiState = {
  open: boolean;
  pinned: boolean;
  toggleGithub: () => void;
  openGithub: () => void;
  closeGithub: () => void;
  setPinned: (pinned: boolean) => void;
};

export const useGithubUiStore = create<GithubUiState>()((set) => ({
  open: false,
  pinned: false,

  toggleGithub: () =>
    set((state) => {
      const nextOpen = !state.open;
      return { open: nextOpen, pinned: nextOpen };
    }),

  openGithub: () => set({ open: true }),

  closeGithub: () => set({ open: false, pinned: false }),

  setPinned: (pinned) => set({ pinned }),
}));
