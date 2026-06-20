'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getBookmarkFaviconUrl,
  getDefaultBookmarkTitle,
} from '@/lib/bookmark-utils';
import {
  fetchLinkPreview,
  normalizeLinkPreviewUrl,
} from '@/lib/link-preview-utils';

export const DEFAULT_CATEGORY_ID = 'category_general';

export type BookmarkCategory = {
  id: string;
  name: string;
  createdAt: number;
};

export type Bookmark = {
  id: string;
  categoryId: string;
  url: string;
  title: string;
  favicon: string;
  createdAt: number;
};

const MAX_BOOKMARKS = 32;
const MAX_CATEGORIES = 10;

const DEFAULT_CATEGORY: BookmarkCategory = {
  id: DEFAULT_CATEGORY_ID,
  name: 'General',
  createdAt: 0,
};

type BookmarksState = {
  categories: BookmarkCategory[];
  bookmarks: Bookmark[];
  selectedCategoryId: string;
  addCategory: (name: string) => { ok: true; id: string } | { ok: false; error: string };
  renameCategory: (id: string, name: string) => { ok: boolean; error?: string };
  removeCategory: (id: string) => { ok: boolean; error?: string };
  setSelectedCategoryId: (id: string) => void;
  addBookmark: (
    rawUrl: string,
    categoryId?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeBookmark: (id: string) => void;
  openBookmark: (bookmark: Bookmark) => void;
  getAllBookmarks: () => Bookmark[];
};

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      categories: [DEFAULT_CATEGORY],
      bookmarks: [],
      selectedCategoryId: DEFAULT_CATEGORY_ID,

      addCategory: (name) => {
        const normalized = normalizeCategoryName(name);
        if (!normalized) {
          return { ok: false, error: 'Category name cannot be empty.' };
        }

        if (get().categories.length >= MAX_CATEGORIES) {
          return {
            ok: false,
            error: `You can create up to ${MAX_CATEGORIES} categories.`,
          };
        }

        const duplicate = get().categories.some(
          (category) =>
            category.name.toLowerCase() === normalized.toLowerCase()
        );
        if (duplicate) {
          return { ok: false, error: 'That category already exists.' };
        }

        const category: BookmarkCategory = {
          id: generateId('category'),
          name: normalized,
          createdAt: Date.now(),
        };

        set((state) => ({
          categories: [...state.categories, category],
          selectedCategoryId: category.id,
        }));

        return { ok: true, id: category.id };
      },

      renameCategory: (id, name) => {
        const normalized = normalizeCategoryName(name);
        if (!normalized) {
          return { ok: false, error: 'Category name cannot be empty.' };
        }

        const categories = get().categories;
        const target = categories.find((category) => category.id === id);
        if (!target) {
          return { ok: false, error: 'Category not found.' };
        }

        const duplicate = categories.some(
          (category) =>
            category.id !== id &&
            category.name.toLowerCase() === normalized.toLowerCase()
        );
        if (duplicate) {
          return { ok: false, error: 'That category name is already in use.' };
        }

        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name: normalized } : category
          ),
        }));

        return { ok: true };
      },

      removeCategory: (id) => {
        if (id === DEFAULT_CATEGORY_ID) {
          return { ok: false, error: 'General category cannot be deleted.' };
        }

        const exists = get().categories.some((category) => category.id === id);
        if (!exists) {
          return { ok: false, error: 'Category not found.' };
        }

        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.categoryId === id
              ? { ...bookmark, categoryId: DEFAULT_CATEGORY_ID }
              : bookmark
          ),
          selectedCategoryId:
            state.selectedCategoryId === id
              ? DEFAULT_CATEGORY_ID
              : state.selectedCategoryId,
        }));

        return { ok: true };
      },

      setSelectedCategoryId: (id) => {
        if (!get().categories.some((category) => category.id === id)) return;
        set({ selectedCategoryId: id });
      },

      addBookmark: async (rawUrl, categoryId) => {
        const url = normalizeLinkPreviewUrl(rawUrl);
        if (!url) {
          return { ok: false, error: 'Enter a valid http or https URL.' };
        }

        const targetCategoryId =
          categoryId && get().categories.some((c) => c.id === categoryId)
            ? categoryId
            : get().selectedCategoryId;

        const existing = get().bookmarks.find(
          (item) => item.url === url && item.categoryId === targetCategoryId
        );
        if (existing) {
          return { ok: false, error: 'That site is already in this category.' };
        }

        if (get().bookmarks.length >= MAX_BOOKMARKS) {
          return {
            ok: false,
            error: `You can save up to ${MAX_BOOKMARKS} bookmarks.`,
          };
        }

        let title = getDefaultBookmarkTitle(url);
        const favicon = getBookmarkFaviconUrl(url);

        try {
          const preview = await fetchLinkPreview(url);
          title = preview.title || preview.siteName || title;
        } catch {
          // Keep hostname-based defaults when preview fetch fails.
        }

        const bookmark: Bookmark = {
          id: generateId('bookmark'),
          categoryId: targetCategoryId,
          url,
          title: title.trim() || getDefaultBookmarkTitle(url),
          favicon,
          createdAt: Date.now(),
        };

        set((state) => ({
          bookmarks: [bookmark, ...state.bookmarks],
          selectedCategoryId: targetCategoryId,
        }));

        return { ok: true };
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((item) => item.id !== id),
        }));
      },

      openBookmark: (bookmark) => {
        window.open(bookmark.url, '_blank', 'noopener,noreferrer');
      },

      getAllBookmarks: () => {
        const { categories, bookmarks } = get();
        const order = new Map(categories.map((category, index) => [category.id, index]));

        return [...bookmarks].sort((a, b) => {
          const categoryDelta =
            (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0);
          if (categoryDelta !== 0) return categoryDelta;
          return b.createdAt - a.createdAt;
        });
      },
    }),
    {
      name: 'jnote-bookmarks-v1',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<BookmarksState> & {
          bookmarks?: Array<Bookmark & { categoryId?: string }>;
        };

        if (version >= 2 && state.categories && state.bookmarks) {
          return {
            categories: state.categories,
            bookmarks: state.bookmarks.map((bookmark) => ({
              ...bookmark,
              categoryId: bookmark.categoryId ?? DEFAULT_CATEGORY_ID,
            })),
            selectedCategoryId: state.selectedCategoryId ?? DEFAULT_CATEGORY_ID,
          };
        }

        const legacyBookmarks = state.bookmarks ?? [];
        return {
          categories: [DEFAULT_CATEGORY],
          bookmarks: legacyBookmarks.map((bookmark) => ({
            ...bookmark,
            categoryId: bookmark.categoryId ?? DEFAULT_CATEGORY_ID,
          })),
          selectedCategoryId: DEFAULT_CATEGORY_ID,
        };
      },
      partialize: (state) => ({
        categories: state.categories,
        bookmarks: state.bookmarks,
        selectedCategoryId: state.selectedCategoryId,
      }),
    }
  )
);
