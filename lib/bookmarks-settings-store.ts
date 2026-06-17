'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BookmarkStackLayout = 'grid' | 'fan';

export const DEFAULT_BOOKMARKS_SETTINGS = {
  layout: 'fan' as BookmarkStackLayout,
};

type BookmarksSettingsState = {
  layout: BookmarkStackLayout;
  setLayout: (layout: BookmarkStackLayout) => void;
  resetSettings: () => void;
};

export const useBookmarksSettingsStore = create<BookmarksSettingsState>()(
  persist(
    (set) => ({
      layout: DEFAULT_BOOKMARKS_SETTINGS.layout,

      setLayout: (layout) => set({ layout }),

      resetSettings: () => set({ ...DEFAULT_BOOKMARKS_SETTINGS }),
    }),
    {
      name: 'jnote-bookmarks-settings-v1',
    }
  )
);
