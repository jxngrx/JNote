'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTimezoneOptionLabel } from '@/lib/country-timezones';
import { DEFAULT_CLOCK_WIDGET_SETTINGS } from '@/lib/clock-widget-settings-store';
import { clampFloatingClockPosition } from '@/lib/floating-clock-utils';

const FLOATING_CLOCK_GAP = 10;

export const MAX_WORLD_CLOCKS = 6;

export interface WorldClock {
  id: string;
  countryId: string;
  countryName: string;
  timezone: string;
  zoneLabel: string;
  createdAt: number;
  pinned?: boolean;
  pinX?: number;
  pinY?: number;
  pinZIndex?: number;
}

export const FLOATING_CLOCK_BASE_Z = 10100;

export function defaultFloatingClockPosition(pinnedIndex: number) {
  const { collapsedWidth, height } = DEFAULT_CLOCK_WIDGET_SETTINGS;
  const y = 12 + pinnedIndex * (height + FLOATING_CLOCK_GAP);

  if (typeof window === 'undefined') {
    return clampFloatingClockPosition(100, y, collapsedWidth, height);
  }

  const x = window.innerWidth - collapsedWidth - 12;
  return clampFloatingClockPosition(x, y, collapsedWidth, height);
}

interface WorldTimeStore {
  clocks: WorldClock[];
  addClock: (
    countryId: string,
    countryName: string,
    timezone: string
  ) => boolean;
  removeClock: (id: string) => void;
  togglePin: (id: string) => void;
  unpinClock: (id: string) => void;
  updatePinPosition: (id: string, x: number, y: number) => void;
  bringPinToFront: (id: string) => void;
  resetPinnedClockPositions: () => void;
  hasClock: (countryId: string, timezone: string) => boolean;
  canAddMore: () => boolean;
}

const generateId = () =>
  `clock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useWorldTimeStore = create<WorldTimeStore>()(
  persist(
    (set, get) => ({
      clocks: [],

      addClock: (countryId, countryName, timezone) => {
        const { clocks } = get();
        if (clocks.length >= MAX_WORLD_CLOCKS) return false;
        if (clocks.some((c) => c.countryId === countryId && c.timezone === timezone)) {
          return false;
        }

        const newClock: WorldClock = {
          id: generateId(),
          countryId,
          countryName,
          timezone,
          zoneLabel: getTimezoneOptionLabel(countryId, timezone),
          createdAt: Date.now(),
        };

        set({ clocks: [...clocks, newClock] });
        return true;
      },

      removeClock: (id) => {
        set((state) => ({
          clocks: state.clocks.filter((c) => c.id !== id),
        }));
      },

      togglePin: (id) => {
        set((state) => {
          const pinnedOthers = state.clocks.filter(
            (clock) => clock.pinned && clock.id !== id
          );
          const maxZ = Math.max(
            FLOATING_CLOCK_BASE_Z,
            ...state.clocks.map((clock) => clock.pinZIndex ?? FLOATING_CLOCK_BASE_Z)
          );

          return {
            clocks: state.clocks.map((clock) => {
              if (clock.id !== id) return clock;

              if (clock.pinned) {
                return { ...clock, pinned: false };
              }

              const hasPosition =
                typeof clock.pinX === 'number' && typeof clock.pinY === 'number';
              const position = hasPosition
                ? { pinX: clock.pinX!, pinY: clock.pinY! }
                : (() => {
                    const next = defaultFloatingClockPosition(pinnedOthers.length);
                    return { pinX: next.x, pinY: next.y };
                  })();

              return {
                ...clock,
                pinned: true,
                pinX: position.pinX,
                pinY: position.pinY,
                pinZIndex: maxZ + 1,
              };
            }),
          };
        });
      },

      unpinClock: (id) => {
        set((state) => ({
          clocks: state.clocks.map((clock) =>
            clock.id === id ? { ...clock, pinned: false } : clock
          ),
        }));
      },

      updatePinPosition: (id, x, y) => {
        set((state) => ({
          clocks: state.clocks.map((clock) =>
            clock.id === id ? { ...clock, pinX: x, pinY: y } : clock
          ),
        }));
      },

      bringPinToFront: (id) => {
        set((state) => {
          const maxZ = Math.max(
            FLOATING_CLOCK_BASE_Z,
            ...state.clocks.map((clock) => clock.pinZIndex ?? FLOATING_CLOCK_BASE_Z)
          );

          return {
            clocks: state.clocks.map((clock) =>
              clock.id === id ? { ...clock, pinZIndex: maxZ + 1 } : clock
            ),
          };
        });
      },

      resetPinnedClockPositions: () => {
        set((state) => {
          let pinnedIndex = 0;

          return {
            clocks: state.clocks.map((clock) => {
              if (!clock.pinned) return clock;

              const position = defaultFloatingClockPosition(pinnedIndex);
              pinnedIndex += 1;

              return {
                ...clock,
                pinX: position.x,
                pinY: position.y,
                pinZIndex: FLOATING_CLOCK_BASE_Z + pinnedIndex,
              };
            }),
          };
        });
      },

      hasClock: (countryId, timezone) => {
        return get().clocks.some(
          (c) => c.countryId === countryId && c.timezone === timezone
        );
      },

      canAddMore: () => get().clocks.length < MAX_WORLD_CLOCKS,
    }),
    {
      name: 'world-time-clocks-v1',
      partialize: (state) => ({ clocks: state.clocks }),
      migrate: (persisted) => {
        const state = persisted as { clocks?: WorldClock[] };
        if (!state?.clocks) return state;
        return {
          clocks: state.clocks.map((c) => ({
            ...c,
            zoneLabel:
              c.zoneLabel ??
              getTimezoneOptionLabel(c.countryId, c.timezone),
            pinned: c.pinned ?? false,
            pinX: c.pinX,
            pinY: c.pinY,
            pinZIndex: c.pinZIndex ?? FLOATING_CLOCK_BASE_Z,
          })),
        };
      },
    }
  )
);
