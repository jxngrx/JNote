'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { TodoColumnManagerContent } from '@/components/todo-column-manager';
import { normalizeTodoList, useTodoStore } from '@/lib/todo-store';
import {
  TODO_SETTINGS_LIMITS,
  useTodoSettingsStore,
} from '@/lib/todo-settings-store';
import {
  TodoSettingsSlider,
  TodoSoundSettingsBlock,
} from '@/components/settings/todo-settings-shared';

export default function TodoKanbanSettingsPanel() {
  const lists = useTodoStore((s) => s.lists);
  const activeListId = useTodoStore((s) => s.activeListId);
  const addColumn = useTodoStore((s) => s.addColumn);
  const updateColumn = useTodoStore((s) => s.updateColumn);
  const deleteColumn = useTodoStore((s) => s.deleteColumn);
  const reorderMiddleColumns = useTodoStore((s) => s.reorderMiddleColumns);

  const columnWidth = useTodoSettingsStore((s) => s.columnWidth);
  const fontSize = useTodoSettingsStore((s) => s.fontSize);
  const setSettings = useTodoSettingsStore((s) => s.setSettings);
  const resetKanbanSettings = useTodoSettingsStore((s) => s.resetKanbanSettings);
  const resetSoundSettings = useTodoSettingsStore((s) => s.resetSoundSettings);

  const activeList = useMemo(() => {
    const list = lists.find((entry) => entry.id === activeListId);
    if (!list) return null;
    return normalizeTodoList(list);
  }, [lists, activeListId]);

  const limits = TODO_SETTINGS_LIMITS;

  return (
    <div className="widgets-settings">
      <div className="widgets-settings-toolbar">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={() => {
            resetKanbanSettings();
            resetSoundSettings();
          }}
        >
          <RotateCcw size={14} />
          Reset kanban
        </button>
      </div>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Columns</h3>
        {!activeList ? (
          <p className="widgets-settings-subheading">
            Create or select a todo list to manage board columns.
          </p>
        ) : (
          <TodoColumnManagerContent
            embedded
            columns={activeList.columns}
            onAddColumn={(title) => addColumn(title)}
            onUpdateColumn={(columnId, title) =>
              updateColumn(columnId, { title })
            }
            onDeleteColumn={(columnId) => deleteColumn(columnId)}
            onReorderMiddleColumns={(orderedIds) =>
              reorderMiddleColumns(orderedIds)
            }
          />
        )}
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Layout</h3>
        <TodoSettingsSlider
          id="todo-kanban-column-width"
          label="Column width"
          value={columnWidth}
          {...limits.columnWidth}
          onChange={(v) => setSettings({ columnWidth: v })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Typography</h3>
        <TodoSettingsSlider
          id="todo-kanban-font-size"
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
