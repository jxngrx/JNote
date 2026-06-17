'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, PinOff } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { WorldClock } from '@/lib/world-time-store';
import { FLOATING_CLOCK_BASE_Z } from '@/lib/world-time-store';
import {
  clockWidgetSettingsToStyle,
  getClockWidgetExpandedWidth,
  useClockWidgetSettingsStore,
} from '@/lib/clock-widget-settings-store';
import {
  clampFloatingClockPosition,
  getFloatingClockCityLabel,
} from '@/lib/floating-clock-utils';
import { formatClockTime } from '@/lib/country-timezones';

const widgetTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

const actionsTransition = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 36,
};

const ACTION_RAIL_WIDTH = 34;

function getExpandOffset(
  isExpanded: boolean,
  collapsedWidth: number,
  expandedWidth: number
) {
  return isExpanded ? expandedWidth - collapsedWidth : 0;
}

function getDisplayPosition(
  x: number,
  y: number,
  isExpanded: boolean,
  collapsedWidth: number,
  expandedWidth: number,
  height: number
) {
  const width = isExpanded ? expandedWidth : collapsedWidth;
  const offset = getExpandOffset(isExpanded, collapsedWidth, expandedWidth);

  return clampFloatingClockPosition(x - offset, y, width, height);
}

function collapsedAnchorFromDisplay(
  displayX: number,
  y: number,
  collapsedWidth: number,
  expandedWidth: number,
  height: number
) {
  const offset = expandedWidth - collapsedWidth;
  const collapsedX = displayX + offset;

  return clampFloatingClockPosition(collapsedX, y, collapsedWidth, height);
}

type FloatingClockWidgetProps = {
  clock: WorldClock;
  now: Date;
  onUnpin: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
};

export default function FloatingClockWidget({
  clock,
  now,
  onUnpin,
  onPositionChange,
  onBringToFront,
}: FloatingClockWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({
    x: clock.pinX ?? 100,
    y: clock.pinY ?? 60,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const widgetSettings = useClockWidgetSettingsStore();
  const { collapsedWidth, height, borderRadius, showSeconds } = widgetSettings;
  const expandedWidth = getClockWidgetExpandedWidth(collapsedWidth);

  const x = clock.pinX ?? positionRef.current.x;
  const y = clock.pinY ?? positionRef.current.y;
  const zIndex = clock.pinZIndex ?? FLOATING_CLOCK_BASE_Z;
  const isExpanded = isHovered || isDragging;
  const displayPosition = getDisplayPosition(
    x,
    y,
    isExpanded,
    collapsedWidth,
    expandedWidth,
    height
  );
  const cityLabel = getFloatingClockCityLabel(clock);
  const widgetStyle = clockWidgetSettingsToStyle(widgetSettings);

  const getWidgetSize = useCallback(() => {
    const el = widgetRef.current;
    if (el) {
      return { width: el.offsetWidth, height: el.offsetHeight };
    }

    return {
      width: isExpanded ? expandedWidth : collapsedWidth,
      height,
    };
  }, [collapsedWidth, expandedWidth, height, isExpanded]);

  useEffect(() => {
    if (!isDragging) {
      positionRef.current = { x, y };
      if (widgetRef.current) {
        widgetRef.current.style.transform = '';
      }
    }
  }, [x, y, isDragging]);

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      onBringToFront(clock.id);
      dragStartRef.current = { x: clientX, y: clientY };
      positionRef.current = { x, y };
      setIsDragging(true);
    },
    [clock.id, onBringToFront, x, y]
  );

  const handleDragPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      startDrag(event.clientX, event.clientY);
      widgetRef.current?.setPointerCapture(event.pointerId);
    },
    [startDrag]
  );

  useEffect(() => {
    if (!isDragging) return;

    const dragStartDisplay = getDisplayPosition(
      positionRef.current.x,
      positionRef.current.y,
      true,
      collapsedWidth,
      expandedWidth,
      height
    );

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;
      const { height: widgetHeight } = getWidgetSize();
      const clamped = clampFloatingClockPosition(
        dragStartDisplay.x + deltaX,
        dragStartDisplay.y + deltaY,
        expandedWidth,
        widgetHeight
      );

      if (widgetRef.current) {
        widgetRef.current.style.transform = `translate(${clamped.x - dragStartDisplay.x}px, ${clamped.y - dragStartDisplay.y}px)`;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;
      const { height: widgetHeight } = getWidgetSize();
      const nextDisplay = clampFloatingClockPosition(
        dragStartDisplay.x + deltaX,
        dragStartDisplay.y + deltaY,
        expandedWidth,
        widgetHeight
      );
      const next = collapsedAnchorFromDisplay(
        nextDisplay.x,
        nextDisplay.y,
        collapsedWidth,
        expandedWidth,
        height
      );

      onPositionChange(clock.id, next.x, next.y);
      setIsDragging(false);
      widgetRef.current?.releasePointerCapture(event.pointerId);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    clock.id,
    collapsedWidth,
    expandedWidth,
    getWidgetSize,
    height,
    isDragging,
    onPositionChange,
  ]);

  return (
    <motion.div
      ref={widgetRef}
      className={`floating-clock-widget${isDragging ? ' is-dragging' : ''}${isExpanded ? ' is-expanded' : ''}`}
      style={{
        zIndex,
        ...widgetStyle,
        minHeight: height,
        borderRadius,
      }}
      initial={false}
      animate={{
        left: displayPosition.x,
        top: displayPosition.y,
        width: isExpanded ? expandedWidth : collapsedWidth,
        boxShadow: isExpanded ? 'var(--shadow-lg)' : 'var(--shadow-md)',
      }}
      transition={prefersReducedMotion ? { duration: 0 } : widgetTransition}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovered(false);
      }}
      onTouchStart={() => setIsHovered(true)}
      onPointerDown={() => onBringToFront(clock.id)}
    >
      <motion.div
        className="floating-clock-actions"
        initial={false}
        animate={{
          width: isExpanded ? ACTION_RAIL_WIDTH : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : actionsTransition}
      >
        <button
          type="button"
          className="floating-clock-action floating-clock-drag"
          onPointerDown={handleDragPointerDown}
          aria-label={`Drag ${cityLabel} clock`}
          tabIndex={isExpanded ? 0 : -1}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="floating-clock-action floating-clock-unpin"
          onClick={() => onUnpin(clock.id)}
          aria-label={`Unpin ${cityLabel}`}
          tabIndex={isExpanded ? 0 : -1}
        >
          <PinOff size={13} strokeWidth={2} />
        </button>
      </motion.div>

      <div className="floating-clock-body">
        <time className="floating-clock-time" dateTime={now.toISOString()}>
          {formatClockTime(clock.timezone, now, showSeconds)}
        </time>
        <span className="floating-clock-city">{cityLabel}</span>
      </div>
    </motion.div>
  );
}
