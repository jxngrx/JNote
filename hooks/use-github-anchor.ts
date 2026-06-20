'use client';

import { useEffect, useState } from 'react';

export type GithubAnchor = {
  x: number;
  y: number;
};

const GITHUB_TRIGGER_SELECTOR =
  'button.mag-dock-item[aria-label="GitHub"], button.app-sidebar-item[aria-label="GitHub"]';

export function useGithubAnchor(open: boolean) {
  const [anchor, setAnchor] = useState<GithubAnchor>({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;

    const updateAnchor = () => {
      const trigger = document.querySelector(GITHUB_TRIGGER_SELECTOR);
      if (!trigger) {
        setAnchor({
          x: window.innerWidth / 2,
          y: window.innerHeight - 88,
        });
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setAnchor({
        x: rect.left + rect.width / 2,
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
