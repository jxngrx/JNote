'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/app-store';
import MagneticDock from '@/components/ui/magnetic-dock';
import { useNavigationSettingsStore } from '@/lib/navigation-settings-store';
import type { MagneticDockEntry } from '@/components/ui/magnetic-dock';

type AppDockProps = {
  items: MagneticDockEntry[];
  onReorder?: (orderedIds: string[]) => void;
};

export default function AppDock({ items, onReorder }: AppDockProps) {
  const mode = useAppStore((state) => state.mode);
  const navSettings = useNavigationSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`mag-dock-wrap${mode === 'todo' ? ' mag-dock-wrap--todo' : ''}`}
    >
      <MagneticDock
        items={items}
        iconSize={navSettings.iconSize}
        maxScale={navSettings.maxScale}
        magneticDistance={navSettings.magneticDistance}
        showLabels={navSettings.showLabels}
        className={mode === 'todo' ? 'mag-dock--todo' : undefined}
        onReorder={onReorder}
      />
    </div>,
    document.body
  );
}
