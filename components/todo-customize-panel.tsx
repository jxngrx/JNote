'use client';

import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useTodoSettingsStore, TODO_SETTINGS_LIMITS } from '@/lib/todo-settings-store';

type SettingsTab = 'todo' | 'global';

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
};

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = 'px',
  onChange,
}: SliderFieldProps) {
  return (
    <div className="todo-customize-field">
      <div className="todo-customize-field-header">
        <label htmlFor={id}>{label}</label>
        <span className="todo-customize-field-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="todo-customize-range"
      />
    </div>
  );
}

type TodoCustomizePanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function TodoCustomizePanel({ open, onClose }: TodoCustomizePanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('todo');
  const containerWidth = useTodoSettingsStore((s) => s.containerWidth);
  const cardWidth = useTodoSettingsStore((s) => s.cardWidth);
  const cardHeight = useTodoSettingsStore((s) => s.cardHeight);
  const fontSize = useTodoSettingsStore((s) => s.fontSize);
  const setSettings = useTodoSettingsStore((s) => s.setSettings);
  const resetSettings = useTodoSettingsStore((s) => s.resetSettings);

  if (!open) return null;

  const limits = TODO_SETTINGS_LIMITS;

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div
        className="shortcuts-modal todo-customize-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="todo-customize-title"
      >
        <div className="shortcuts-modal-header">
          <h3 id="todo-customize-title">Customize</h3>
          <button type="button" onClick={onClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="todo-customize-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'todo'}
            className={`todo-customize-tab ${activeTab === 'todo' ? 'active' : ''}`}
            onClick={() => setActiveTab('todo')}
          >
            Todo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'global'}
            className={`todo-customize-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global
          </button>
        </div>

        <div className="todo-customize-body">
          {activeTab === 'todo' ? (
            <>
              <p className="todo-customize-desc">
                Adjust layout and typography for the todo view. Changes apply immediately.
              </p>

              <SliderField
                id="todo-container-width"
                label="Main container width"
                value={containerWidth}
                {...limits.containerWidth}
                onChange={(v) => setSettings({ containerWidth: v })}
              />
              <SliderField
                id="todo-card-width"
                label="Card width (grid columns)"
                value={cardWidth}
                {...limits.cardWidth}
                onChange={(v) => setSettings({ cardWidth: v })}
              />
              <SliderField
                id="todo-card-height"
                label="Card height"
                value={cardHeight}
                {...limits.cardHeight}
                onChange={(v) => setSettings({ cardHeight: v })}
              />
              <SliderField
                id="todo-font-size"
                label="Font size"
                value={fontSize}
                {...limits.fontSize}
                onChange={(v) => setSettings({ fontSize: v })}
              />

              <button
                type="button"
                className="todo-customize-reset"
                onClick={() => resetSettings()}
              >
                <RotateCcw size={14} />
                Reset to defaults
              </button>
            </>
          ) : (
            <div className="todo-customize-empty">
              <p className="todo-customize-empty-title">Global settings</p>
              <p className="todo-customize-empty-desc">
                App-wide customization will live here in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
