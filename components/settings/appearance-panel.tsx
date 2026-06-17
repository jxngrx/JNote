'use client';

import { Download, RotateCcw, Upload } from 'lucide-react';
import {
  APP_FONT_CATEGORIES,
  APP_PRIMARY_FONTS,
  APP_SECONDARY_FONTS,
  getPrimaryFontFamily,
  getSecondaryFontFamily,
  type AppPrimaryFontId,
  type AppSecondaryFontId,
} from '@/lib/app-fonts';
import {
  DARK_THEME_PRESETS,
  LIGHT_THEME_PRESETS,
} from '@/lib/theme-presets';
import {
  THEME_COLOR_GROUPS,
  THEME_COLOR_LABELS,
  type ThemeColorKey,
  type ThemeMode,
} from '@/lib/theme-types';
import { useThemeStore } from '@/lib/theme-store';
import {
  useTypographySettingsStore,
  type AppFontStyle,
  type AppFontWeight,
} from '@/lib/typography-settings-store';

function PresetCard({
  id,
  name,
  colors,
  isActive,
  onSelect,
}: {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    accent: string;
  };
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`app-settings-preset-card${isActive ? ' is-active' : ''}`}
      onClick={onSelect}
      aria-pressed={isActive}
      title={name}
    >
      <div className="app-settings-preset-swatches" aria-hidden>
        <span
          className="app-settings-preset-swatch"
          style={{ background: colors.bg }}
        />
        <span
          className="app-settings-preset-swatch"
          style={{ background: colors.surface }}
        />
        <span
          className="app-settings-preset-swatch"
          style={{ background: colors.surface2 }}
        />
        <span
          className="app-settings-preset-swatch"
          style={{ background: colors.accent }}
        />
      </div>
      <span className="app-settings-preset-name">{name}</span>
    </button>
  );
}

