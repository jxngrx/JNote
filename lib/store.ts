'use client';

import { create } from 'zustand';
import { CanvasStore, StickyNote, Viewport, TextStyle } from './types';

const STORAGE_KEY = 'sticky-canvas-v2';

const DEFAULT_VIEWPORT: Viewport = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const DEFAULT_TEXT_STYLE: TextStyle = {
  color: '#1a1a1a',
  fontSize: 'medium',
  fontWeight: 'normal',
  textAlign: 'left',
  textDecoration: 'none',
};

const createInitialNote = (id: string, x: number, y: number): StickyNote => ({
  id,
  x,
  y,
  width: 320,
  height: 210,
  zIndex: 1,
  color: '#FFF59D',
  content: '',
  textStyle: { ...DEFAULT_TEXT_STYLE },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: false,
});

const generateNoteId = () => `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let saveDebounceTimer: NodeJS.Timeout | null = null;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  notes: [],
  viewport: DEFAULT_VIEWPORT,
  selectedNoteId: null,
  lastId: '',

  createNote: (x: number, y: number, color?: string) => {
    const id = generateNoteId();
    const note = createInitialNote(id, x, y);
    if (color) note.color = color;

    set((state) => ({
      notes: [...state.notes, note],
      lastId: id,
      selectedNoteId: id,
    }));

    get().saveToStorage();
    return id;
  },

  updateNote: (id: string, updates: Partial<StickyNote>) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      ),
    }));

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      get().saveToStorage();
    }, 200);
  },

  deleteNote: (id: string) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }));

    get().saveToStorage();
  },

  duplicateNote: (id: string) => {
    const state = get();
    const noteToClone = state.notes.find((n) => n.id === id);

    if (!noteToClone) return;

    const newId = generateNoteId();
    const newNote: StickyNote = {
      ...noteToClone,
      id: newId,
      x: noteToClone.x + 24,
      y: noteToClone.y + 24,
      zIndex: Math.max(...state.notes.map((n) => n.zIndex), 0) + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      notes: [...state.notes, newNote],
      lastId: newId,
      selectedNoteId: newId,
    }));

    get().saveToStorage();
  },

  setViewport: (viewport: Viewport) => {
    set({ viewport });
  },

  setSelectedNote: (id: string | null) => {
    set({ selectedNoteId: id });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const notes = (data.notes || []).map((note: any) => ({
          ...note,
          textStyle: note.textStyle || { ...DEFAULT_TEXT_STYLE },
        }));
        set({
          notes,
          viewport: data.viewport || DEFAULT_VIEWPORT,
          lastId: data.meta?.lastId || '',
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const state = get();
      const data = {
        notes: state.notes,
        viewport: state.viewport,
        meta: { lastId: state.lastId, savedAt: Date.now() },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },

  clearAll: () => {
    set({
      notes: [],
      viewport: DEFAULT_VIEWPORT,
      selectedNoteId: null,
      lastId: '',
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  exportJSON: () => {
    const state = get();
    return JSON.stringify({
      notes: state.notes,
      viewport: state.viewport,
      meta: { lastId: state.lastId, exportedAt: Date.now() },
    });
  },

  importJSON: (json: string) => {
    try {
      const data = JSON.parse(json);
      set({
        notes: data.notes || [],
        viewport: data.viewport || DEFAULT_VIEWPORT,
        lastId: data.meta?.lastId || '',
      });
      get().saveToStorage();
    } catch (error) {
      console.error('Failed to import JSON:', error);
      alert('Invalid JSON format');
    }
  },
}));
