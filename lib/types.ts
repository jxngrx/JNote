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
