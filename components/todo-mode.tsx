'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { normalizeTodoList, useTodoStore } from '@/lib/todo-store';
import type { TodoItem } from '@/lib/todo-store';
import {
  computeListProgress,
  getColumnByRole,
  isDoneColumnId,
} from '@/lib/todo-column-utils';
import { Check, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  useTodoSettingsStore,
  todoSettingsToCssVars,
  DEFAULT_TODO_SETTINGS,
  pickTodoSoundSettings,
} from '@/lib/todo-settings-store';
import { playTodoCompleteSound, playTodoMoveSound } from '@/lib/todo-sounds';
import { useTodoUiStore } from '@/lib/todo-ui-store';
import { useSettingsUiStore } from '@/lib/settings-ui-store';
import TodoKanbanBoard from '@/components/todo-kanban-board';
import TodoCelebrationOverlay, {
  useTodoCelebration,
} from '@/components/todo-celebration-effects';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import './todo-kanban.css';
import { NATIVE_SCROLL_CLASS } from '@/components/ui/scroll-area';

function formatRelativeTime(timestamp: number) {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type TaskCardProps = {
  task: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
};

function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const timeLabel = formatRelativeTime(task.createdAt);

  return (
    <article className={`todo-task todo-task--grid ${task.completed ? 'completed' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`todo-checkbox ${task.completed ? 'checked' : ''}`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check size={12} strokeWidth={2.5} />}
      </button>

      <div className="todo-task-main">
        <span className="todo-task-title" title={task.title}>
          {task.title}
        </span>
        {timeLabel && <span className="todo-task-meta">{timeLabel}</span>}
      </div>

      <div className="todo-task-actions">
        <button
          type="button"
          onClick={onDelete}
          className="todo-action-btn todo-action-btn--danger"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </article>
  );
}

export default function TodoMode() {
  const lists = useTodoStore((state) => state.lists);
  const activeListId = useTodoStore((state) => state.activeListId);
  const createList = useTodoStore((state) => state.createList);
  const createItem = useTodoStore((state) => state.createItem);
  const createDraftItem = useTodoStore((state) => state.createDraftItem);
  const updateItem = useTodoStore((state) => state.updateItem);
  const updateList = useTodoStore((state) => state.updateList);
  const deleteItem = useTodoStore((state) => state.deleteItem);
  const discardItem = useTodoStore((state) => state.discardItem);
  const toggleItem = useTodoStore((state) => state.toggleItem);
  const moveItem = useTodoStore((state) => state.moveItem);
  const updateColumn = useTodoStore((state) => state.updateColumn);

  const viewMode = useTodoUiStore((s) => s.viewMode);
  const openSettings = useSettingsUiStore((s) => s.openSettings);

  const { glowActive, glowKey, triggerProgressGlow, triggerDoneConfetti } =
    useTodoCelebration();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');
  const [editingListTitle, setEditingListTitle] = useState(false);
  const [listTitleDraft, setListTitleDraft] = useState('');

  const containerWidth = useTodoSettingsStore((s) => s.containerWidth);
  const cardWidth = useTodoSettingsStore((s) => s.cardWidth);
  const cardHeight = useTodoSettingsStore((s) => s.cardHeight);
  const fontSize = useTodoSettingsStore((s) => s.fontSize);
  const columnWidth =
    useTodoSettingsStore((s) => s.columnWidth) ?? DEFAULT_TODO_SETTINGS.columnWidth;
  const todoSoundSettings = useTodoSettingsStore(
    useShallow(pickTodoSoundSettings)
  );

  const customizeStyle = todoSettingsToCssVars({
    containerWidth,
    cardWidth,
    cardHeight,
    fontSize,
    columnWidth,
  });

  const activeList = useMemo(() => {
    const list = lists.find((l) => l.id === activeListId);
    if (!list) return null;
    return normalizeTodoList(list);
  }, [lists, activeListId]);

  const commitListTitle = () => {
    if (!activeList) return;
    const trimmed = listTitleDraft.trim();
    if (trimmed) {
      updateList(activeList.id, { title: trimmed });
    }
    setEditingListTitle(false);
  };

  const stats = useMemo(() => {
    if (!activeList) return { total: 0, done: 0, active: 0, pct: 0 };
    const total = activeList.items.length;
    const done = activeList.items.filter((i) => i.completed).length;
    const pct =
      viewMode === 'kanban'
        ? computeListProgress(activeList.items, activeList.columns)
        : total > 0
          ? Math.round((done / total) * 100)
          : 0;
    return {
      total,
      done,
      active: total - done,
      pct,
    };
  }, [activeList, viewMode]);

  const handleMoveCelebration = useCallback(
    (fromColumnId: string, toColumnId: string) => {
      if (!activeList || fromColumnId === toColumnId) return;

      const doneId = getColumnByRole(activeList.columns, 'done')?.id ?? null;
      const movedToDone = isDoneColumnId(toColumnId, activeList.columns);

      if (doneId && movedToDone && fromColumnId !== doneId) {
        playTodoCompleteSound(todoSoundSettings);
        triggerDoneConfetti();
        return;
      }

      playTodoMoveSound(todoSoundSettings);
      triggerProgressGlow();
    },
    [
      activeList,
      todoSoundSettings,
      triggerProgressGlow,
      triggerDoneConfetti,
    ]
  );

  const handleToggleItem = useCallback(
    (id: string) => {
      if (!activeList) return;
      const item = activeList.items.find((entry) => entry.id === id);
      if (!item) return;

      const fromColumnId = item.columnId;
      const doneId = getColumnByRole(activeList.columns, 'done')?.id;
      const startId = getColumnByRole(activeList.columns, 'start')?.id;
      const toColumnId = item.completed ? startId : doneId;

      toggleItem(id);

      if (toColumnId) {
        handleMoveCelebration(fromColumnId, toColumnId);
      }
    },
    [activeList, toggleItem, handleMoveCelebration]
  );

  const visibleTasks = activeList
    ? activeList.items.filter((t) =>
        activeTab === 'done' ? t.completed : !t.completed
      )
    : [];

  useEffect(() => {
    if (!activeListId && lists.length === 0) {
      createList();
    }
  }, [activeListId, lists.length, createList]);

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createItem(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleBulkCreate = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    setIsProcessingBulk(true);

    lines.forEach((line, index) => {
      const isHeader = /^[A-Z\s]+:?\s*$/.test(line) || /^[-=]+$/.test(line);
      if (!isHeader) {
        setTimeout(() => {
          createItem(line);
          if (index === lines.length - 1) {
            setIsProcessingBulk(false);
            setNewTaskTitle('');
          }
        }, index * 10);
      } else if (index === lines.length - 1) {
        setIsProcessingBulk(false);
        setNewTaskTitle('');
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n') || pastedText.includes('\r')) {
      e.preventDefault();
      handleBulkCreate(pastedText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = (e.target as HTMLTextAreaElement).value;
      if (text.includes('\n') || text.includes('\r')) {
        handleBulkCreate(text);
      } else {
        handleCreateTask();
      }
    }
  };

  return (
    <>
      <div
        className={`todo-mode-container ${viewMode}-view`}
        style={customizeStyle}
      >
        <header className="todo-header">
          <div className="todo-header-top">
            <div className="todo-header-title-block">
              {editingListTitle && activeList ? (
                <input
                  className="todo-title-input"
                  value={listTitleDraft}
                  onChange={(e) => setListTitleDraft(e.target.value)}
                  onBlur={commitListTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitListTitle();
                    if (e.key === 'Escape') setEditingListTitle(false);
                  }}
                  autoFocus
                  aria-label="List title"
                />
              ) : (
                <h1
                  className="todo-title todo-title--editable"
                  onClick={() => {
                    if (!activeList) return;
                    setListTitleDraft(activeList.title);
                    setEditingListTitle(true);
                  }}
                  title="Click to rename"
                >
                  {activeList?.title || 'Todo'}
                </h1>
              )}
              {activeList && stats.total > 0 && (
                <p className="todo-subtitle">
                  {stats.active} active · {stats.done} done
                </p>
              )}
            </div>

            <div className="todo-header-actions">
              <Button
                type="button"
                variant="icon"
                className="todo-header-icon-btn"
                onClick={() =>
                  openSettings(
                    viewMode === 'kanban' ? 'todo-kanban' : 'todo-grid'
                  )
                }
                title={
                  viewMode === 'kanban' ? 'Kanban settings' : 'Grid settings'
                }
                aria-label={
                  viewMode === 'kanban' ? 'Kanban settings' : 'Grid settings'
                }
              >
                <SlidersHorizontal size={16} strokeWidth={2} />
              </Button>
            </div>
          </div>
          {activeList && stats.total > 0 && (
            <div className="todo-progress-row">
              <div className="todo-progress-track" aria-hidden>
                <div
                  className="todo-progress-fill"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <span className="todo-progress-label">{stats.pct}%</span>
            </div>
          )}
        </header>

        {viewMode === 'kanban' ? (
          <div className="todo-kanban-scroll">
            {!activeList ? (
              <p className="todo-empty">Create a todo list to start.</p>
            ) : (
              <TodoKanbanBoard
                columns={activeList.columns}
                items={activeList.items}
                columnWidth={columnWidth}
                fontSize={fontSize}
                onMoveItem={moveItem}
                onToggleItem={handleToggleItem}
                onDeleteItem={deleteItem}
                onDiscardItem={discardItem}
                onUpdateItem={(id, title) => updateItem(id, { title })}
                onCreateDraft={(columnId) => createDraftItem(columnId)}
                onRenameColumn={(columnId, title) =>
                  updateColumn(columnId, { title })
                }
                onItemMoved={({ fromColumnId, toColumnId }) =>
                  handleMoveCelebration(fromColumnId, toColumnId)
                }
              />
            )}
          </div>
        ) : (
          <ScrollArea className="todo-tasks-container">
            {!activeList ? (
              <p className="todo-empty">Create a todo list to start.</p>
            ) : activeList.items.length === 0 ? (
              <p className="todo-empty">No tasks yet — add one below.</p>
            ) : (
              <>
                <div className="todo-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'active'}
                    className={`todo-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                  >
                    Active
                    <span className="todo-tab-count">{stats.active}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'done'}
                    className={`todo-tab-btn ${activeTab === 'done' ? 'active' : ''}`}
                    onClick={() => setActiveTab('done')}
                  >
                    Done
                    <span className="todo-tab-count">{stats.done}</span>
                  </button>
                </div>

                {visibleTasks.length === 0 ? (
                  <p className="todo-empty">
                    {activeTab === 'done'
                      ? 'No completed tasks yet.'
                      : 'All caught up — nothing active.'}
                  </p>
                ) : (
                  <div className="todo-tasks-grid">
                    {visibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggleItem(task.id)}
                        onDelete={() => deleteItem(task.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        )}

        {viewMode === 'grid' && (
          <div className="todo-input-container">
            <textarea
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Add a task or paste multiple lines…"
              className={`todo-input todo-textarea ${NATIVE_SCROLL_CLASS}`}
              rows={1}
              disabled={!activeList}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newTaskTitle.includes('\n') || newTaskTitle.includes('\r')) {
                  handleBulkCreate(newTaskTitle);
                } else {
                  handleCreateTask();
                }
              }}
              className="todo-add-btn"
              title="Add task(s)"
              disabled={isProcessingBulk || !newTaskTitle.trim() || !activeList}
            >
              {isProcessingBulk ? (
                <span className="todo-loading">…</span>
              ) : (
                <Plus size={18} />
              )}
            </button>
          </div>
        )}
      </div>

      <TodoCelebrationOverlay glowActive={glowActive} glowKey={glowKey} />
    </>
  );
}
