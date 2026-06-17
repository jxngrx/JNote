'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { WorldClock } from '@/lib/world-time-store';
import {
  formatClockDate,
  formatClockTime,
  getTimezoneDayProgressView,
  getTimezoneMonthProgress,
  getTimezoneYearProgress,
  type FocusPeriod,
  type TimeIntervalMinutes,
} from '@/lib/country-timezones';
import { Button } from '@/components/ui/button';
import { computeFocusDotLayout } from '@/lib/focus-dot-layout';
import './clock-focus-view.css';

type ClockFocusViewProps = {
  clocks: WorldClock[];
  activeClockId: string;
  onActiveChange: (id: string) => void;
  onClose: () => void;
};

const PERIOD_OPTIONS: { id: FocusPeriod; label: string }[] = [
  { id: 'day', label: 'Time' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const INTERVAL_OPTIONS: { id: TimeIntervalMinutes; label: string }[] = [
  { id: 1, label: '1 Min' },
  { id: 10, label: '10 Min' },
  { id: 30, label: '30 Min' },
];

type DotState = 'empty' | 'full' | 'partial';

type FocusDotProps = {
  state: DotState;
  fraction?: number;
};

function FocusDot({ state, fraction = 0 }: FocusDotProps) {
  const sweepDeg = Math.min(360, Math.max(0, fraction * 360));

  return (
    <span
      className={`wt-focus-dot${state === 'full' ? ' filled' : ''}${state === 'partial' ? ' partial' : ''}`}
    >
      {state === 'partial' ? (
        <span
          className="wt-focus-dot-sweep"
          style={{
            background: `conic-gradient(from -90deg, var(--orange) 0deg, var(--orange) ${sweepDeg}deg, transparent ${sweepDeg}deg, transparent 360deg)`,
          }}
        />
      ) : null}
    </span>
  );
}

type FocusMiniCardProps = {
  clock: WorldClock;
  index: number;
  now: Date;
  onSelect: () => void;
};

function FocusMiniCard({ clock, index, now, onSelect }: FocusMiniCardProps) {
  const time = formatClockTime(clock.timezone, now);
  const date = formatClockDate(clock.timezone, now);
  const meta = clock.zoneLabel ? `${clock.zoneLabel} · ${date}` : date;

  return (
    <motion.button
      type="button"
      className="wt-focus-mini"
      onClick={onSelect}
      aria-label={`Show ${clock.countryName} clock`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.24,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="wt-focus-mini-country">{clock.countryName}</span>
      <time className="wt-focus-mini-time">{time}</time>
      <span className="wt-focus-mini-meta">{meta}</span>
    </motion.button>
  );
}

function getDotState(
  index: number,
  completedDots: number,
  hasActiveDot: boolean
): DotState {
  if (index < completedDots) return 'full';
  if (index === completedDots && hasActiveDot) return 'partial';
  return 'empty';
}

export function ClockFocusView({
  clocks,
  activeClockId,
  onActiveChange,
  onClose,
}: ClockFocusViewProps) {
  const [now, setNow] = useState(() => new Date());
  const [period, setPeriod] = useState<FocusPeriod>('day');
  const [timeInterval, setTimeInterval] = useState<TimeIntervalMinutes>(10);
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dotLayout, setDotLayout] = useState(() =>
    computeFocusDotLayout(12, 144, 480, 200)
  );
  const dotsWrapRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeClock = clocks.find((c) => c.id === activeClockId) ?? clocks[0];
  const otherClocks = clocks.filter((c) => c.id !== activeClock?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tickMs = period === 'day' ? 100 : 1000;
    const id = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(id);
  }, [period]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const progress = useMemo(() => {
    if (!activeClock) return null;
    if (period === 'month') {
      return getTimezoneMonthProgress(activeClock.timezone, now);
    }
    if (period === 'year') {
      return getTimezoneYearProgress(activeClock.timezone, now);
    }
    return getTimezoneDayProgressView(
      activeClock.timezone,
      now,
      timeInterval
    );
  }, [activeClock, now, period, timeInterval]);

  const dotColumns = progress?.dotColumns ?? 12;
  const dotCount = progress?.dotCount ?? 144;

  useLayoutEffect(() => {
    const el = dotsWrapRef.current;
    if (!el || !progress) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 8 || height < 8) return;
      setDotLayout(computeFocusDotLayout(dotColumns, dotCount, width, height));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [dotColumns, dotCount, progress, period, timeInterval]);

  if (!activeClock || !progress) return null;

  const time = formatClockTime(activeClock.timezone, now);
  const title = activeClock.zoneLabel
    ? `${activeClock.countryName} · ${activeClock.zoneLabel}`
    : activeClock.countryName;

  const isDayView = period === 'day';
  const dayProgress = isDayView
    ? getTimezoneDayProgressView(activeClock.timezone, now, timeInterval)
    : null;

  const handleSelect = (id: string) => {
    if (id === activeClockId) return;
    setPoppingId(id);
    onActiveChange(id);
    window.setTimeout(() => setPoppingId(null), 500);
  };

  const spring = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 32 };

  const dotGridStyle = {
    '--wt-focus-dot-cols': dotColumns,
    '--wt-focus-dot-size': `${dotLayout.size}px`,
    '--wt-focus-dot-gap': `${dotLayout.gap}px`,
  } as React.CSSProperties;

  const content = (
    <motion.div
      className="wt-focus"
      role="dialog"
      aria-modal="true"
      aria-label={`Focus view for ${title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="wt-focus-scrim" aria-hidden />

      <div className="wt-focus-inner">
        <div className="wt-focus-toolbar">
          <Button variant="ghost" size="sm" onClick={onClose} className="wt-focus-back">
            <ArrowLeft size={15} />
            Back
          </Button>

          <div
            className="wt-focus-period"
            role="tablist"
            aria-label="Progress period"
          >
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={period === option.id}
                className={`wt-focus-period-btn${period === option.id ? ' active' : ''}`}
                onClick={() => setPeriod(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="wt-focus-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeClock.id}-${period}-${timeInterval}`}
              className="wt-focus-hero"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.98, y: 10 }
              }
              animate={
                poppingId === activeClock.id
                  ? { opacity: 1, scale: [0.98, 1.01, 1], y: 0 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.01, y: -6 }
              }
              transition={spring}
            >
              <div className="wt-focus-body">
                <header className="wt-focus-head">
                  <p className="wt-focus-eyebrow">{progress.subtitle}</p>
                  <time className="wt-focus-time" dateTime={now.toISOString()}>
                    {time}
                  </time>
                  <h2 className="wt-focus-title">{title}</h2>
                </header>

                {isDayView ? (
                  <div
                    className="wt-focus-interval"
                    role="tablist"
                    aria-label="Time interval"
                  >
                    {INTERVAL_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="tab"
                        aria-selected={timeInterval === option.id}
                        className={`wt-focus-interval-btn${timeInterval === option.id ? ' active' : ''}`}
                        onClick={() => setTimeInterval(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="wt-focus-stats">
                  <div className="wt-focus-stat">
                    <span className="wt-focus-stat-value">{progress.elapsed}</span>
                    <span className="wt-focus-stat-label">
                      {progress.statLabels[0]}
                    </span>
                  </div>
                  <div className="wt-focus-stat-divider" aria-hidden />
                  <div className="wt-focus-stat">
                    <span className="wt-focus-stat-value">{progress.remaining}</span>
                    <span className="wt-focus-stat-label">
                      {progress.statLabels[1]}
                    </span>
                  </div>
                  <div className="wt-focus-stat-divider" aria-hidden />
                  <div className="wt-focus-stat">
                    <span className="wt-focus-stat-value">{progress.pct}%</span>
                    <span className="wt-focus-stat-label">
                      {progress.statLabels[2]}
                    </span>
                  </div>
                </div>

                <div className="wt-focus-progress" aria-hidden>
                  <motion.div
                    className="wt-focus-progress-fill"
                    initial={false}
                    animate={{ scaleX: progress.pct / 100 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>

                <div className="wt-focus-dots-wrap" ref={dotsWrapRef}>
                  <div
                    className={`wt-focus-dots wt-focus-dots--${period}${isDayView ? ` wt-focus-dots--interval-${timeInterval}` : ''}`}
                    style={dotGridStyle}
                    aria-label={`${progress.pct}% through the ${period} in ${title}`}
                  >
                    {isDayView && dayProgress ? (
                      Array.from({ length: dayProgress.dotCount }, (_, i) => {
                        const state = getDotState(
                          i,
                          dayProgress.completedDots,
                          dayProgress.hasActiveDot
                        );
                        return (
                          <FocusDot
                            key={i}
                            state={state}
                            fraction={dayProgress.activeDotFraction}
                          />
                        );
                      })
                    ) : (
                      Array.from({ length: progress.dotCount }, (_, i) => (
                        <FocusDot
                          key={i}
                          state={
                            i <
                            ('filledDots' in progress ? progress.filledDots : 0)
                              ? 'full'
                              : 'empty'
                          }
                        />
                      ))
                    )}
                  </div>
                </div>

                <p className="wt-focus-footer">{progress.footer}</p>
              </div>

              {otherClocks.length > 0 && (
                <aside className="wt-focus-zones" aria-label="Other clocks">
                  <p className="wt-focus-zones-label">Other zones</p>
                  <div className="wt-focus-zones-row">
                    {otherClocks.map((clock, index) => (
                      <FocusMiniCard
                        key={clock.id}
                        clock={clock}
                        index={index}
                        now={now}
                        onSelect={() => handleSelect(clock.id)}
                      />
                    ))}
                  </div>
                </aside>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}
