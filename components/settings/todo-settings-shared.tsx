'use client';

import { useRef } from 'react';
import { Play, Upload, X } from 'lucide-react';
import {
  deleteTodoCustomSound,
  saveTodoCustomSound,
} from '@/lib/todo-custom-sounds-db';
import {
  previewBuiltInCompleteSound,
  previewBuiltInMoveSound,
  previewTodoCompleteSound,
  previewTodoCustomSound,
  previewTodoMoveSound,
  type TodoCompleteSoundPreset,
  type TodoMoveSoundPreset,
} from '@/lib/todo-sounds';
import {
  TODO_COMPLETE_SOUND_OPTIONS,
  TODO_MOVE_SOUND_OPTIONS,
  useTodoSettingsStore,
  type TodoSettings,
} from '@/lib/todo-settings-store';

export function TodoSettingsSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = 'px',
  onChange,
}: {
  id: string;
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
      <label className="widgets-setting-label" htmlFor={id}>
        {label}
      </label>
      <div className="widgets-setting-control">
        <input
          id={id}
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

function TodoSettingsToggle({
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

function SoundPresetPicker<T extends string>({
  label,
  value,
  options,
  onChange,
  onPreview,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  onPreview: (value: T) => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--variant">
      <span className="widgets-setting-label">{label}</span>
      <div className="widgets-variant-picker">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`widgets-variant-picker-btn${
              value === option.id ? ' is-active' : ''
            }`}
            onClick={() => {
              onChange(option.id);
              onPreview(option.id);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomSoundUpload({
  label,
  fileName,
  onUpload,
  onClear,
}: {
  label: string;
  fileName: string | null;
  onUpload: (file: File) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="widgets-setting-row widgets-setting-row--action">
      <div className="widgets-setting-copy">
        <strong>{label}</strong>
        <span>
          {fileName ??
            'Stored locally in your browser — never uploaded to a server.'}
        </span>
      </div>
      <div className="todo-sound-upload-actions">
        <button
          type="button"
          className="widgets-setting-action-btn"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} />
          Import
        </button>
        {fileName && (
          <button
            type="button"
            className="widgets-setting-action-btn"
            onClick={() => void onClear()}
            aria-label={`Clear ${label}`}
          >
            <X size={13} />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void onUpload(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function TodoSoundSettingsBlock() {
  const settings = useTodoSettingsStore();
  const setSettings = useTodoSettingsStore((s) => s.setSettings);

  const soundSnapshot: TodoSettings = {
    ...settings,
  };

  const handleCompletePreset = (preset: TodoCompleteSoundPreset) => {
    setSettings({ completeSound: preset, completeSoundCustomName: null });
  };

  const handleMovePreset = (preset: TodoMoveSoundPreset) => {
    setSettings({ moveSound: preset, moveSoundCustomName: null });
  };

  const handleCompleteUpload = async (file: File) => {
    await saveTodoCustomSound('complete', file);
    setSettings({ completeSoundCustomName: file.name });
    await previewTodoCustomSound('complete');
  };

  const handleMoveUpload = async (file: File) => {
    await saveTodoCustomSound('move', file);
    setSettings({ moveSoundCustomName: file.name });
    await previewTodoCustomSound('move');
  };

  const handleCompleteClear = async () => {
    await deleteTodoCustomSound('complete');
    setSettings({ completeSoundCustomName: null });
  };

  const handleMoveClear = async () => {
    await deleteTodoCustomSound('move');
    setSettings({ moveSoundCustomName: null });
  };

  return (
    <section className="widgets-settings-block">
      <h3 className="widgets-settings-heading">Sound effects</h3>
      <p className="widgets-settings-subheading">
        Play sounds when you complete tasks or move cards between columns.
        Custom sounds are saved in browser storage on this device.
      </p>

      <TodoSettingsToggle
        label="Sound effects"
        description="Enable or disable todo sounds."
        enabled={settings.soundsEnabled}
        onToggle={() =>
          setSettings({ soundsEnabled: !settings.soundsEnabled })
        }
      />

      <SoundPresetPicker
        label="Complete task"
        value={settings.completeSoundCustomName ? 'custom' : settings.completeSound}
        options={[
          ...TODO_COMPLETE_SOUND_OPTIONS,
          ...(settings.completeSoundCustomName
            ? [{ id: 'custom' as const, label: 'Custom' }]
            : []),
        ]}
        onChange={(value) => {
          if (value === 'custom') return;
          handleCompletePreset(value as TodoCompleteSoundPreset);
        }}
        onPreview={(value) => {
          if (value === 'custom') {
            void previewTodoCustomSound('complete');
            return;
          }
          previewBuiltInCompleteSound(value as TodoCompleteSoundPreset);
        }}
      />
      <CustomSoundUpload
        label="Custom complete sound"
        fileName={settings.completeSoundCustomName}
        onUpload={handleCompleteUpload}
        onClear={handleCompleteClear}
      />
      <div className="widgets-setting-row widgets-setting-row--action">
        <div className="widgets-setting-copy">
          <strong>Preview complete</strong>
          <span>Test the completion sound.</span>
        </div>
        <button
          type="button"
          className="widgets-setting-action-btn"
          onClick={() => previewTodoCompleteSound(soundSnapshot)}
        >
          <Play size={13} />
          Play
        </button>
      </div>

      <SoundPresetPicker
        label="Move column"
        value={settings.moveSoundCustomName ? 'custom' : settings.moveSound}
        options={[
          ...TODO_MOVE_SOUND_OPTIONS,
          ...(settings.moveSoundCustomName
            ? [{ id: 'custom' as const, label: 'Custom' }]
            : []),
        ]}
        onChange={(value) => {
          if (value === 'custom') return;
          handleMovePreset(value as TodoMoveSoundPreset);
        }}
        onPreview={(value) => {
          if (value === 'custom') {
            void previewTodoCustomSound('move');
            return;
          }
          previewBuiltInMoveSound(value as TodoMoveSoundPreset);
        }}
      />
      <CustomSoundUpload
        label="Custom move sound"
        fileName={settings.moveSoundCustomName}
        onUpload={handleMoveUpload}
        onClear={handleMoveClear}
      />
      <div className="widgets-setting-row widgets-setting-row--action">
        <div className="widgets-setting-copy">
          <strong>Preview move</strong>
          <span>Test the column move sound.</span>
        </div>
        <button
          type="button"
          className="widgets-setting-action-btn"
          onClick={() => previewTodoMoveSound(soundSnapshot)}
        >
          <Play size={13} />
          Play
        </button>
      </div>
    </section>
  );
}
