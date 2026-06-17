'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Pin, X } from 'lucide-react';
import type { WorldClock } from '@/lib/world-time-store';
import {
  formatClockDate,
  formatClockTime,
  getUtcOffsetLabel,
} from '@/lib/country-timezones';

type ClockCardProps = {
  clock: WorldClock;
  index: number;
  onRemove: (id: string) => void;
  onFocus: (id: string) => void;
  onTogglePin: (id: string) => void;
};

export function ClockCard({
  clock,
  index,
  onRemove,
  onFocus,
  onTogglePin,
}: ClockCardProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = formatClockTime(clock.timezone, now);
  const date = formatClockDate(clock.timezone, now);
  const offset = getUtcOffsetLabel(clock.timezone, now);

  const openFocus = () => onFocus(clock.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFocus();
    }
  };

  return (
    <article
      className="wt-clock-card"
      style={{ animationDelay: `${index * 70}ms` }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${clock.countryName} clock in focus view`}
      onClick={openFocus}
      onKeyDown={handleKeyDown}
    >
      <div className="wt-clock-card-actions">
        <button
          type="button"
          className={`wt-clock-pin${clock.pinned ? ' is-pinned' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(clock.id);
          }}
          aria-label={
            clock.pinned
              ? `Unpin ${clock.countryName} from top bar`
              : `Pin ${clock.countryName} to top bar`
          }
          aria-pressed={clock.pinned}
        >
          <Pin size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="wt-clock-remove"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(clock.id);
          }}
          aria-label={`Remove ${clock.countryName} clock`}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      <header className="wt-clock-card-head">
        <h3 className="wt-clock-country">{clock.countryName}</h3>
        {clock.zoneLabel ? (
          <p className="wt-clock-region">{clock.zoneLabel}</p>
        ) : null}
        <p className="wt-clock-zone">{offset}</p>
      </header>

      <time className="wt-clock-time" dateTime={now.toISOString()}>
        {time}
      </time>

      <footer className="wt-clock-card-foot">
        <p className="wt-clock-date">{date}</p>
        <button
          type="button"
          className="wt-clock-expand"
          onClick={(event) => {
            event.stopPropagation();
            openFocus();
          }}
          aria-label={`Open ${clock.countryName} focus view`}
        >
          <ArrowUpRight size={15} strokeWidth={1.75} />
        </button>
      </footer>
    </article>
  );
}
