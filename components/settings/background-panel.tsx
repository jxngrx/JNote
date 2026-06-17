'use client';

import { Plus, RotateCcw, Upload } from 'lucide-react';
import {
  BACKGROUND_PRESETS,
  GRADIENT_PRESETS,
  type BackgroundKind,
  type BackgroundPresetId,
  type GradientPresetId,
} from '@/lib/background-presets';
import { useBackgroundSettingsStore } from '@/lib/background-settings-store';

function BackgroundPresetCard({
  name,
  thumbnail,
  isActive,
  onSelect,
}: {
  name: string;
  thumbnail: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`app-settings-bg-card${isActive ? ' is-active' : ''}`}
      onClick={onSelect}
      aria-pressed={isActive}
      title={name}
    >
      <span
        className="app-settings-bg-thumb"
        style={{ background: thumbnail }}
        aria-hidden
      />
      <span className="app-settings-bg-name">{name}</span>
    </button>
  );
}

const KIND_OPTIONS: { id: BackgroundKind; label: string }[] = [
  { id: 'theme', label: 'Theme default' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'photo', label: 'Photo' },
];

export default function BackgroundPanel() {
  const kind = useBackgroundSettingsStore((s) => s.kind);
  const presetId = useBackgroundSettingsStore((s) => s.presetId);
  const customImageUrl = useBackgroundSettingsStore((s) => s.customImageUrl);
  const gradientPresetId = useBackgroundSettingsStore((s) => s.gradientPresetId);
  const gradientColors = useBackgroundSettingsStore((s) => s.gradientColors);
  const gradientAngle = useBackgroundSettingsStore((s) => s.gradientAngle);
  const blurPx = useBackgroundSettingsStore((s) => s.blurPx);
  const mosaicStrength = useBackgroundSettingsStore((s) => s.mosaicStrength);
  const overlayOpacity = useBackgroundSettingsStore((s) => s.overlayOpacity);
  const setKind = useBackgroundSettingsStore((s) => s.setKind);
  const setPreset = useBackgroundSettingsStore((s) => s.setPreset);
  const setGradientPreset = useBackgroundSettingsStore((s) => s.setGradientPreset);
  const setGradientColor = useBackgroundSettingsStore((s) => s.setGradientColor);
  const addGradientColor = useBackgroundSettingsStore((s) => s.addGradientColor);
  const removeGradientColor = useBackgroundSettingsStore((s) => s.removeGradientColor);
  const setCustomImage = useBackgroundSettingsStore((s) => s.setCustomImage);
  const setSettings = useBackgroundSettingsStore((s) => s.setSettings);
  const resetSettings = useBackgroundSettingsStore((s) => s.resetSettings);

  const pickCustomImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        alert('Image must be under 4 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setCustomImage(reader.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <>
      <div className="app-settings-toolbar">
        <div className="app-settings-mode-toggle" role="tablist" aria-label="Background type">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              className={`app-settings-mode-btn${kind === opt.id ? ' is-active' : ''}`}
              aria-selected={kind === opt.id}
            onClick={() => {
                if (opt.id === 'theme') setPreset('none');
                else if (opt.id === 'gradient') {
                  if (kind !== 'gradient') setGradientPreset('blue-mosaic');
                  else setKind('gradient');
                } else {
                  if (kind !== 'photo') setPreset(presetId === 'none' ? 'misty-forest' : presetId);
                  else setKind('photo');
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {kind === 'photo' && (
          <button
            type="button"
            className="app-settings-btn app-settings-btn--ghost"
            onClick={pickCustomImage}
          >
            <Upload size={14} />
            Upload
          </button>
        )}
        <button
          type="button"
          className="app-settings-btn app-settings-btn--ghost"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {kind === 'gradient' && (
        <section className="app-settings-section">
          <h3 className="app-settings-section-title">Gradient presets</h3>
          <p className="app-settings-section-desc">
            Up to 5 colors. Mosaic blur applies on top for depth.
          </p>
          <div className="app-settings-bg-grid">
            {GRADIENT_PRESETS.map((preset) => (
              <BackgroundPresetCard
                key={preset.id}
                name={preset.name}
                thumbnail={preset.thumbnail}
                isActive={gradientPresetId === preset.id}
                onSelect={() => setGradientPreset(preset.id as GradientPresetId)}
              />
            ))}
          </div>

          <h4 className="app-settings-section-title">Custom stops</h4>
          <div className="app-settings-gradient-stops">
            {gradientColors.map((color, index) => (
              <div key={index} className="app-settings-gradient-stop">
                <input
                  type="color"
                  className="app-settings-color-input"
                  value={color}
                  onChange={(e) => setGradientColor(index, e.target.value)}
                  aria-label={`Gradient color ${index + 1}`}
                />
                <span className="app-settings-color-hex">{color.toUpperCase()}</span>
                {gradientColors.length > 2 && (
                  <button
                    type="button"
                    className="app-settings-btn app-settings-btn--ghost"
                    onClick={() => removeGradientColor(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {gradientColors.length < 5 && (
              <button
                type="button"
                className="app-settings-btn app-settings-btn--ghost"
                onClick={addGradientColor}
              >
                <Plus size={14} />
                Add color
              </button>
            )}
          </div>
          <div className="app-settings-range-row">
            <span className="app-settings-color-label">Angle</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={gradientAngle}
              onChange={(e) =>
                setSettings({ gradientAngle: Number(e.target.value) })
              }
            />
            <span className="app-settings-range-value">{gradientAngle}°</span>
          </div>
        </section>
      )}

      {kind === 'photo' && (
        <section className="app-settings-section">
          <h3 className="app-settings-section-title">Photo wallpapers</h3>
          <div className="app-settings-bg-grid">
            {BACKGROUND_PRESETS.filter((p) => p.id !== 'none').map((preset) => (
              <BackgroundPresetCard
                key={preset.id}
                name={preset.name}
                thumbnail={preset.thumbnail}
                isActive={presetId === preset.id}
                onSelect={() => setPreset(preset.id as BackgroundPresetId)}
              />
            ))}
            {customImageUrl && (
              <BackgroundPresetCard
                name="Your upload"
                thumbnail={`url(${customImageUrl})`}
                isActive={presetId === 'custom'}
                onSelect={() => setPreset('custom')}
              />
            )}
          </div>
        </section>
      )}

      {kind === 'theme' && (
        <section className="app-settings-section">
          <p className="app-settings-section-desc">
            Uses your theme palette only — no global wallpaper layer.
          </p>
        </section>
      )}

      {kind !== 'theme' && (
        <section className="app-settings-section">
          <h3 className="app-settings-section-title">Mosaic blur</h3>
          <div className="app-settings-range-row">
            <span className="app-settings-color-label">Blur intensity</span>
            <input
              type="range"
              min={0}
              max={64}
              step={1}
              value={blurPx}
              onChange={(e) => setSettings({ blurPx: Number(e.target.value) })}
            />
            <span className="app-settings-range-value">{blurPx}px</span>
          </div>
          <div className="app-settings-range-row">
            <span className="app-settings-color-label">Mosaic strength</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={mosaicStrength}
              onChange={(e) =>
                setSettings({ mosaicStrength: Number(e.target.value) })
              }
            />
            <span className="app-settings-range-value">{mosaicStrength}%</span>
          </div>
          <div className="app-settings-range-row">
            <span className="app-settings-color-label">Overlay dim</span>
            <input
              type="range"
              min={0}
              max={0.75}
              step={0.01}
              value={overlayOpacity}
              onChange={(e) =>
                setSettings({ overlayOpacity: Number(e.target.value) })
              }
            />
            <span className="app-settings-range-value">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
        </section>
      )}
    </>
  );
}
