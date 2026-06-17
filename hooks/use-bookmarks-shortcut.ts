'use client';

import { useEffect } from 'react';
import { useBookmarksUiStore } from '@/lib/bookmarks-ui-store';

export function useBookmarksShortcut() {
  const toggleBookmarks = useBookmarksUiStore((s) => s.toggleBookmarks);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') ||
        target.closest('.ProseMirror');

      if (isTyping) return;

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        toggleBookmarks();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleBookmarks]);
}
