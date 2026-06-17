'use client';

import { RotateCcw } from 'lucide-react';
import {
  TODO_SETTINGS_LIMITS,
  useTodoSettingsStore,
} from '@/lib/todo-settings-store';
import {
  TodoSettingsSlider,
  TodoSoundSettingsBlock,
} from '@/components/settings/todo-settings-shared';

export default function TodoGridSettingsPanel() {
  const containerWidth = useTodoSettingsStore((s) => s.containerWidth);
  const cardWidth = useTodoSettingsStore((s) => s.cardWidth);
  const cardHeight = useTodoSettingsStore((s) => s.cardHeight);
  const fontSize = useTodoSettingsStore((s) => s.fontSize);
  const setSettings = useTodoSettingsStore((s) => s.setSettings);
  const resetGridSettings = useTodoSettingsStore((s) => s.resetGridSettings);
  const resetSoundSettings = useTodoSettingsStore((s) => s.resetSoundSettings);

  const limits = TODO_SETTINGS_LIMITS;

  return (
    <div className="widgets-settings">
      <div className="widgets-settings-toolbar">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={() => {
            resetGridSettings();
            resetSoundSettings();
          }}
        >
          <RotateCcw size={14} />
          Reset grid
        </button>
      </div>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Layout</h3>
        <TodoSettingsSlider
          id="todo-grid-container-width"
          label="Container width"
          value={containerWidth}
          {...limits.containerWidth}
          onChange={(v) => setSettings({ containerWidth: v })}
        />
        <TodoSettingsSlider
          id="todo-grid-card-width"
          label="Card width"
          value={cardWidth}
          {...limits.cardWidth}
          onChange={(v) => setSettings({ cardWidth: v })}
        />
        <TodoSettingsSlider
          id="todo-grid-card-height"
          label="Card height"
          value={cardHeight}
          {...limits.cardHeight}
          onChange={(v) => setSettings({ cardHeight: v })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Typography</h3>
        <TodoSettingsSlider
          id="todo-grid-font-size"
          label="Font size"
          value={fontSize}
          {...limits.fontSize}
          onChange={(v) => setSettings({ fontSize: v })}
        />
      </section>

      <TodoSoundSettingsBlock />
    </div>
  );
}
