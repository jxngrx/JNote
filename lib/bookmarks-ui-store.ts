'use client';

import { create } from 'zustand';

type BookmarksUiState = {
  open: boolean;
  toggleBookmarks: () => void;
  openBookmarks: () => void;
  closeBookmarks: () => void;
};

export const useBookmarksUiStore = create<BookmarksUiState>()((set) => ({
  open: false,

  toggleBookmarks: () => set((state) => ({ open: !state.open })),

  openBookmarks: () => set({ open: true }),

  closeBookmarks: () => set({ open: false }),
}));
