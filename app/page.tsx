'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/lib/store';
import { useAppStore } from '@/lib/app-store';
import { usePagesStore } from '@/lib/pages-store';
import { useAreaStore } from '@/lib/area-store';
import { useTodoStore } from '@/lib/todo-store';
import Canvas from '@/components/canvas';
import Toolbar from '@/components/toolbar';
import Sidebar from '@/components/sidebar';
import PagesMode from '@/components/pages-mode';
import AreaMode from '@/components/area-mode';
import TodoMode from '@/components/todo-mode';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const loadAppMode = useAppStore((state) => state.loadFromStorage);
  const loadFromStorage = useCanvasStore((state) => state.loadFromStorage);
  const loadPagesFromStorage = usePagesStore((state) => state.loadFromStorage);
  const loadAreaFromStorage = useAreaStore((state) => state.loadFromStorage);
  const loadTodoFromStorage = useTodoStore((state) => state.loadFromStorage);

  useEffect(() => {
    setIsClient(true);
    loadAppMode();
    loadFromStorage();
    loadPagesFromStorage();
    loadAreaFromStorage();
    loadTodoFromStorage();
  }, [loadAppMode, loadFromStorage, loadPagesFromStorage, loadAreaFromStorage, loadTodoFromStorage]);

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

      // Super+Shift+A for Area
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setMode('area');
      }

      // Super+Shift+T for Todo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setMode('todo');
      }

      // Ctrl+N for new page/scene
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        if (mode === 'pages') {
          e.preventDefault();
          const createPage = usePagesStore.getState().createPage;
          const setActivePage = usePagesStore.getState().setActivePage;
          const newId = createPage();
          setActivePage(newId);
        } else if (mode === 'area') {
          e.preventDefault();
          const createScene = useAreaStore.getState().createScene;
          const setActiveScene = useAreaStore.getState().setActiveScene;
          const newId = createScene();
          setActiveScene(newId);
        }
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
      <main className={`content-area ${mode === 'pages' ? 'pages-mode' : mode === 'area' ? 'area-mode' : mode === 'todo' ? 'todo-mode' : 'sticky-notes-mode'}`}>
        {mode === 'sticky-notes' ? (
          <>
            <Canvas />
            <Toolbar />
          </>
        ) : mode === 'pages' ? (
          <PagesMode />
        ) : mode === 'area' ? (
          <AreaMode />
        ) : (
          <TodoMode />
        )}
      </main>
    </div>
  );
}
