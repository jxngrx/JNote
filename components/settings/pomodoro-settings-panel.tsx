'use client';

import { RotateCcw } from 'lucide-react';
import {
  POMODORO_FONTS,
  type PomodoroFontId,
} from '@/lib/pomodoro-fonts';
import {
  usePomodoroSettingsStore,
  type PomodoroFontStyle,
  type PomodoroFontWeight,
} from '@/lib/pomodoro-settings-store';

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="app-settings-range-row">
      <span className="app-settings-color-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="app-settings-range-value">
        {value}
        {unit}
      </span>
    </div>
  );
}

export default function PomodoroSettingsPanel() {
  const settings = usePomodoroSettingsStore();
  const setSettings = usePomodoroSettingsStore((s) => s.setSettings);
  const resetSettings = usePomodoroSettingsStore((s) => s.resetSettings);

  const previewFont = POMODORO_FONTS.find((f) => f.id === settings.fontFamily);

  return (
    <>
      <div className="app-settings-toolbar">
        <button
          type="button"
          className="app-settings-btn app-settings-btn--ghost"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset pomodoro style
        </button>
      </div>

      <section className="app-settings-section">
        <h3 className="app-settings-section-title">Typography</h3>
        <p className="app-settings-section-desc">
          Choose an aesthetic display font, weight, and style for the focus timer.
        </p>

        <div className="pomodoro-settings-preview">
          <time
            className={`pomodoro-settings-preview-time${
              settings.fontStyle === 'italic' ? ' is-italic' : ''
            }`}
            style={{
              fontFamily: previewFont
                ? `${previewFont.cssVar}, ${previewFont.fallback}`
                : undefined,
              fontWeight: settings.fontWeight,
              fontSize: `${Math.min(settings.displaySizePx, 72)}px`,
              letterSpacing: `${settings.letterSpacingEm}em`,
              color: settings.textColor ?? 'var(--text-primary)',
            }}
          >
            25:00
          </time>
        </div>

        <div className="app-settings-font-grid">
          {POMODORO_FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              className={`app-settings-font-chip${
                settings.fontFamily === font.id ? ' is-active' : ''
              }`}
              onClick={() =>
                setSettings({ fontFamily: font.id as PomodoroFontId })
              }
              style={{
                fontFamily: `${font.cssVar}, ${font.fallback}`,
              }}
            >
              {font.label}
            </button>
          ))}
        </div>

        <div className="app-settings-toggle-row">
          <span className="app-settings-color-label">Font style</span>
          <div className="app-settings-mode-toggle" role="tablist">
            {(['normal', 'italic'] as PomodoroFontStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                role="tab"
                className={`app-settings-mode-btn${
                  settings.fontStyle === style ? ' is-active' : ''
                }`}
                aria-selected={settings.fontStyle === style}
                onClick={() => setSettings({ fontStyle: style })}
              >
                {style === 'normal' ? 'Regular' : 'Italic'}
              </button>
            ))}
          </div>
        </div>

        <div className="app-settings-toggle-row">
          <span className="app-settings-color-label">Font weight</span>
          <div className="app-settings-mode-toggle" role="tablist">
            {([300, 400, 500, 600] as PomodoroFontWeight[]).map((weight) => (
              <button
                key={weight}
                type="button"
                role="tab"
                className={`app-settings-mode-btn${
                  settings.fontWeight === weight ? ' is-active' : ''
                }`}
                aria-selected={settings.fontWeight === weight}
                onClick={() => setSettings({ fontWeight: weight })}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        <RangeRow
          label="Letter spacing"
          value={Math.round(settings.letterSpacingEm * 100)}
          min={-8}
          max={12}
          step={1}
          unit=""
          onChange={(v) => setSettings({ letterSpacingEm: v / 100 })}
        />

        <RangeRow
          label="Display size"
          value={settings.displaySizePx}
          min={64}
          max={160}
          step={2}
          unit="px"
          onChange={(v) => setSettings({ displaySizePx: v })}
        />

        <RangeRow
          label="Label size"
          value={settings.labelSizePx}
          min={10}
          max={18}
          step={1}
          unit="px"
          onChange={(v) => setSettings({ labelSizePx: v })}
        />

        <div className="app-settings-color-row">
          <span className="app-settings-color-label">Text color</span>
          <div className="app-settings-color-input-wrap">
            <input
              type="color"
              className="app-settings-color-input"
              value={settings.textColor ?? '#ececec'}
              onChange={(e) => setSettings({ textColor: e.target.value })}
              aria-label="Timer text color"
            />
            <button
              type="button"
              className="app-settings-btn app-settings-btn--ghost"
              onClick={() => setSettings({ textColor: null })}
            >
              Use theme
            </button>
          </div>
        </div>
      </section>

      <section className="app-settings-section">
        <h3 className="app-settings-section-title">Timer defaults</h3>
        <RangeRow
          label="Default duration"
          value={settings.defaultMinutes}
          min={1}
          max={120}
          step={1}
          unit=" min"
          onChange={(v) => setSettings({ defaultMinutes: v })}
        />

        <label className="app-settings-toggle-row">
          <span className="app-settings-color-label">Progress ring</span>
          <input
            type="checkbox"
            checked={settings.showProgressRing}
            onChange={(e) =>
              setSettings({ showProgressRing: e.target.checked })
            }
          />
        </label>
      </section>
    </>
  );
}
