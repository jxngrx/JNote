export interface TextStyle {
  color: string;
  fontSize: 'small' | 'medium' | 'large';
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  textDecoration: 'none' | 'underline';
}

export interface Viewport {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  content: string;
  textStyle: TextStyle;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface CanvasState {
  notes: StickyNote[];
  viewport: Viewport;
  selectedNoteId: string | null;
  lastId: string;
}

export interface CanvasStore extends CanvasState {
  // Note operations
  createNote: (x: number, y: number, color?: string) => string;
  updateNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => void;

  // Viewport operations
  setViewport: (viewport: Viewport) => void;
  setSelectedNote: (id: string | null) => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
  clearAll: () => void;

  // Export/Import
  exportJSON: () => string;
  importJSON: (json: string) => void;
}

// Pages Mode Types
export type AppMode = 'sticky-notes' | 'pages' | 'area' | 'todo' | 'world-time';

export interface Page {
  id: string;
  title: string;
  titleMode?: 'auto' | 'custom';
  content: string; // HTML content
  createdAt: number;
  updatedAt: number;
}

export interface PagesState {
  pages: Page[];
  activePageId: string | null;
}

export interface PagesStore extends PagesState {
  createPage: () => string;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  setActivePage: (id: string | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// Global App State
export interface AppState {
  mode: AppMode;
  lastMode: AppMode;
}

export interface AppStore extends AppState {
  setMode: (mode: AppMode) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// Area Mode Types
export interface SceneData {
  excalidraw: {
    elements: any[];
    appState?: any;
    files?: Record<string, any>;
  } | null;
}

export interface Scene {
  id: string;
  title: string;
  data: SceneData;
  createdAt: number;
  updatedAt: number;
}

export interface AreaState {
  scenes: Scene[];
  activeSceneId: string | null;
}

export interface AreaStore extends AreaState {
  createScene: () => string;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  setActiveScene: (id: string | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => void;
}
