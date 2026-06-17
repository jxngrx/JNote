'use client';

import { useEffect, useState } from 'react';
import { LocateFixed, RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  CLOCK_WIDGET_SETTINGS_LIMITS,
  clockWidgetSettingsToStyle,
  useClockWidgetSettingsStore,
  type ClockWidgetSettings,
} from '@/lib/clock-widget-settings-store';
import { formatClockTime } from '@/lib/country-timezones';
import { useWorldTimeStore } from '@/lib/world-time-store';

function WidgetSlider({
  label,
  value,
  min,
  max,
  step,
  unit = 'px',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="widgets-setting-row">
      <label className="widgets-setting-label">{label}</label>
      <div className="widgets-setting-control">
        <input
          type="range"
          className="widgets-setting-range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="widgets-setting-value">
          {value}
          {unit}
        </span>
      </div>
    </div>
  );
}

function WidgetColor({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const display = value || fallback;

  return (
    <div className="widgets-setting-row">
      <span className="widgets-setting-label">{label}</span>
      <div className="widgets-setting-color-wrap">
        <input
          type="color"
          className="widgets-setting-color"
          value={display.startsWith('#') ? display : '#141414'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <button
          type="button"
          className="widgets-setting-auto-btn"
          onClick={() => onChange('')}
        >
          Auto
        </button>
        <span className="widgets-setting-value widgets-setting-value--hex">
          {value ? value.toUpperCase() : 'Theme'}
        </span>
      </div>
    </div>
  );
}

function WidgetToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--toggle">
      <div className="widgets-setting-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button
        type="button"
        className={`widgets-setting-toggle${enabled ? ' is-on' : ''}`}
        onClick={onToggle}
        aria-pressed={enabled}
      >
        <span className="widgets-setting-toggle-thumb" aria-hidden />
      </button>
    </div>
  );
}

function clockWidgetCssVar(
  style: ReturnType<typeof clockWidgetSettingsToStyle>,
  name: '--clock-widget-bg' | '--clock-widget-border'
): string | undefined {
  const value = (style as Record<string, string | number | undefined>)[name];
  return typeof value === 'string' ? value : undefined;
}

function ClockWidgetPreview({ settings }: { settings: ClockWidgetSettings }) {
  const { location } = useUserLocation();
  const [now, setNow] = useState(() => new Date());
  const previewStyle = clockWidgetSettingsToStyle(settings);
  const previewTime = formatClockTime(
    location.timezone,
    now,
    settings.showSeconds
  );

  useEffect(() => {
    const intervalMs = settings.showSeconds ? 1000 : 60_000;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);

    return () => window.clearInterval(id);
  }, [settings.showSeconds]);

  return (
    <div className="widgets-preview-wrap">
      <div
        className="widgets-preview-card floating-clock-widget is-preview"
        style={{
          ...previewStyle,
          width: settings.collapsedWidth,
          minHeight: settings.height,
          borderRadius: settings.borderRadius,
          background: clockWidgetCssVar(previewStyle, '--clock-widget-bg'),
          borderColor: clockWidgetCssVar(previewStyle, '--clock-widget-border'),
          position: 'relative',
          left: 'auto',
          top: 'auto',
        }}
      >
        <div className="floating-clock-body">
          <time className="floating-clock-time" dateTime={now.toISOString()}>
            {previewTime}
          </time>
          <span className="floating-clock-city">{location.city}</span>
        </div>
      </div>
    </div>
  );
}

