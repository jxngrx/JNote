'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { useClockWidgetSettingsStore } from '@/lib/clock-widget-settings-store';
import { clampFloatingClockPosition } from '@/lib/floating-clock-utils';
import {
  defaultFloatingClockPosition,
  useWorldTimeStore,
} from '@/lib/world-time-store';
import FloatingClockWidget from '@/components/floating-clock-widget';

export default function FloatingClockWidgets() {
  const mode = useAppStore((state) => state.mode);
  const clocks = useWorldTimeStore((s) => s.clocks);
  const unpinClock = useWorldTimeStore((s) => s.unpinClock);
  const updatePinPosition = useWorldTimeStore((s) => s.updatePinPosition);
  const bringPinToFront = useWorldTimeStore((s) => s.bringPinToFront);
  const collapsedWidth = useClockWidgetSettingsStore((s) => s.collapsedWidth);
  const height = useClockWidgetSettingsStore((s) => s.height);
  const [now, setNow] = useState(() => new Date());

  const pinnedClocks = useMemo(
    () => clocks.filter((clock) => clock.pinned),
    [clocks]
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    pinnedClocks.forEach((clock, index) => {
      if (typeof clock.pinX !== 'number' || typeof clock.pinY !== 'number') {
        const position = defaultFloatingClockPosition(index);
        updatePinPosition(clock.id, position.x, position.y);
        return;
      }

      const clamped = clampFloatingClockPosition(
        clock.pinX,
        clock.pinY,
        collapsedWidth,
        height
      );
      if (clamped.x !== clock.pinX || clamped.y !== clock.pinY) {
        updatePinPosition(clock.id, clamped.x, clamped.y);
      }
    });
  }, [collapsedWidth, height, pinnedClocks, updatePinPosition]);

  useEffect(() => {
    const handleResize = () => {
      pinnedClocks.forEach((clock) => {
        if (typeof clock.pinX !== 'number' || typeof clock.pinY !== 'number') {
          return;
        }

        const clamped = clampFloatingClockPosition(
          clock.pinX,
          clock.pinY,
          collapsedWidth,
          height
        );
        if (clamped.x !== clock.pinX || clamped.y !== clock.pinY) {
          updatePinPosition(clock.id, clamped.x, clamped.y);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsedWidth, height, pinnedClocks, updatePinPosition]);

  if (mode === 'world-time' || pinnedClocks.length === 0) return null;

  return (
    <div className="floating-clocks-layer" aria-label="Floating world clocks">
      {pinnedClocks.map((clock) => (
        <FloatingClockWidget
          key={clock.id}
          clock={clock}
          now={now}
          onUnpin={unpinClock}
          onPositionChange={updatePinPosition}
          onBringToFront={bringPinToFront}
        />
      ))}
    </div>
  );
}
