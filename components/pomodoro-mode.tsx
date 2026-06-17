'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Pause, Play, RotateCcw, Settings } from 'lucide-react';
import { getPomodoroFontFamily } from '@/lib/pomodoro-fonts';
import { triggerPomodoroCelebration } from '@/lib/pomodoro-celebration';
import { usePomodoroSettingsStore } from '@/lib/pomodoro-settings-store';
import { useSettingsUiStore } from '@/lib/settings-ui-store';
import {
  DurationWheelPicker,
  type DurationWheelPickerRef,
  durationToMs,
  msToDuration,
} from '@/components/pomodoro/duration-wheel-picker';
import './pomodoro-mode.css';

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

const PHASE_EASE = [0.4, 0, 0.2, 1] as const;

const phaseVariants = {
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -22, scale: 0.96 },
};

const chamberVariants = {
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

function formatTime(totalMs: number): string {
  const { hours, minutes, seconds } = msToDuration(totalMs);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PomodoroMode() {
  const settings = usePomodoroSettingsStore();
  const openSettings = useSettingsUiStore((s) => s.openSettings);
  const prefersReducedMotion = useReducedMotion();

  const initial = useMemo(
    () => msToDuration(settings.defaultMinutes * 60_000),
    [settings.defaultMinutes]
  );

  const [durationParts, setDurationParts] = useState(initial);
  const [durationMs, setDurationMs] = useState(() =>
    durationToMs(initial)
  );
  const [remainingMs, setRemainingMs] = useState(() => durationToMs(initial));
  const [status, setStatus] = useState<TimerStatus>('idle');
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const celebratedRef = useRef(false);
  const wheelRef = useRef<DurationWheelPickerRef>(null);

  const fontFamily = getPomodoroFontFamily(settings.fontFamily);
  const progress = durationMs > 0 ? 1 - remainingMs / durationMs : 0;
  const isSetup = status === 'idle';

  const phaseTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: PHASE_EASE };

  const timerStyle = useMemo(
    () =>
      ({
        '--pomodoro-font': fontFamily,
        '--pomodoro-display-size': `${settings.displaySizePx}px`,
        '--pomodoro-label-size': `${settings.labelSizePx}px`,
        '--pomodoro-weight': settings.fontWeight,
        '--pomodoro-spacing': `${settings.letterSpacingEm}em`,
        '--pomodoro-text': settings.textColor ?? 'var(--text-primary)',
        '--pomodoro-progress': progress,
      }) as React.CSSProperties,
    [
      fontFamily,
      settings.displaySizePx,
      settings.labelSizePx,
      settings.fontWeight,
      settings.letterSpacingEm,
      settings.textColor,
      progress,
    ]
  );

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const applyDuration = useCallback(
    (parts: { hours: number; minutes: number; seconds: number }) => {
      const ms = durationToMs(parts);
      setDurationParts(parts);
      setDurationMs(ms);
      setRemainingMs(ms);
      setStatus('idle');
      endAtRef.current = null;
      celebratedRef.current = false;
      clearTick();
    },
    [clearTick]
  );

  const handleDurationChange = useCallback(
    (parts: { hours: number; minutes: number; seconds: number }) => {
      const ms = durationToMs(parts);
      setDurationParts(parts);
      setDurationMs(ms);
      setRemainingMs(ms);
    },
    []
  );

  const commitWheelDuration = useCallback(() => {
    const parts = wheelRef.current?.commit() ?? durationParts;
    const ms = durationToMs(parts);
    setDurationParts(parts);
    setDurationMs(ms);
    setRemainingMs(ms);
    return { parts, ms };
  }, [durationParts]);

  useEffect(() => {
    if (status !== 'running') return;

    tickRef.current = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const next = endAt - Date.now();
      if (next <= 0) {
        setRemainingMs(0);
        setStatus('completed');
        endAtRef.current = null;
        clearTick();
        return;
      }
      setRemainingMs(next);
    }, 200);

    return clearTick;
  }, [status, clearTick]);

  useEffect(() => {
    if (status === 'completed' && !celebratedRef.current) {
      celebratedRef.current = true;
      triggerPomodoroCelebration();
    }
  }, [status]);

  useEffect(() => () => clearTick(), [clearTick]);

  const handleStart = () => {
    if (status === 'completed' || status === 'idle') {
      const { ms } =
        status === 'idle' ? commitWheelDuration() : { ms: durationMs };
      if (ms < 1000) return;
      setDurationMs(ms);
      setRemainingMs(ms);
      endAtRef.current = Date.now() + ms;
      celebratedRef.current = false;
      setStatus('running');
      return;
    }
    if (status === 'paused') {
      endAtRef.current = Date.now() + remainingMs;
      setStatus('running');
    }
  };

  const handleStop = () => {
    if (status !== 'running') return;
    clearTick();
    endAtRef.current = null;
    setStatus('paused');
  };

  const handleReset = () => {
    applyDuration(durationParts);
  };

  const statusLabel =
    status === 'running'
      ? 'In focus'
      : status === 'paused'
        ? 'Paused'
        : status === 'completed'
          ? 'Session complete'
          : 'Ready';

  const primaryLabel =
    status === 'running'
      ? 'Stop'
      : status === 'paused'
        ? 'Resume'
        : status === 'completed'
          ? 'Start again'
          : 'Start focus';

  return (
    <div className="pomodoro-root" data-status={status} style={timerStyle}>
      <div className="pomodoro-shell">
        <header className="pomodoro-header app-readable-panel">
          <div className="pomodoro-header-copy">
            <p className="pomodoro-eyebrow">JNote · Focus</p>
            <h1 className="pomodoro-title">Pomodoro</h1>
          </div>
          <button
            type="button"
            className="pomodoro-customize-btn"
            onClick={() => openSettings('pomodoro')}
            aria-label="Pomodoro settings"
          >
            <Settings size={15} />
            <span>Customize</span>
          </button>
        </header>

        <section className="pomodoro-stage" aria-label="Focus timer">
          <AnimatePresence mode="wait" initial={false}>
            {isSetup ? (
              <motion.div
                key="setup"
                className="pomodoro-setup"
                variants={phaseVariants}
                initial={prefersReducedMotion ? false : 'initial'}
                animate="animate"
                exit={prefersReducedMotion ? undefined : 'exit'}
                transition={phaseTransition}
              >
                <motion.p
                  className="pomodoro-duration-label"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...phaseTransition, delay: prefersReducedMotion ? 0 : 0.06 }}
                >
                  Set duration
                </motion.p>

                <motion.div
                  className="pomodoro-duration"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...phaseTransition, delay: prefersReducedMotion ? 0 : 0.1 }}
                >
                  <DurationWheelPicker
                    ref={wheelRef}
                    hours={durationParts.hours}
                    minutes={durationParts.minutes}
                    seconds={durationParts.seconds}
                    onChange={handleDurationChange}
                  />
                </motion.div>

                <motion.div
                  className="pomodoro-controls pomodoro-controls--setup"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...phaseTransition, delay: prefersReducedMotion ? 0 : 0.16 }}
                >
                  <button
                    type="button"
                    className="pomodoro-btn pomodoro-btn--primary"
                    onClick={handleStart}
                    disabled={durationMs < 1000}
                  >
                    <Play size={16} />
                    Start focus
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="focus"
                className="pomodoro-focus"
                variants={phaseVariants}
                initial={prefersReducedMotion ? false : 'initial'}
                animate="animate"
                exit={prefersReducedMotion ? undefined : 'exit'}
                transition={phaseTransition}
              >
                <motion.div
                  className="pomodoro-chamber"
                  variants={chamberVariants}
                  initial={prefersReducedMotion ? false : 'initial'}
                  animate="animate"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.45, ease: PHASE_EASE, delay: 0.08 }
                  }
                >
                  {settings.showProgressRing && (
                    <svg className="pomodoro-ring" viewBox="0 0 120 120" aria-hidden>
                      <circle className="pomodoro-ring-track" cx="60" cy="60" r="52" />
                      <circle
                        className="pomodoro-ring-fill"
                        cx="60"
                        cy="60"
                        r="52"
                        pathLength={1}
                        style={{ strokeDashoffset: 1 - progress }}
                      />
                    </svg>
                  )}

                  <div className="pomodoro-chamber-core">
                    <p
                      className={`pomodoro-status${status === 'running' ? ' is-active' : ''}${status === 'completed' ? ' is-complete' : ''}`}
                    >
                      {statusLabel}
                    </p>
                    <time
                      className={`pomodoro-display${settings.fontStyle === 'italic' ? ' is-italic' : ''}`}
                      dateTime={`PT${Math.ceil(remainingMs / 1000)}S`}
                    >
                      {formatTime(remainingMs)}
                    </time>
                    <p className="pomodoro-hint">
                      {status === 'completed'
                        ? 'Well done — take a breath, then start again'
                        : status === 'paused'
                          ? 'Paused — resume when you are ready'
                          : 'Deep work starts with a single second'}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="pomodoro-controls pomodoro-controls--focus"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.32, ease: PHASE_EASE, delay: 0.2 }
                  }
                >
                  {status === 'running' ? (
                    <button
                      type="button"
                      className="pomodoro-btn pomodoro-btn--primary"
                      onClick={handleStop}
                    >
                      <Pause size={16} />
                      {primaryLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pomodoro-btn pomodoro-btn--primary"
                      onClick={handleStart}
                    >
                      <Play size={16} />
                      {primaryLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="pomodoro-btn pomodoro-btn--ghost"
                    onClick={handleReset}
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
