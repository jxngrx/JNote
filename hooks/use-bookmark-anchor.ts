'use client';

import { useEffect, useState } from 'react';

export type BookmarkAnchor = {
  x: number;
  y: number;
};

const BOOKMARK_TRIGGER_SELECTOR =
  'button.mag-dock-item[aria-label="Bookmarks"], button.app-sidebar-item[aria-label="Bookmarks"]';

export function useBookmarkAnchor(open: boolean) {
  const [anchor, setAnchor] = useState<BookmarkAnchor>({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;

    const updateAnchor = () => {
      const trigger = document.querySelector(BOOKMARK_TRIGGER_SELECTOR);
      if (!trigger) {
        setAnchor({
          x: window.innerWidth / 2,
          y: window.innerHeight - 88,
        });
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setAnchor({
        x: rect.right,
        y: rect.top,
      });
    };

    updateAnchor();
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [open]);

  return anchor;
}
