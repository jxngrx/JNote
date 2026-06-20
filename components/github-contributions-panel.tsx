'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, RefreshCw, X } from 'lucide-react';
import { useGithubSettingsStore } from '@/lib/github-settings-store';
import { useGithubUiStore } from '@/lib/github-ui-store';
import {
  contributionsToWeeks,
  formatContributionDate,
  type GithubProfilePayload,
} from '@/lib/github-utils';
import { useGithubAnchor } from '@/hooks/use-github-anchor';
import './github-contributions-panel.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const panelVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.96,
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] as const },
  },
};

function monthTicks(weeks: ReturnType<typeof contributionsToWeeks>) {
  const ticks: { label: string; index: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, index) => {
    const month = new Date(`${week[0].date}T12:00:00`).getMonth();
    if (month !== lastMonth) {
      ticks.push({ label: MONTH_LABELS[month], index });
      lastMonth = month;
    }
  });

  return ticks;
}

function ContributionCell({
  day,
  index,
  animate,
}: {
  day: { date: string; count: number; level: number };
  index: number;
  animate: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const level = Math.max(0, Math.min(4, day.level));

  const cell = (
    <motion.span
      className={`github-contrib-cell github-contrib-cell--level-${level}`}
      initial={false}
      animate={
        animate
          ? { opacity: 1, scale: 1 }
          : { opacity: 1, scale: 1 }
      }
      transition={{
        delay: animate ? Math.min(index * 0.0012, 0.35) : 0,
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      aria-hidden
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );

  if (!hovered || day.count === 0) return cell;

  return (
    <span className="github-contrib-cell-wrap">
      {cell}
      <span className="github-contrib-tooltip" role="tooltip">
        <strong>{day.count}</strong> contribution{day.count === 1 ? '' : 's'} on{' '}
        {formatContributionDate(day.date)}
      </span>
    </span>
  );
}

export default function GithubContributionsPanel() {
  const username = useGithubSettingsStore((s) => s.username);
  const setProfileMeta = useGithubSettingsStore((s) => s.setProfileMeta);
  const open = useGithubUiStore((s) => s.open);
  const closeGithub = useGithubUiStore((s) => s.closeGithub);
  const setPinned = useGithubUiStore((s) => s.setPinned);

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<GithubProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animateCells, setAnimateCells] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchor = useGithubAnchor(open && !!username);

  const weeks = useMemo(
    () => (data?.contributions ? contributionsToWeeks(data.contributions) : []),
    [data?.contributions]
  );
  const ticks = useMemo(() => monthTicks(weeks), [weeks]);

  const loadProfile = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github?username=${encodeURIComponent(username)}`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Could not load GitHub data.');
        setData(null);
        return;
      }

      const profile = payload as GithubProfilePayload;
      setData(profile);
      setProfileMeta({
        avatarUrl: profile.avatarUrl,
        displayName: profile.name,
      });
      setAnimateCells(true);
    } catch {
      setError('Network error while loading GitHub data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [setProfileMeta, username]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !username) return;
    setAnimateCells(false);
    void loadProfile();
  }, [open, username, loadProfile]);

  useEffect(() => {
    if (!open) {
      setAnimateCells(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGithub();
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (
        (target as HTMLElement).closest?.(
          'button.mag-dock-item[aria-label="GitHub"], button.app-sidebar-item[aria-label="GitHub"]'
        )
      ) {
        return;
      }
      closeGithub();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, closeGithub]);

  if (!mounted || !username) return null;

  const anchorStyle = {
    '--github-anchor-x': `${anchor.x}px`,
    '--github-anchor-y': `${anchor.y}px`,
  } as React.CSSProperties;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="github-contrib-wrap"
          ref={panelRef}
          style={anchorStyle}
        >
          <motion.section
            className="github-contrib-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-label="GitHub contributions"
          >
            <header className="github-contrib-header">
              <div className="github-contrib-profile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="github-contrib-avatar"
                  src={data?.avatarUrl || `https://github.com/${username}.png?size=96`}
                  alt=""
                />
                <div className="github-contrib-profile-copy">
                  <p className="github-contrib-eyebrow">Contribution activity</p>
                  <h2 className="github-contrib-name">{data?.name ?? username}</h2>
                  <a
                    className="github-contrib-handle"
                    href={data?.profileUrl ?? `https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{username}
                  </a>
                </div>
              </div>

              <div className="github-contrib-header-actions">
                <button
                  type="button"
                  className="github-contrib-icon-btn"
                  onClick={() => void loadProfile()}
                  disabled={loading}
                  aria-label="Refresh contributions"
                >
                  <RefreshCw size={14} className={loading ? 'is-spinning' : ''} />
                </button>
                <button
                  type="button"
                  className="github-contrib-icon-btn"
                  onClick={() => {
                    setPinned(false);
                    closeGithub();
                  }}
                  aria-label="Close GitHub panel"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            <div className="github-contrib-stat-row">
              <div className="github-contrib-stat">
                <span className="github-contrib-stat-value">
                  {loading ? '—' : (data?.totalContributions ?? 0).toLocaleString()}
                </span>
                <span className="github-contrib-stat-label">contributions last year</span>
              </div>
              <a
                className="github-contrib-profile-link"
                href={data?.profileUrl ?? `https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View profile
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="github-contrib-chart-shell">
              {error ? (
                <p className="github-contrib-error">{error}</p>
              ) : loading && !data ? (
                <div className="github-contrib-skeleton" aria-hidden>
                  {Array.from({ length: 7 }).map((_, row) => (
                    <div key={row} className="github-contrib-skeleton-row">
                      {Array.from({ length: 24 }).map((__, col) => (
                        <span key={col} className="github-contrib-skeleton-cell" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="github-contrib-chart">
                  <div className="github-contrib-months" aria-hidden>
                    {ticks.map((tick) => (
                      <span
                        key={`${tick.label}-${tick.index}`}
                        className="github-contrib-month"
                        style={{ gridColumnStart: tick.index + 2 }}
                      >
                        {tick.label}
                      </span>
                    ))}
                  </div>

                  <div className="github-contrib-grid">
                    <div className="github-contrib-day-labels" aria-hidden>
                      {DAY_LABELS.map((label, index) => (
                        <span
                          key={label}
                          className="github-contrib-day-label"
                          style={{ gridRow: index + 2 }}
                        >
                          {index % 2 === 1 ? label : ''}
                        </span>
                      ))}
                    </div>

                    <div
                      className="github-contrib-cells"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, 11px)`,
                      }}
                    >
                      {weeks.map((week, weekIndex) =>
                        week.map((day, dayIndex) => {
                          const cellIndex = weekIndex * 7 + dayIndex;
                          return (
                            <ContributionCell
                              key={day.date}
                              day={day}
                              index={cellIndex}
                              animate={animateCells}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="github-contrib-footer">
              <span>Less</span>
              <span className="github-contrib-legend">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`github-contrib-legend-cell github-contrib-cell--level-${level}`}
                  />
                ))}
              </span>
              <span>More</span>
            </footer>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
