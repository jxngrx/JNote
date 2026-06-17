'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorldTimeStore, MAX_WORLD_CLOCKS } from '@/lib/world-time-store';
import { useWorldTimeUiStore } from '@/lib/world-time-ui-store';
import { ClockCard } from '@/components/world-time/clock-card';
import { ClockFocusView } from '@/components/world-time/clock-focus-view';
import { AddClockDialog } from '@/components/world-time/add-clock-dialog';
import PomodoroMode from '@/components/pomodoro-mode';

export default function WorldTimeMode() {
  const view = useWorldTimeUiStore((s) => s.view);
  const clocks = useWorldTimeStore((s) => s.clocks);
  const addClock = useWorldTimeStore((s) => s.addClock);
  const removeClock = useWorldTimeStore((s) => s.removeClock);
  const togglePin = useWorldTimeStore((s) => s.togglePin);
  const canAddMore = useWorldTimeStore((s) => s.canAddMore);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [focusClockId, setFocusClockId] = useState<string | null>(null);

  const slotsRemaining = MAX_WORLD_CLOCKS - clocks.length;

  const handleRemove = (id: string) => {
    removeClock(id);
    if (focusClockId === id) setFocusClockId(null);
  };

  if (view === 'pomodoro') {
    return <PomodoroMode />;
  }

  return (
    <>
      <div className={`wt-root${focusClockId ? ' is-focus-open' : ''}`}>
        <div className="wt-shell">
          <header className="wt-header app-readable-panel">
            <div>
              <p className="page-label">JNote · World</p>
              <h1 className="page-title">
                <strong>World</strong> Clock
              </h1>
              <p className="page-subtitle">
                Up to {MAX_WORLD_CLOCKS} zones — drag the globe to pick a country
              </p>
            </div>
            <Button
              variant="primary"
              disabled={!canAddMore()}
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={16} strokeWidth={2} />
              Add clock
            </Button>
          </header>

          {clocks.length === 0 ? (
            <section className="wt-empty">
              <div className="wt-empty-icon" aria-hidden>
                <Globe2 size={28} strokeWidth={1.5} />
              </div>
              <h2 className="wt-empty-title">No clocks yet</h2>
              <p className="wt-empty-desc">
                Spin the 3D globe, tap a country, and pin its live time here.
              </p>
              <Button variant="ghost" size="lg" onClick={() => setDialogOpen(true)}>
                <Plus size={16} strokeWidth={2} />
                Add your first clock
              </Button>
            </section>
          ) : (
            <section
              className="wt-clock-grid"
              aria-label={`${clocks.length} world clocks`}
            >
              {clocks.map((clock, index) => (
                <ClockCard
                  key={clock.id}
                  clock={clock}
                  index={index}
                  onRemove={handleRemove}
                  onFocus={setFocusClockId}
                  onTogglePin={togglePin}
                />
              ))}
              {canAddMore() && (
                <button
                  type="button"
                  className="wt-clock-add-slot"
                  onClick={() => setDialogOpen(true)}
                  aria-label="Add another clock"
                >
                  <Plus size={20} strokeWidth={1.75} />
                  <span>Add clock</span>
                  <span className="wt-clock-add-count">
                    {slotsRemaining} remaining
                  </span>
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {focusClockId && clocks.length > 0 && (
          <ClockFocusView
            clocks={clocks}
            activeClockId={focusClockId}
            onActiveChange={setFocusClockId}
            onClose={() => setFocusClockId(null)}
          />
        )}
      </AnimatePresence>

      <AddClockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={(payload) =>
          addClock(payload.countryId, payload.countryName, payload.timezone)
        }
        existingClocks={clocks.map((c) => ({
          countryId: c.countryId,
          countryName: c.countryName,
          timezone: c.timezone,
        }))}
        slotsRemaining={slotsRemaining}
      />
    </>
  );
}
