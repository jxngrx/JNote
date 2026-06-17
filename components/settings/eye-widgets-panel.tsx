'use client';

import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { EyeTracking } from '@/components/ui/eye-tracking';
import {
  DEFAULT_EYE_WIDGET_SETTINGS,
  EYE_WIDGET_SETTINGS_LIMITS,
  EYE_WIDGET_VARIANTS,
  useEyeWidgetSettingsStore,
  type EyeWidgetSettings,
} from '@/lib/eye-widget-settings-store';
import type { EyeTrackingVariant } from '@/components/ui/eye-tracking';

function WidgetSlider({
  label,
  value,
  min,
  max,
  step,
  unit = 'px',
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  displayValue?: string;
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
          {displayValue ?? `${value}${unit}`}
        </span>
      </div>
    </div>
  );
}

function WidgetColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="widgets-setting-row">
      <span className="widgets-setting-label">{label}</span>
      <div className="widgets-setting-color-wrap">
        <input
          type="color"
          className="widgets-setting-color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <span className="widgets-setting-value widgets-setting-value--hex">
          {value.toUpperCase()}
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

function WidgetVariantPicker({
  value,
  onChange,
}: {
  value: EyeTrackingVariant;
  onChange: (value: EyeTrackingVariant) => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--variant">
      <span className="widgets-setting-label">Style</span>
      <div className="widgets-variant-picker">
        {EYE_WIDGET_VARIANTS.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className={`widgets-variant-picker-btn${
              value === variant.id ? ' is-active' : ''
            }`}
            onClick={() => onChange(variant.id)}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EyeWidgetPreview({ settings }: { settings: EyeWidgetSettings }) {
  return (
    <div className="widgets-preview-wrap widgets-preview-wrap--eye">
      <EyeTracking
        eyeSize={Math.min(settings.eyeSize, 36)}
        gap={settings.gap}
        variant={settings.variant}
        irisColor={settings.irisColor}
        irisColorSecondary={settings.irisColorSecondary}
        pupilColor={settings.pupilColor}
        scleraColor={settings.scleraColor}
        pupilRange={settings.pupilRange}
        blinkInterval={settings.blinkInterval}
        showReflection={settings.showReflection}
        showIrisDetail={settings.showIrisDetail}
        reactivePupil={settings.reactivePupil}
        showEyelids={settings.showEyelids}
        idleAnimation={settings.idleAnimation}
      />
    </div>
  );
}

export default function EyeWidgetsPanel() {
  const settings = useEyeWidgetSettingsStore(
    useShallow((s) => ({
      enabled: s.enabled,
      variant: s.variant,
      eyeSize: s.eyeSize,
      gap: s.gap,
      irisColor: s.irisColor,
      irisColorSecondary: s.irisColorSecondary,
      pupilColor: s.pupilColor,
      scleraColor: s.scleraColor,
      pupilRange: s.pupilRange,
      blinkInterval: s.blinkInterval,
      showReflection: s.showReflection,
      showIrisDetail: s.showIrisDetail,
      idleAnimation: s.idleAnimation,
      reactivePupil: s.reactivePupil,
      showEyelids: s.showEyelids,
    }))
  );
  const setSettings = useEyeWidgetSettingsStore((s) => s.setSettings);
  const resetSettings = useEyeWidgetSettingsStore((s) => s.resetSettings);

  return (
    <div className="widgets-settings">
      <div className="widgets-settings-toolbar">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset eye
        </button>
      </div>

      <section className="widgets-settings-block">
        <WidgetToggle
          label="Show eye widget"
          description="Turn the tracking eyes on or off across the app."
          enabled={settings.enabled}
          onToggle={() => setSettings({ enabled: !settings.enabled })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Preview</h3>
        <EyeWidgetPreview settings={settings} />
      </section>

      <section className="widgets-settings-block">
      <h4 className="widgets-settings-subsection">Layout</h4>
      <WidgetSlider
        label="Eye size"
        value={settings.eyeSize}
        {...EYE_WIDGET_SETTINGS_LIMITS.eyeSize}
        onChange={(eyeSize) => setSettings({ eyeSize })}
      />
      <WidgetSlider
        label="Gap"
        value={settings.gap}
        {...EYE_WIDGET_SETTINGS_LIMITS.gap}
        onChange={(gap) => setSettings({ gap })}
      />

      <h4 className="widgets-settings-subsection">Appearance</h4>
      <WidgetVariantPicker
        value={settings.variant}
        onChange={(variant) => setSettings({ variant })}
      />
      <WidgetColor
        label="Iris"
        value={settings.irisColor}
        onChange={(irisColor) => setSettings({ irisColor })}
      />
      <WidgetColor
        label="Iris highlight"
        value={settings.irisColorSecondary}
        onChange={(irisColorSecondary) => setSettings({ irisColorSecondary })}
      />
      <WidgetColor
        label="Pupil"
        value={settings.pupilColor}
        onChange={(pupilColor) => setSettings({ pupilColor })}
      />
      <WidgetColor
        label="Sclera"
        value={settings.scleraColor}
        onChange={(scleraColor) => setSettings({ scleraColor })}
      />

      <h4 className="widgets-settings-subsection">Behavior</h4>
      <WidgetSlider
        label="Pupil range"
        value={settings.pupilRange}
        {...EYE_WIDGET_SETTINGS_LIMITS.pupilRange}
        unit=""
        displayValue={`${Math.round(settings.pupilRange * 100)}%`}
        onChange={(pupilRange) => setSettings({ pupilRange })}
      />
      <WidgetSlider
        label="Blink interval"
        value={settings.blinkInterval}
        {...EYE_WIDGET_SETTINGS_LIMITS.blinkInterval}
        unit=""
        displayValue={`${(settings.blinkInterval / 1000).toFixed(1)}s`}
        onChange={(blinkInterval) => setSettings({ blinkInterval })}
      />
      <WidgetToggle
        label="Reflection"
        description="Gloss highlight on the eye surface."
        enabled={settings.showReflection}
        onToggle={() =>
          setSettings({ showReflection: !settings.showReflection })
        }
      />
      <WidgetToggle
        label="Iris detail"
        description="Show radial texture inside the iris."
        enabled={settings.showIrisDetail}
        onToggle={() =>
          setSettings({ showIrisDetail: !settings.showIrisDetail })
        }
      />
      <WidgetToggle
        label="Reactive pupil"
        description="Pupil dilates when the cursor is near."
        enabled={settings.reactivePupil}
        onToggle={() =>
          setSettings({ reactivePupil: !settings.reactivePupil })
        }
      />
      <WidgetToggle
        label="Eyelids"
        description="Animate blinking eyelids."
        enabled={settings.showEyelids}
        onToggle={() => setSettings({ showEyelids: !settings.showEyelids })}
      />
      <WidgetToggle
        label="Idle animation"
        description="Subtle eye movement when the cursor is still."
        enabled={settings.idleAnimation}
        onToggle={() =>
          setSettings({ idleAnimation: !settings.idleAnimation })
        }
      />
      </section>
    </div>
  );
}
