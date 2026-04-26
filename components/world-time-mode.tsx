'use client';

import { useEffect, useMemo, useState } from 'react';

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export default function WorldTimeMode() {
  const [progressWidth, setProgressWidth] = useState('0%');

  const data = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();

    const start = new Date(year, 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const currentDay = Math.floor(diff / oneDay);

    const totalDays = isLeap(year) ? 366 : 365;
    const remaining = totalDays - currentDay;
    const percentNumber = Number(((currentDay / totalDays) * 100).toFixed(1));
    const todayLabel = now.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      now,
      year,
      currentDay,
      totalDays,
      remaining,
      percentNumber,
      todayLabel,
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setProgressWidth(`${data.percentNumber}%`);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.percentNumber]);

  return (
    <div className="year-dots-body">
      <div className="year-dots-wrapper">
        <h1 className="year-dots-h1">{data.year}</h1>
        <p className="year-dots-sub">Each circle is one day.</p>

        <div className="year-dots-stats">
          <div className="year-dots-stat">
            <h2 className="year-dots-stat-value">{data.currentDay}</h2>
            <p className="year-dots-stat-label">Days Lived This Year</p>
          </div>

          <div className="year-dots-stat">
            <h2 className="year-dots-stat-value">{data.remaining}</h2>
            <p className="year-dots-stat-label">Days Remaining</p>
          </div>

          <div className="year-dots-stat">
            <h2 className="year-dots-stat-value">{data.percentNumber}%</h2>
            <p className="year-dots-stat-label">Year Complete</p>
          </div>
        </div>

        <div
          className="year-dots-grid"
          style={
            {
              '--yd-total-days': data.totalDays,
            } as React.CSSProperties
          }
        >
          {Array.from({ length: data.totalDays }, (_, idx) => {
            const day = idx + 1;
            const filled = day <= data.currentDay;
            return (
              <div
                key={day}
                className={`year-dots-dot ${filled ? 'filled' : ''}`}
                style={{ animationDelay: `${day * 6}ms` }}
                title={`Day ${day}`}
              />
            );
          })}
        </div>

        <div className="year-dots-progress-bar">
          <div className="year-dots-progress" style={{ width: progressWidth }} />
        </div>

        <p className="year-dots-tooltip">
          Today is <span className="year-dots-today">{data.todayLabel}</span>
        </p>
      </div>
    </div>
  );
}