export default function ClockWidgetsPanel() {
  const settings = useClockWidgetSettingsStore(
    useShallow((s) => ({
      collapsedWidth: s.collapsedWidth,
      height: s.height,
      borderRadius: s.borderRadius,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      titleFontSize: s.titleFontSize,
      titleFontWeight: s.titleFontWeight,
      titleFontFamily: s.titleFontFamily,
      titleColor: s.titleColor,
      subtitleFontSize: s.subtitleFontSize,
      subtitleFontWeight: s.subtitleFontWeight,
      subtitleFontFamily: s.subtitleFontFamily,
      subtitleColor: s.subtitleColor,
      showSeconds: s.showSeconds,
    }))
  );
  const setSettings = useClockWidgetSettingsStore((s) => s.setSettings);
  const resetSettings = useClockWidgetSettingsStore((s) => s.resetSettings);
  const pinnedClockCount = useWorldTimeStore(
    (s) => s.clocks.filter((clock) => clock.pinned).length
  );
  const resetPinnedClockPositions = useWorldTimeStore(
    (s) => s.resetPinnedClockPositions
  );

  return (
    <div className="widgets-settings">
      <div className="widgets-settings-toolbar">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset clock
        </button>
      </div>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Preview</h3>
        <ClockWidgetPreview settings={settings} />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Pinned clocks</h3>
        <div className="widgets-setting-row widgets-setting-row--action">
          <div className="widgets-setting-copy">
            <strong>Reset locations</strong>
            <span>
              {pinnedClockCount > 0
                ? `Move ${pinnedClockCount} pinned clock${pinnedClockCount === 1 ? '' : 's'} back to the default stack on the right.`
                : 'Pin a clock from World Time to place floating widgets on screen.'}
            </span>
          </div>
          <button
            type="button"
            className="widgets-setting-action-btn"
            onClick={resetPinnedClockPositions}
            disabled={pinnedClockCount === 0}
          >
            <LocateFixed size={14} />
            Reset locations
          </button>
        </div>
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Layout</h3>
        <WidgetSlider
          label="Width"
          value={settings.collapsedWidth}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.collapsedWidth}
          onChange={(collapsedWidth) => setSettings({ collapsedWidth })}
        />
        <WidgetSlider
          label="Height"
          value={settings.height}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.height}
          onChange={(height) => setSettings({ height })}
        />
        <WidgetSlider
          label="Corner radius"
          value={settings.borderRadius}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.borderRadius}
          onChange={(borderRadius) => setSettings({ borderRadius })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Card colors</h3>
        <WidgetColor
          label="Background"
          value={settings.backgroundColor}
          fallback="#141414"
          onChange={(backgroundColor) => setSettings({ backgroundColor })}
        />
        <WidgetColor
          label="Border"
          value={settings.borderColor}
          fallback="#2a2a2a"
          onChange={(borderColor) => setSettings({ borderColor })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Time</h3>
        <WidgetSlider
          label="Font size"
          value={settings.titleFontSize}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.titleFontSize}
          onChange={(titleFontSize) => setSettings({ titleFontSize })}
        />
        <WidgetSlider
          label="Font weight"
          value={settings.titleFontWeight}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.titleFontWeight}
          unit=""
          onChange={(titleFontWeight) => setSettings({ titleFontWeight })}
        />
        <WidgetColor
          label="Color"
          value={settings.titleColor}
          fallback="#ececec"
          onChange={(titleColor) => setSettings({ titleColor })}
        />
        <WidgetToggle
          label="Show seconds"
          description="Include seconds in the live clock."
          enabled={settings.showSeconds}
          onToggle={() => setSettings({ showSeconds: !settings.showSeconds })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">City</h3>
        <WidgetSlider
          label="Font size"
          value={settings.subtitleFontSize}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.subtitleFontSize}
          onChange={(subtitleFontSize) => setSettings({ subtitleFontSize })}
        />
        <WidgetSlider
          label="Font weight"
          value={settings.subtitleFontWeight}
          {...CLOCK_WIDGET_SETTINGS_LIMITS.subtitleFontWeight}
          unit=""
          onChange={(subtitleFontWeight) => setSettings({ subtitleFontWeight })}
        />
        <WidgetColor
          label="Color"
          value={settings.subtitleColor}
          fallback="#6f6f6f"
          onChange={(subtitleColor) => setSettings({ subtitleColor })}
        />
      </section>
    </div>
  );
}
