'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTodoStore } from '@/lib/todo-store';
import type { TodoItem } from '@/lib/todo-store';
import { Check, Plus, Trash2, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import {
  useTodoSettingsStore,
  todoSettingsToCssVars,
} from '@/lib/todo-settings-store';
import TodoCustomizePanel from '@/components/todo-customize-panel';

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

type TaskItemProps = {
  task: TodoItem;
  variant: 'grid' | 'list';
  onToggle: () => void;
  onDelete: () => void;
};

function TaskItem({ task, variant, onToggle, onDelete }: TaskItemProps) {
  const timeLabel = formatRelativeTime(task.createdAt);
  const isGrid = variant === 'grid';

  return (
    <article
      className={`todo-task ${isGrid ? 'todo-task--grid' : 'todo-task--list'} ${
        task.completed ? 'completed' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`todo-checkbox ${task.completed ? 'checked' : ''}`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check size={isGrid ? 12 : 14} strokeWidth={2.5} />}
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
  const deleteItem = useTodoStore((state) => state.deleteItem);
  const toggleItem = useTodoStore((state) => state.toggleItem);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCustomize, setShowCustomize] = useState(false);
  const containerWidth = useTodoSettingsStore((s) => s.containerWidth);
  const cardWidth = useTodoSettingsStore((s) => s.cardWidth);
  const cardHeight = useTodoSettingsStore((s) => s.cardHeight);
  const fontSize = useTodoSettingsStore((s) => s.fontSize);

  const customizeStyle = todoSettingsToCssVars({
    containerWidth,
    cardWidth,
    cardHeight,
    fontSize,
  });

  useEffect(() => {
    const saved = localStorage.getItem('todo-view-mode');
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('todo-view-mode', mode);
  };

  const activeList = lists.find((l) => l.id === activeListId) || null;

  const stats = useMemo(() => {
    if (!activeList) return { total: 0, done: 0, active: 0, pct: 0 };
    const total = activeList.items.length;
    const done = activeList.items.filter((i) => i.completed).length;
    return {
      total,
      done,
      active: total - done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [activeList]);

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

  const renderTask = (task: TodoItem) => (
    <TaskItem
      key={task.id}
      task={task}
      variant={viewMode}
      onToggle={() => toggleItem(task.id)}
      onDelete={() => deleteItem(task.id)}
    />
  );

  return (
    <>
    <div
      className={`todo-mode-container ${viewMode}-view`}
      style={customizeStyle}
    >
      <header className="todo-header">
        <div className="todo-header-top">
          <div className="todo-header-title-block">
            <h1 className="todo-title">{activeList?.title || 'Todo'}</h1>
            {activeList && stats.total > 0 && (
              <p className="todo-subtitle">
                {stats.active} active · {stats.done} done
              </p>
            )}
          </div>
          <div className="todo-header-actions">
            <div className="todo-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                className={`todo-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`todo-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="todo-view-btn todo-customize-trigger"
              title="Customize todo"
              aria-label="Customize todo"
            >
              <SlidersHorizontal size={15} />
            </button>
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

      <div className="todo-tasks-container">
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
              <div
                className={
                  viewMode === 'grid' ? 'todo-tasks-grid' : 'todo-tasks-list'
                }
              >
                {visibleTasks.map(renderTask)}
              </div>
            )}
          </>
        )}
      </div>

      <div className="todo-input-container">
        <textarea
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Add a task or paste multiple lines…"
          className="todo-input todo-textarea"
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
    </div>
    <TodoCustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
    </>
  );
}
