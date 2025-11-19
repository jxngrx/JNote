'use client';

import { useCanvasStore } from '@/lib/store';
import { useRef, useEffect } from 'react';
import { Plus, Download, Upload, Trash2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export default function Toolbar() {
  const createNote = useCanvasStore((state) => state.createNote);
  const clearAll = useCanvasStore((state) => state.clearAll);
  const exportJSON = useCanvasStore((state) => state.exportJSON);
  const importJSON = useCanvasStore((state) => state.importJSON);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const viewport = useCanvasStore((state) => state.viewport);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or contentEditable
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable ||
                       target.closest('[contenteditable="true"]');

      if (isTyping) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExport();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        handleImport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateNote = () => {
    const centerX = window.innerWidth / 2 - viewport.translateX;
    const centerY = window.innerHeight / 2 - viewport.translateY;
    createNote(centerX / viewport.scale, centerY / viewport.scale);
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sticky-notes-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      importJSON(json);
    };
    reader.readAsText(file);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 0.8;
    setViewport({
      ...viewport,
      scale: Math.max(0.1, Math.min(5, viewport.scale * factor)),
    });
  };

  const handleResetView = () => {
    setViewport({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  };

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-2 px-4 py-3 rounded-full backdrop-blur-2xl border border-white/10 z-[100]"
      role="toolbar"
      aria-label="Canvas controls"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <button
        onClick={handleCreateNote}
        className="toolbar-icon-btn group"
        title="New note"
        aria-label="Create new note"
      >
        <Plus size={18} />
      </button>

      <div className="w-px bg-white/20" />

      <button
        onClick={() => handleZoom('in')}
        className="toolbar-icon-btn"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} />
      </button>

      <button
        onClick={() => handleZoom('out')}
        className="toolbar-icon-btn"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} />
      </button>

      <button
        onClick={handleResetView}
        className="toolbar-icon-btn"
        title="Reset view"
        aria-label="Reset view"
      >
        <RotateCcw size={18} />
      </button>

      <div className="w-px bg-white/20" />

      <button
        onClick={handleExport}
        className="toolbar-icon-btn"
        title="Export as JSON (Ctrl+S)"
        aria-label="Export notes"
      >
        <Download size={18} />
      </button>

      <button
        onClick={handleImport}
        className="toolbar-icon-btn"
        title="Import JSON (Ctrl+I)"
        aria-label="Import notes"
      >
        <Upload size={18} />
      </button>

      <button
        onClick={() => {
          clearAll();
          handleResetView();
        }}
        className="toolbar-icon-btn hover:bg-red-500/20"
        title="Clear all notes"
        aria-label="Clear all notes"
      >
        <Trash2 size={18} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Import file"
      />
    </div>
  );
}
