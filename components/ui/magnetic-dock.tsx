'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

import './magnetic-dock.css';

const SPRING: SpringOptions = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
};

export type MagneticDockItemData = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
  badge?: number;
  isSub?: boolean;
  reorderable?: boolean;
  reorderId?: string;
};

export type MagneticDockSeparator = {
  type: 'separator';
  id: string;
};

export type MagneticDockEntry = MagneticDockItemData | MagneticDockSeparator;

export type MagneticDockProps = {
  items: MagneticDockEntry[];
  iconSize?: number;
  maxScale?: number;
  magneticDistance?: number;
  showLabels?: boolean;
  className?: string;
  onReorder?: (orderedIds: string[]) => void;
};

const REORDER_DRAG_THRESHOLD = 6;

type DockMetrics = {
  iconSize: number;
  maxScale: number;
  magneticDistance: number;
  gap: number;
  gapHover: number;
};

function useDockMetrics(
  iconSize: number,
  maxScale: number,
  magneticDistance: number
): DockMetrics {
  const [metrics, setMetrics] = useState<DockMetrics>({
    iconSize,
    maxScale,
    magneticDistance,
    gap: 6,
    gapHover: 16,
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) {
        setMetrics({
          iconSize: 34,
          maxScale: 1.32,
          magneticDistance: 58,
          gap: 4,
          gapHover: 11,
        });
      } else if (w < 640) {
        setMetrics({
          iconSize: 38,
          maxScale: 1.38,
          magneticDistance: 68,
          gap: 5,
          gapHover: 13,
        });
      } else {
        setMetrics({
          iconSize,
          maxScale,
          magneticDistance,
          gap: 6,
          gapHover: 16,
        });
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [iconSize, maxScale, magneticDistance]);

  return metrics;
}

function isSeparator(entry: MagneticDockEntry): entry is MagneticDockSeparator {
  return 'type' in entry && entry.type === 'separator';
}

function getReorderId(item: MagneticDockItemData) {
  return item.reorderId ?? item.id;
}

function moveReorderId(ids: string[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ids;

  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function getReorderShiftX(
  itemIndex: number,
  dragIndex: number,
  hoverIndex: number,
  step: number
) {
  if (dragIndex < 0 || hoverIndex < 0 || dragIndex === hoverIndex) return 0;

  if (dragIndex < hoverIndex) {
    if (itemIndex > dragIndex && itemIndex <= hoverIndex) {
      return -step;
    }
    return 0;
  }

  if (itemIndex >= hoverIndex && itemIndex < dragIndex) {
    return step;
  }

  return 0;
}

type MagneticDockItemProps = {
  item: MagneticDockItemData;
  mouseX: MotionValue<number>;
  iconSize: number;
  maxScale: number;
  magneticDistance: number;
  showLabels: boolean;
  slotRef?: (node: HTMLDivElement | null) => void;
  slotShiftX?: number;
  isReorderDragging?: boolean;
  reorderTranslateX?: number;
  disableMagnetic?: boolean;
  onReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onReorderPointerMove?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onReorderPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

function MagneticDockTooltip({
  visible,
  label,
  anchorRef,
}: {
  visible: boolean;
  label: string;
  anchorRef: RefObject<HTMLButtonElement | null>;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!visible || !anchor) return;

    const update = () => {
      const rect = anchor.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    let frame = 0;
    const loop = () => {
      update();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.cancelAnimationFrame(frame);
    };
  }, [visible, anchorRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mag-dock-tooltip"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.94 }}
          transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
          role="tooltip"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function MagneticDockItem({
  item,
  mouseX,
  iconSize,
  maxScale,
  magneticDistance,
  showLabels,
  slotRef,
  slotShiftX = 0,
  isReorderDragging = false,
  reorderTranslateX = 0,
  disableMagnetic = false,
  onReorderPointerDown,
  onReorderPointerMove,
  onReorderPointerUp,
}: MagneticDockItemProps) {
  const localSlotRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const slot = localSlotRef.current;
    if (!slot || !Number.isFinite(val) || disableMagnetic) {
      return magneticDistance + 1;
    }
    const rect = slot.getBoundingClientRect();
    return val - (rect.left + rect.width / 2);
  });

  const scale = useTransform(
    distance,
    [-magneticDistance, 0, magneticDistance],
    [1, maxScale, 1]
  );
  const smoothScale = useSpring(scale, SPRING);

  const lift = useTransform(smoothScale, (s) => (s - 1) * -iconSize * 0.22);
  const smoothLift = useSpring(lift, SPRING);

  const showTooltip =
    showLabels && isHovered && !isReorderDragging && !disableMagnetic;
  const useMagneticMotion = !isReorderDragging && !disableMagnetic;

  return (
    <div
      ref={(node) => {
        localSlotRef.current = node;
        slotRef?.(node);
      }}
      className={cn(
        'mag-dock-slot',
        disableMagnetic && 'is-reorder-shifting'
      )}
      style={{
        width: iconSize,
        height: iconSize,
        transform:
          slotShiftX !== 0 ? `translateX(${slotShiftX}px)` : undefined,
      }}
    >
      <motion.button
        ref={itemRef}
        type="button"
        onClick={item.onClick}
        onContextMenu={(event) => {
          if (!item.onContextMenu) return;
          event.preventDefault();
          item.onContextMenu(event);
        }}
        onPointerDown={onReorderPointerDown}
        onPointerMove={onReorderPointerMove}
        onPointerUp={onReorderPointerUp}
        onPointerCancel={onReorderPointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label={item.label}
        className={cn(
          'mag-dock-item',
          item.isActive && 'is-active',
          item.isSub && 'is-sub',
          isHovered && 'is-hot',
          isReorderDragging && 'is-reorder-dragging'
        )}
        style={{
          width: iconSize,
          height: iconSize,
          y: useMagneticMotion ? smoothLift : 0,
          scale: useMagneticMotion ? smoothScale : 1.06,
          x: isReorderDragging ? reorderTranslateX : 0,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="mag-dock-item-inner">
          <div className="mag-dock-item-icon">{item.icon}</div>
          <div className="mag-dock-item-shine" aria-hidden />
        </div>

        <AnimatePresence>
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              className="mag-dock-item-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {item.isActive && (
            <motion.span
              className="mag-dock-item-dot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        <MagneticDockTooltip
          visible={showTooltip}
          label={item.label}
          anchorRef={itemRef}
        />
      </motion.button>
    </div>
  );
}

export default function MagneticDock({
  items,
  iconSize = 44,
  maxScale = 1.42,
  magneticDistance = 72,
  showLabels = true,
  className,
  onReorder,
}: MagneticDockProps) {
  const mousePosition = useMotionValue(Infinity);
  const [isHovered, setIsHovered] = useState(false);
  const [reorderDrag, setReorderDrag] = useState<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    translateX: number;
    hoverIndex: number;
    moved: boolean;
  } | null>(null);
  const [suppressClickId, setSuppressClickId] = useState<string | null>(null);
  const slotRefs = useRef(new Map<string, HTMLDivElement>());
  const metrics = useDockMetrics(iconSize, maxScale, magneticDistance);

  const baseReorderIds = useMemo(
    () =>
      items
        .filter(
          (entry): entry is MagneticDockItemData =>
            !isSeparator(entry) && Boolean(entry.reorderable)
        )
        .map(getReorderId),
    [items]
  );

  const isReordering = Boolean(reorderDrag?.moved);
  const dragIndex = reorderDrag
    ? baseReorderIds.indexOf(reorderDrag.id)
    : -1;
  const hoverIndex = reorderDrag?.hoverIndex ?? dragIndex;
  const reorderStep = metrics.iconSize + metrics.gap;

  const getHoverIndex = useCallback(
    (clientX: number, order: string[]) => {
      const slots = order
        .map((id) => {
          const node = slotRefs.current.get(id);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { id, centerX: rect.left + rect.width / 2 };
        })
        .filter((slot): slot is { id: string; centerX: number } => Boolean(slot));

      if (slots.length === 0) return 0;
      if (slots.length === 1) return 0;

      for (let index = 0; index < slots.length - 1; index += 1) {
        const midpoint =
          (slots[index].centerX + slots[index + 1].centerX) / 2;
        if (clientX < midpoint) {
          return index;
        }
      }

      return slots.length - 1;
    },
    []
  );

  const handleReorderPointerDown = useCallback(
    (item: MagneticDockItemData, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!item.reorderable || !onReorder) return;

      setSuppressClickId(null);
      const dragId = getReorderId(item);
      const startIndex = baseReorderIds.indexOf(dragId);

      mousePosition.set(Infinity);
      setReorderDrag({
        id: dragId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        translateX: 0,
        hoverIndex: startIndex >= 0 ? startIndex : 0,
        moved: false,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [baseReorderIds, mousePosition, onReorder]
  );

  const handleReorderPointerMove = useCallback(
    (item: MagneticDockItemData, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!reorderDrag || reorderDrag.id !== getReorderId(item)) return;

      const deltaX = event.clientX - reorderDrag.startX;
      const deltaY = event.clientY - reorderDrag.startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (!reorderDrag.moved && distance < REORDER_DRAG_THRESHOLD) {
        return;
      }

      const nextHoverIndex = getHoverIndex(event.clientX, baseReorderIds);

      setReorderDrag((current) =>
        current
          ? {
              ...current,
              moved: true,
              translateX: deltaX,
              hoverIndex: nextHoverIndex,
            }
          : current
      );
    },
    [baseReorderIds, getHoverIndex, reorderDrag]
  );

  const finishReorderDrag = useCallback(
    (item: MagneticDockItemData, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!reorderDrag || reorderDrag.id !== getReorderId(item)) return;

      if (reorderDrag.moved && onReorder) {
        const fromIndex = baseReorderIds.indexOf(reorderDrag.id);
        const nextOrder =
          fromIndex >= 0
            ? moveReorderId(baseReorderIds, fromIndex, reorderDrag.hoverIndex)
            : baseReorderIds;

        onReorder(nextOrder);
        setSuppressClickId(reorderDrag.id);
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setReorderDrag(null);
    },
    [baseReorderIds, onReorder, reorderDrag]
  );

  const lift = Math.max(
    0,
    Math.round(metrics.iconSize * (metrics.maxScale - 1) * 0.55)
  );

  const handleMouseMove = useCallback(
    (clientX: number) => {
      mousePosition.set(clientX);
    },
    [mousePosition]
  );

  const handleMouseLeave = useCallback(() => {
    mousePosition.set(Infinity);
    setIsHovered(false);
  }, [mousePosition]);

  const dockStyle = useMemo(
    () =>
      ({
        '--mag-icon-size': `${metrics.iconSize}px`,
        '--mag-dock-lift': `${lift}px`,
        '--mag-dock-edge': `${Math.max(8, Math.round(lift * 0.75))}px`,
        '--mag-dock-pad-y-hover': `${Math.max(12, Math.round(lift * 0.45) + 8)}px`,
        '--mag-dock-pad-x-hover': `${Math.max(14, Math.round(lift * 0.5) + 10)}px`,
        '--mag-dock-gap': `${metrics.gap}px`,
        '--mag-dock-gap-hover': `${metrics.gapHover}px`,
      }) as React.CSSProperties,
    [metrics, lift]
  );

  return (
    <div className="mag-dock-shell">
      <motion.div
        className={cn(
          'mag-dock',
          isHovered && 'is-hovered',
          isReordering && 'is-reordering',
          className
        )}
        style={dockStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={(e) => {
          if (!isReordering) handleMouseMove(e.clientX);
        }}
        onMouseLeave={handleMouseLeave}
        role="toolbar"
        aria-label="Application dock"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
      >
        {items.map((entry) => {
          if (isSeparator(entry)) {
            return (
              <div
                key={entry.id}
                className="mag-dock-separator"
                aria-hidden
              />
            );
          }

          const reorderId = getReorderId(entry);
          const reorderIndex = entry.reorderable
            ? baseReorderIds.indexOf(reorderId)
            : -1;
          const slotShiftX =
            isReordering && reorderIndex >= 0 && dragIndex >= 0
              ? getReorderShiftX(
                  reorderIndex,
                  dragIndex,
                  hoverIndex,
                  reorderStep
                )
              : 0;

          const item =
            suppressClickId === reorderId
              ? {
                  ...entry,
                  onClick: () => {
                    setSuppressClickId(null);
                  },
                }
              : entry;

          return (
            <MagneticDockItem
              key={entry.id}
              item={item}
              mouseX={mousePosition}
              iconSize={metrics.iconSize}
              maxScale={metrics.maxScale}
              magneticDistance={metrics.magneticDistance}
              showLabels={showLabels}
              slotRef={(node) => {
                if (entry.reorderable) {
                  if (node) slotRefs.current.set(reorderId, node);
                  else slotRefs.current.delete(reorderId);
                }
              }}
              slotShiftX={slotShiftX}
              disableMagnetic={isReordering}
              isReorderDragging={reorderDrag?.id === reorderId && reorderDrag.moved}
              reorderTranslateX={
                reorderDrag?.id === reorderId && reorderDrag.moved
                  ? reorderDrag.translateX
                  : 0
              }
              onReorderPointerDown={
                entry.reorderable && onReorder
                  ? (event) => handleReorderPointerDown(entry, event)
                  : undefined
              }
              onReorderPointerMove={
                entry.reorderable && onReorder
                  ? (event) => handleReorderPointerMove(entry, event)
                  : undefined
              }
              onReorderPointerUp={
                entry.reorderable && onReorder
                  ? (event) => finishReorderDrag(entry, event)
                  : undefined
              }
            />
          );
        })}
      </motion.div>
    </div>
  );
}
