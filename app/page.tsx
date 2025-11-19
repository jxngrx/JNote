'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/lib/store';
import { useAppStore } from '@/lib/app-store';
import { usePagesStore } from '@/lib/pages-store';
import Canvas from '@/components/canvas';
import Toolbar from '@/components/toolbar';
import Sidebar from '@/components/sidebar';
import PagesMode from '@/components/pages-mode';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const loadAppMode = useAppStore((state) => state.loadFromStorage);
  const loadFromStorage = useCanvasStore((state) => state.loadFromStorage);
  const loadPagesFromStorage = usePagesStore((state) => state.loadFromStorage);

  useEffect(() => {
    setIsClient(true);
    loadAppMode();
    loadFromStorage();
    loadPagesFromStorage();
  }, [loadAppMode, loadFromStorage, loadPagesFromStorage]);

  // Keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea/contentEditable
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable ||
                       target.closest('[contenteditable="true"]');

      if (isTyping) return;

      // Super+Shift+S for Sticky Notes
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setMode('sticky-notes');
      }

      // Super+Shift+P for Pages
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setMode('pages');
      }

      // Ctrl+N for new page (only in Pages mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && mode === 'pages') {
        e.preventDefault();
        const createPage = usePagesStore.getState().createPage;
        const setActivePage = usePagesStore.getState().setActivePage;
        const newId = createPage();
        setActivePage(newId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  if (!isClient) {
    return null; // Prevents hydration mismatch
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className={`content-area ${mode === 'pages' ? 'pages-mode' : 'sticky-notes-mode'}`}>
        {mode === 'sticky-notes' ? (
          <>
            <Canvas />
            <Toolbar />
          </>
        ) : (
          <PagesMode />
        )}
      </main>
    </div>
  );
}
