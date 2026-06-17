'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export const WHEEL_ITEM_HEIGHT = 44;
export const WHEEL_WINDOW_HEIGHT = 220;
export const WHEEL_EDGE_PAD =
  (WHEEL_WINDOW_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

type WheelColumnProps = {
  label: string;
  values: number[];
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  columnRef?: (api: WheelColumnApi | null) => void;
};

export type WheelColumnApi = {
  getValue: () => number;
  commit: () => number;
};

function WheelColumn({
  label,
  values,
  value,
  disabled,
  onChange,
  columnRef,
}: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const indexFromScrollTop = useCallback(
    (scrollTop: number) => {
      const index = Math.round(scrollTop / WHEEL_ITEM_HEIGHT);
      return Math.min(Math.max(index, 0), values.length - 1);
    },
    [values]
  );

  const readScrollValue = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return valueRef.current;
    return values[indexFromScrollTop(el.scrollTop)] ?? valueRef.current;
  }, [indexFromScrollTop, values]);

  const scrollToIndex = useCallback(
    (index: number, smooth = true) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.min(Math.max(index, 0), values.length - 1);
      el.scrollTo({
        top: clamped * WHEEL_ITEM_HEIGHT,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
    [values]
  );

  const commitScroll = useCallback(() => {
    const next = readScrollValue();
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
    scrollToIndex(values.indexOf(next), false);
    return next;
  }, [onChange, readScrollValue, scrollToIndex, values]);

  useEffect(() => {
    if (!columnRef) return;
    columnRef({
      getValue: readScrollValue,
      commit: commitScroll,
    });
    return () => columnRef(null);
  }, [columnRef, commitScroll, readScrollValue]);

  useEffect(() => {
    const index = values.indexOf(value);
    if (index >= 0) scrollToIndex(index, false);
  }, [value, values, scrollToIndex]);

  const handleScroll = () => {
    if (disabled || !scrollRef.current) return;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(commitScroll, 80);
  };

  return (
    <div className="pomodoro-wheel-col">
      <div className="pomodoro-wheel-window" aria-hidden>
        <div className="pomodoro-wheel-highlight" />
      </div>
      <div
        ref={scrollRef}
        className="pomodoro-wheel-scroll"
        onScroll={handleScroll}
        aria-label={`${label} picker`}
      >
        <div className="pomodoro-wheel-pad" aria-hidden />
        {values.map((v) => (
          <button
            key={v}
            type="button"
            className={`pomodoro-wheel-item${v === value ? ' is-selected' : ''}`}
            disabled={disabled}
            onClick={() => {
              valueRef.current = v;
              onChange(v);
              scrollToIndex(v);
            }}
          >
            {String(v).padStart(2, '0')}
          </button>
        ))}
        <div className="pomodoro-wheel-pad" aria-hidden />
      </div>
      <span className="pomodoro-wheel-label">{label}</span>
    </div>
  );
}

export type DurationWheelPickerRef = {
  commit: () => { hours: number; minutes: number; seconds: number };
};

type DurationWheelPickerProps = {
  hours: number;
  minutes: number;
  seconds: number;
  disabled?: boolean;
  onChange: (next: { hours: number; minutes: number; seconds: number }) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

export const DurationWheelPicker = forwardRef<
  DurationWheelPickerRef,
  DurationWheelPickerProps
>(function DurationWheelPicker(
  { hours, minutes, seconds, disabled, onChange },
  ref
) {
  const hoursApi = useRef<WheelColumnApi | null>(null);
  const minutesApi = useRef<WheelColumnApi | null>(null);
  const secondsApi = useRef<WheelColumnApi | null>(null);

  const commit = useCallback(() => {
    const nextHours = hoursApi.current?.commit() ?? hours;
    const nextMinutes = minutesApi.current?.commit() ?? minutes;
    const nextSeconds = secondsApi.current?.commit() ?? seconds;
    const next = {
      hours: nextHours,
      minutes: nextMinutes,
      seconds: nextSeconds,
    };
    onChange(next);
    return next;
  }, [hours, minutes, onChange, seconds]);

  useImperativeHandle(ref, () => ({ commit }), [commit]);

  return (
    <div className="pomodoro-wheel" role="group" aria-label="Duration picker">
      <WheelColumn
        label="Hours"
        values={HOURS}
        value={hours}
        disabled={disabled}
        columnRef={(api) => {
          hoursApi.current = api;
        }}
        onChange={(h) => onChange({ hours: h, minutes, seconds })}
      />
      <span className="pomodoro-wheel-sep" aria-hidden>
        :
      </span>
      <WheelColumn
        label="Minutes"
        values={MINUTES}
        value={minutes}
        disabled={disabled}
        columnRef={(api) => {
          minutesApi.current = api;
        }}
        onChange={(m) => onChange({ hours, minutes: m, seconds })}
      />
      <span className="pomodoro-wheel-sep" aria-hidden>
        :
      </span>
      <WheelColumn
        label="Seconds"
        values={SECONDS}
        value={seconds}
        disabled={disabled}
        columnRef={(api) => {
          secondsApi.current = api;
        }}
        onChange={(s) => onChange({ hours, minutes, seconds: s })}
      />
    </div>
  );
});

export function durationToMs({
  hours,
  minutes,
  seconds,
}: {
  hours: number;
  minutes: number;
  seconds: number;
}) {
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

export function msToDuration(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds };
}
