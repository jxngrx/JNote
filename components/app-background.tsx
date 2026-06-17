'use client';

import { useMemo } from 'react';
import { useBackgroundSettingsStore } from '@/lib/background-settings-store';
import './app-background.css';

const MOSAIC_TILE_COUNT = 12;

export default function AppBackground() {
  const kind = useBackgroundSettingsStore((s) => s.kind);
  const presetId = useBackgroundSettingsStore((s) => s.presetId);
  const customImageUrl = useBackgroundSettingsStore((s) => s.customImageUrl);
  const gradientColors = useBackgroundSettingsStore((s) => s.gradientColors);
  const gradientAngle = useBackgroundSettingsStore((s) => s.gradientAngle);
  const blurPx = useBackgroundSettingsStore((s) => s.blurPx);
  const mosaicStrength = useBackgroundSettingsStore((s) => s.mosaicStrength);
  const overlayOpacity = useBackgroundSettingsStore((s) => s.overlayOpacity);
  const getResolvedBackground = useBackgroundSettingsStore(
    (s) => s.getResolvedBackground
  );
  const isActive = useBackgroundSettingsStore((s) => s.isActive);

  const backgroundCss = useMemo(
    () => getResolvedBackground(),
    [
      getResolvedBackground,
      kind,
      presetId,
      customImageUrl,
      gradientColors,
      gradientAngle,
    ]
  );

  if (!isActive() || backgroundCss === 'none') return null;

  const isGradient = kind === 'gradient';
  const style = {
    '--app-bg-image': isGradient ? 'none' : backgroundCss,
    '--app-bg-gradient': isGradient ? backgroundCss : 'none',
    '--app-bg-blur': `${blurPx}px`,
    '--app-bg-mosaic': `${mosaicStrength / 100}`,
    '--app-bg-overlay': overlayOpacity,
  } as React.CSSProperties;

  return (
    <div
      className={`app-background${isGradient ? ' app-background--gradient' : ''}`}
      style={style}
      aria-hidden
      data-active="true"
    >
      <div className="app-background-base" />
      <div className="app-background-mosaic" aria-hidden>
        {Array.from({ length: MOSAIC_TILE_COUNT }, (_, i) => (
          <span key={i} className="app-background-tile" />
        ))}
      </div>
      <div className="app-background-overlay" />
      <div className="app-background-content-veil" />
      <div className="app-background-vignette" />
    </div>
  );
}
