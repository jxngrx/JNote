'use client';

import { create } from 'zustand';
import { PagesStore, Page } from './types';

const STORAGE_KEY = 'sticky-pages-v1';

const generatePageId = () => `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let saveDebounceTimer: NodeJS.Timeout | null = null;

export const usePagesStore = create<PagesStore>((set, get) => ({
  pages: [],
  activePageId: null,

  createPage: () => {
    const id = generatePageId();
    const newPage: Page = {
      id,
      title: 'Untitled',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      pages: [...state.pages, newPage],
      activePageId: id,
    }));

    get().saveToStorage();
    return id;
  },

  updatePage: (id: string, updates: Partial<Page>) => {
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === id ? { ...page, ...updates, updatedAt: Date.now() } : page
      ),
    }));

    // Auto-update title from first line of content if content changed
    if (updates.content !== undefined) {
      const page = get().pages.find((p) => p.id === id);
      if (page) {
        const firstLine = updates.content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .split('\n')[0]
          .trim()
          .substring(0, 50);
        const newTitle = firstLine || 'Untitled';
        if (newTitle !== page.title) {
          set((state) => ({
            pages: state.pages.map((p) =>
              p.id === id ? { ...p, title: newTitle } : p
            ),
          }));
        }
      }
    }

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      get().saveToStorage();
    }, 200);
  },

  deletePage: (id: string) => {
    set((state) => {
      const newPages = state.pages.filter((page) => page.id !== id);
      return {
        pages: newPages,
        activePageId: state.activePageId === id
          ? newPages.length > 0
            ? newPages[0].id
            : null
          : state.activePageId,
      };
    });

    get().saveToStorage();
  },

  setActivePage: (id: string | null) => {
    set({ activePageId: id });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          pages: data.pages || [],
          activePageId: data.activePageId || null,
        });
      }
    } catch (error) {
      console.error('Failed to load pages from storage:', error);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const state = get();
      const data = {
        pages: state.pages,
        activePageId: state.activePageId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save pages to storage:', error);
    }
  },
}));
