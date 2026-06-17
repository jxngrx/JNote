'use client';

import { useEffect } from 'react';
import { useNavigationSettingsStore } from '@/lib/navigation-settings-store';

/** Dock is a floating overlay — no layout inset reserved. */
export function useNavigationInsets() {
  const chrome = useNavigationSettingsStore((s) => s.chrome);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nav-inset-bottom', '0px');
    root.style.setProperty(
      '--mag-dock-float-offset',
      chrome === 'dock'
        ? 'calc(12px + env(safe-area-inset-bottom, 0px) + 72px + 14px)'
        : '0px'
    );

    return () => {
      root.style.removeProperty('--nav-inset-bottom');
      root.style.removeProperty('--mag-dock-float-offset');
    };
  }, [chrome]);
}
