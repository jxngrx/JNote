'use client';

import { create } from 'zustand';
import { PagesStore, Page, PageContentJson } from './types';
import { extractPlainTextFromJson } from './pages-migrate';

const STORAGE_KEY = 'sticky-pages-v1';

const EMPTY_DOC: PageContentJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const generatePageId = () => `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let saveDebounceTimer: NodeJS.Timeout | null = null;

function computeAutoTitle(text: string, maxLetters = 10) {
  const firstLineRaw =
    text
      .replace(/\u00a0/g, ' ')
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .find((l) => l.length > 0) ?? '';

  let letterCount = 0;
  let out = '';
  for (const ch of firstLineRaw) {
    const isLetter = /[A-Za-z]/.test(ch);
    if (isLetter) {
      if (letterCount >= maxLetters) break;
      letterCount += 1;
      out += ch;
      continue;
    }
    if (ch === ' ' && out && !out.endsWith(' ') && letterCount < maxLetters) {
      out += ' ';
    }
  }

  const title = out.trim();
  return title || 'Untitled';
}

function normalizePageMeta(page: Page): Page {
  return {
    ...page,
    titleMode: page.titleMode ?? 'auto',
    width: page.width ?? 'narrow',
    fontFamily: page.fontFamily ?? 'default',
    icon: page.icon ?? null,
  };
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
      contentJson: EMPTY_DOC,
      width: 'narrow',
      fontFamily: 'default',
      icon: null,
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
      pages: state.pages.map((page) => {
        if (page.id !== id) return page;

        const next: Page = {
          ...page,
          ...updates,
          updatedAt: Date.now(),
        };

        if (updates.title !== undefined) {
          next.titleMode = (updates.title || '').trim() ? 'custom' : 'auto';
        }

        if (updates.contentJson !== undefined && updates.contentJson) {
          next.contentJson = updates.contentJson;
        }

        return next;
      }),
    }));

    if (updates.contentJson !== undefined) {
      const page = get().pages.find((p) => p.id === id);
      if (page && (page.titleMode ?? 'auto') !== 'custom') {
        const plain = extractPlainTextFromJson(updates.contentJson ?? page.contentJson);
        const newTitle = computeAutoTitle(plain, 10);
        if (newTitle !== page.title) {
          set((state) => ({
            pages: state.pages.map((p) =>
              p.id === id ? { ...p, title: newTitle, titleMode: 'auto' } : p
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
        activePageId:
          state.activePageId === id
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
        const pages = (data.pages || []).map((p: Page) => normalizePageMeta(p));
        set({
          pages,
          activePageId: data.activePageId || pages[0]?.id || null,
        });
      }

      if (get().pages.length === 0) {
        get().createPage();
      }
    } catch (error) {
      console.error('Failed to load pages from storage:', error);
      if (get().pages.length === 0) {
        get().createPage();
      }
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
