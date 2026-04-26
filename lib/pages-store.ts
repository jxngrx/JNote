'use client';

import { create } from 'zustand';
import { PagesStore, Page } from './types';

const STORAGE_KEY = 'sticky-pages-v1';

const generatePageId = () => `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let saveDebounceTimer: NodeJS.Timeout | null = null;

function computeAutoTitle(html: string, maxLetters = 10) {
  const withoutTags = (html || '').replace(/<[^>]*>/g, '');
  const normalized = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Keep spaces between words, but limit by letter count (A-Z).
  let letterCount = 0;
  let out = '';
  for (const ch of normalized) {
    const isLetter = /[A-Za-z]/.test(ch);
    if (isLetter) {
      if (letterCount >= maxLetters) break;
      letterCount += 1;
      out += ch;
      continue;
    }
    // Preserve single spaces only if we've started and still building the title.
    if (ch === ' ' && out && !out.endsWith(' ') && letterCount < maxLetters) {
      out += ' ';
    }
  }

  const title = out.trim();
  return title || 'Untitled';
}

export const usePagesStore = create<PagesStore>((set, get) => ({
  pages: [],
  activePageId: null,

  createPage: () => {
    const id = generatePageId();
    const newPage: Page = {
      id,
      title: 'Untitled',
      titleMode: 'auto',
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
        page.id === id
          ? {
              ...page,
              ...updates,
              titleMode:
                updates.title !== undefined
                  ? (updates.title || '').trim()
                    ? 'custom'
                    : 'auto'
                  : page.titleMode ?? 'auto',
              updatedAt: Date.now(),
            }
          : page
      ),
    }));

    // Auto-update title from content only if user didn't set a custom title
    if (updates.content !== undefined) {
      const page = get().pages.find((p) => p.id === id);
      if (page) {
        const titleMode = page.titleMode ?? 'auto';
        if (titleMode !== 'custom') {
          const newTitle = computeAutoTitle(updates.content, 10);
          if (newTitle !== page.title) {
            set((state) => ({
              pages: state.pages.map((p) =>
                p.id === id ? { ...p, title: newTitle, titleMode: 'auto' } : p
              ),
            }));
          }
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
          pages: (data.pages || []).map((p: Page) => ({
            ...p,
            titleMode: p.titleMode ?? 'auto',
          })),
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