export default function AppearancePanel() {
  const mode = useThemeStore((s) => s.mode);
  const presetId = useThemeStore((s) => s.presetId);
  const colors = useThemeStore((s) => s.colors);
  const isCustom = useThemeStore((s) => s.isCustom);
  const setMode = useThemeStore((s) => s.setMode);
  const applyPreset = useThemeStore((s) => s.applyPreset);
  const setColor = useThemeStore((s) => s.setColor);
  const setBorderOpacity = useThemeStore((s) => s.setBorderOpacity);
  const setBorderStrongOpacity = useThemeStore((s) => s.setBorderStrongOpacity);
  const resetToPreset = useThemeStore((s) => s.resetToPreset);
  const importTheme = useThemeStore((s) => s.importTheme);
  const exportTheme = useThemeStore((s) => s.exportTheme);

  const typography = useTypographySettingsStore();
  const setTypography = useTypographySettingsStore((s) => s.setSettings);
  const resetTypography = useTypographySettingsStore((s) => s.resetSettings);
  const activePrimaryFont = APP_PRIMARY_FONTS.find(
    (f) => f.id === typography.primaryFontFamily
  );
  const showItalicToggle = activePrimaryFont?.supportsItalic ?? false;

  const presets = mode === 'dark' ? DARK_THEME_PRESETS : LIGHT_THEME_PRESETS;

  const downloadTheme = () => {
    const blob = new Blob([exportTheme()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jnote-theme-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pickThemeFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed.colors || !parsed.mode) {
          alert('Invalid theme file.');
          return;
        }
        importTheme(parsed);
      } catch {
        alert('Invalid theme file.');
      }
    };
    input.click();
  };

  const handleModeChange = (nextMode: ThemeMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  return (
    <>
      <div className="app-settings-toolbar">
        <div className="app-settings-mode-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            className={`app-settings-mode-btn${mode === 'dark' ? ' is-active' : ''}`}
            aria-selected={mode === 'dark'}
            onClick={() => handleModeChange('dark')}
          >
            Dark
          </button>
          <button
            type="button"
            role="tab"
            className={`app-settings-mode-btn${mode === 'light' ? ' is-active' : ''}`}
            aria-selected={mode === 'light'}
            onClick={() => handleModeChange('light')}
          >
            Light
          </button>
        </div>
        {isCustom && (
          <button
            type="button"
            className="app-settings-btn app-settings-btn--ghost"
            onClick={resetToPreset}
          >
            <RotateCcw size={14} />
            Reset custom
          </button>
        )}
        <button
          type="button"
          className="app-settings-btn app-settings-btn--ghost"
          onClick={downloadTheme}
        >
          <Download size={14} />
          Export theme
        </button>
        <button
          type="button"
          className="app-settings-btn app-settings-btn--ghost"
          onClick={pickThemeFile}
        >
          <Upload size={14} />
          Import theme
        </button>
      </div>

      <section className="app-settings-section">
        <h3 className="app-settings-section-title">
          {mode === 'dark' ? 'Dark palettes' : 'Light palettes'} ({presets.length})
        </h3>
        <div className="app-settings-preset-grid">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              id={preset.id}
              name={preset.name}
              colors={preset.colors}
              isActive={!isCustom && presetId === preset.id}
              onSelect={() => applyPreset(preset.id)}
            />
          ))}
        </div>
      </section>

      <section className="app-settings-section">
        <div className="app-settings-section-head">
          <h3 className="app-settings-section-title">Typography</h3>
          <button
            type="button"
            className="app-settings-btn app-settings-btn--ghost app-settings-btn--compact"
            onClick={resetTypography}
          >
            <RotateCcw size={14} />
            Reset fonts
          </button>
        </div>
        <p className="app-settings-section-desc">
          Primary font drives UI and content. Secondary font handles labels,
          timestamps, and metadata across every mode.
        </p>

        <div className="app-settings-typography-preview">
          <p
            className="app-settings-typography-preview-title"
            style={{
              fontFamily: getPrimaryFontFamily(typography.primaryFontFamily),
              fontWeight: typography.fontWeight,
              fontStyle:
                typography.fontStyle === 'italic' && showItalicToggle
                  ? 'italic'
                  : 'normal',
            }}
          >
            Capture ideas with clarity
          </p>
          <p
            className="app-settings-typography-preview-body"
            style={{
              fontFamily: getPrimaryFontFamily(typography.primaryFontFamily),
              fontWeight: typography.fontWeight,
              fontStyle:
                typography.fontStyle === 'italic' && showItalicToggle
                  ? 'italic'
                  : 'normal',
            }}
          >
            Notes, tasks, and focus tools share one voice. Pick fonts that
            match how you think.
          </p>
          <span
            className="app-settings-typography-preview-mono"
            style={{
              fontFamily: getSecondaryFontFamily(
                typography.secondaryFontFamily
              ),
            }}
          >
            Updated 14:32 · 3 tasks due
          </span>
        </div>

        <h4 className="app-settings-font-group-label">Primary font</h4>
        {APP_FONT_CATEGORIES.map((category) => {
          const fonts = APP_PRIMARY_FONTS.filter(
            (f) => f.category === category.id
          );
          if (fonts.length === 0) return null;

          return (
            <div key={category.id} className="app-settings-font-group">
              <p className="app-settings-font-group-sublabel">{category.label}</p>
              <div className="app-settings-font-grid">
                {fonts.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className={`app-settings-font-chip${
                      typography.primaryFontFamily === font.id ? ' is-active' : ''
                    }`}
                    onClick={() => {
                      const patch: Partial<typeof typography> = {
                        primaryFontFamily: font.id as AppPrimaryFontId,
                      };
                      if (
                        typography.fontStyle === 'italic' &&
                        !font.supportsItalic
                      ) {
                        patch.fontStyle = 'normal';
                      }
                      setTypography(patch);
                    }}
                    style={{
                      fontFamily: `var(${font.cssVar}), ${font.fallback}`,
                    }}
                    title={font.description}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="app-settings-font-group">
          <h4 className="app-settings-font-group-label">Secondary font</h4>
          <p className="app-settings-font-group-sublabel">
            Metadata, timestamps, counters
          </p>
          <div className="app-settings-font-grid">
            {APP_SECONDARY_FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                className={`app-settings-font-chip${
                  typography.secondaryFontFamily === font.id ? ' is-active' : ''
                }`}
                onClick={() =>
                  setTypography({
                    secondaryFontFamily: font.id as AppSecondaryFontId,
                  })
                }
                style={{
                  fontFamily: `var(${font.cssVar}), ${font.fallback}`,
                }}
                title={font.description}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        <div className="app-settings-toggle-row">
          <span className="app-settings-color-label">Font weight</span>
          <div className="app-settings-mode-toggle" role="tablist">
            {([300, 400, 500, 600] as AppFontWeight[]).map((weight) => (
              <button
                key={weight}
                type="button"
                role="tab"
                className={`app-settings-mode-btn${
                  typography.fontWeight === weight ? ' is-active' : ''
                }`}
                aria-selected={typography.fontWeight === weight}
                onClick={() => setTypography({ fontWeight: weight })}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        {showItalicToggle && (
          <div className="app-settings-toggle-row">
            <span className="app-settings-color-label">Font style</span>
            <div className="app-settings-mode-toggle" role="tablist">
              {(['normal', 'italic'] as AppFontStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  role="tab"
                  className={`app-settings-mode-btn${
                    typography.fontStyle === style ? ' is-active' : ''
                  }`}
                  aria-selected={typography.fontStyle === style}
                  onClick={() => setTypography({ fontStyle: style })}
                >
                  {style === 'normal' ? 'Regular' : 'Italic'}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="app-settings-section">
        <h3 className="app-settings-section-title">Custom colors</h3>
        {THEME_COLOR_GROUPS.map((group) => (
          <div key={group.title} className="app-settings-section">
            <h4 className="app-settings-section-title">{group.title}</h4>
            {group.keys.map((key: ThemeColorKey) => (
              <div key={key} className="app-settings-color-row">
                <span className="app-settings-color-label">
                  {THEME_COLOR_LABELS[key]}
                </span>
                <div className="app-settings-color-input-wrap">
                  <input
                    type="color"
                    className="app-settings-color-input"
                    value={colors[key]}
                    onChange={(e) => setColor(key, e.target.value)}
                    aria-label={THEME_COLOR_LABELS[key]}
                  />
                  <span className="app-settings-color-hex">
                    {colors[key].toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="app-settings-range-row">
          <span className="app-settings-color-label">Border opacity</span>
          <input
            type="range"
            min={0.02}
            max={0.2}
            step={0.01}
            value={colors.borderOpacity}
            onChange={(e) => setBorderOpacity(Number(e.target.value))}
          />
          <span className="app-settings-range-value">
            {Math.round(colors.borderOpacity * 100)}%
          </span>
        </div>
        <div className="app-settings-range-row">
          <span className="app-settings-color-label">Border strong opacity</span>
          <input
            type="range"
            min={0.04}
            max={0.28}
            step={0.01}
            value={colors.borderStrongOpacity}
            onChange={(e) => setBorderStrongOpacity(Number(e.target.value))}
          />
          <span className="app-settings-range-value">
            {Math.round(colors.borderStrongOpacity * 100)}%
          </span>
        </div>
      </section>
    </>
  );
}
