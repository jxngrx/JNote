'use client';

import { useState, useEffect } from 'react';
import { useTodoStore } from '@/lib/todo-store';
import { Check, Plus, Edit2, Trash2 } from 'lucide-react';

export default function TodoMode() {
  const lists = useTodoStore((state) => state.lists);
  const activeListId = useTodoStore((state) => state.activeListId);
  const createList = useTodoStore((state) => state.createList);
  const updateList = useTodoStore((state) => state.updateList);
  const deleteList = useTodoStore((state) => state.deleteList);
  const createItem = useTodoStore((state) => state.createItem);
  const updateItem = useTodoStore((state) => state.updateItem);
  const deleteItem = useTodoStore((state) => state.deleteItem);
  const toggleItem = useTodoStore((state) => state.toggleItem);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');

  const activeList = lists.find((l) => l.id === activeListId) || null;
  const visibleTasks = activeList
    ? activeList.items.filter((t) => (activeTab === 'done' ? t.completed : !t.completed))
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
    // Split by lines and filter out empty lines
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    setIsProcessingBulk(true);

    // Create tasks for each line
    lines.forEach((line, index) => {
      // Skip lines that are just headers or separators (like "MOM:", "VERSION 2:", "CHANGES:", "NEW FEATURE:")
      const isHeader = /^[A-Z\s]+:?\s*$/.test(line) || /^[-=]+$/.test(line);
      if (!isHeader) {
        // Small delay to ensure proper order
        setTimeout(() => {
          createItem(line);
          if (index === lines.length - 1) {
            setIsProcessingBulk(false);
            setNewTaskTitle('');
          }
        }, index * 10);
      } else {
        if (index === lines.length - 1) {
          setIsProcessingBulk(false);
          setNewTaskTitle('');
        }
      }
    });

    if (lines.length === 0) {
      setIsProcessingBulk(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');

    // Check if pasted text contains multiple lines
    if (pastedText.includes('\n') || pastedText.includes('\r')) {
      e.preventDefault();
      handleBulkCreate(pastedText);
    }
  };

  const handleStartEdit = (task: { id: string; title: string }) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    if (editingTitle.trim()) {
      updateItem(taskId, { title: editingTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, taskId?: string) => {
    if (e.key === 'Enter') {
      if (taskId && editingTaskId === taskId) {
        e.preventDefault();
        handleSaveEdit(taskId);
      } else {
        e.preventDefault();
        // Check if text contains multiple lines (Shift+Enter or pasted multi-line)
        const text = (e.target as HTMLInputElement).value;
        if (text.includes('\n') || text.includes('\r')) {
          handleBulkCreate(text);
        } else {
          handleCreateTask();
        }
      }
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
      setEditingTitle('');
    }
  };

  return (
    <div className="todo-mode-container">
      {/* Header */}
      <div className="todo-header">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="todo-title">{activeList?.title || 'Todo'}</h1>
            <div className="text-sm text-white/40">
              {activeList ? `${activeList.items.filter((i) => i.completed).length}/${activeList.items.length} done` : 'No list selected'}
            </div>
          </div>
          {activeList && (
            <button
              onClick={() => {
                const title = window.prompt('Todo list title', activeList.title);
                if (title !== null) updateList(activeList.id, { title });
              }}
              className="toolbar-btn"
              title="Rename list"
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="todo-tasks-container">
        {!activeList ? (
          <div className="text-white/40">Create a todo list to start.</div>
        ) : activeList.items.length === 0 ? (
          <div className="text-white/40">No tasks yet.</div>
        ) : (
          <>
            <div className="todo-tabs">
              <button
                type="button"
                className={`todo-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active
                <span className="todo-tab-count">
                  {activeList.items.filter((i) => !i.completed).length}
                </span>
              </button>
              <button
                type="button"
                className={`todo-tab-btn ${activeTab === 'done' ? 'active' : ''}`}
                onClick={() => setActiveTab('done')}
              >
                Done
                <span className="todo-tab-count">
                  {activeList.items.filter((i) => i.completed).length}
                </span>
              </button>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="text-white/40">
                {activeTab === 'done' ? 'No completed tasks yet.' : 'No active tasks.'}
              </div>
            ) : (
              <div className="todo-tasks-list">
                {visibleTasks.map((task) => (
              <div key={task.id} className={`todo-task-item ${task.completed ? 'completed' : ''}`}>
                <button
                  onClick={() => toggleItem(task.id)}
                  className={`todo-checkbox ${task.completed ? 'checked' : ''}`}
                >
                  {task.completed && <Check size={16} />}
                </button>
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(task.id)}
                    onKeyDown={(e) => handleKeyDown(e, task.id)}
                    className="todo-edit-input"
                    autoFocus
                  />
                ) : (
                  <span className="todo-task-title">{task.title}</span>
                )}
                <div className="todo-task-actions">
                  {editingTaskId !== task.id && (
                    <>
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="todo-action-btn"
                        title="Edit task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteItem(task.id)}
                        className="todo-action-btn"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Task Input */}
      <div className="todo-input-container">
        <textarea
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="write your next task or paste multiple lines"
          className="todo-input todo-textarea"
          rows={1}
          onInput={(e) => {
            // Auto-resize textarea
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button
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
            <span className="todo-loading">...</span>
          ) : (
            <Plus size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
