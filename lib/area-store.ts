'use client';

import { create } from 'zustand';
import { AreaStore, Scene, SceneData } from './types';

const STORAGE_KEY = 'sticky-area-v1';

const generateSceneId = () => `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createEmptySceneData = (): SceneData => ({
  excalidraw: null,
});

let saveDebounceTimer: NodeJS.Timeout | null = null;

export const useAreaStore = create<AreaStore>((set, get) => ({
  scenes: [],
  activeSceneId: null,

  createScene: () => {
    const id = generateSceneId();
    const newScene: Scene = {
      id,
      title: 'Untitled Scene',
      data: createEmptySceneData(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      scenes: [...state.scenes, newScene],
      activeSceneId: id,
    }));

    get().saveToStorage();
    return id;
  },

  updateScene: (id: string, updates: Partial<Scene>) => {
    set((state) => ({
      scenes: state.scenes.map((scene) =>
        scene.id === id ? { ...scene, ...updates, updatedAt: Date.now() } : scene
      ),
    }));

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      get().saveToStorage();
    }, 200);
  },

  deleteScene: (id: string) => {
    set((state) => {
      const newScenes = state.scenes.filter((scene) => scene.id !== id);
      return {
        scenes: newScenes,
        activeSceneId: state.activeSceneId === id
          ? newScenes.length > 0
            ? newScenes[0].id
            : null
          : state.activeSceneId,
      };
    });

    get().saveToStorage();
  },

  setActiveScene: (id: string | null) => {
    set({ activeSceneId: id });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          scenes: data.scenes || [],
          activeSceneId: data.activeSceneId || null,
        });
      }
    } catch (error) {
      console.error('Failed to load area scenes from storage:', error);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const state = get();
      const data = {
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save area scenes to storage:', error);
    }
  },

  exportJSON: () => {
    const state = get();
    return JSON.stringify({
      scenes: state.scenes,
      activeSceneId: state.activeSceneId,
      exportedAt: Date.now(),
    });
  },

  importJSON: (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
      const activeSceneId = typeof parsed.activeSceneId === 'string' ? parsed.activeSceneId : null;
      set({ scenes, activeSceneId });
      get().saveToStorage();
    } catch (error) {
      console.error('Failed to import area scenes:', error);
      throw error;
    }
  },
}));
