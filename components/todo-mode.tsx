'use client';

import { useState, useEffect } from 'react';
import { useTodoStore } from '@/lib/todo-store';
import { Check, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function TodoMode() {
  const tasks = useTodoStore((state) => state.tasks);
  const categories = useTodoStore((state) => state.categories);
  const selectedDate = useTodoStore((state) => state.selectedDate);
  const createTask = useTodoStore((state) => state.createTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const toggleTask = useTodoStore((state) => state.toggleTask);
  const setSelectedDate = useTodoStore((state) => state.setSelectedDate);
  const addCategory = useTodoStore((state) => state.addCategory);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('PERSONAL');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Get tasks for selected date
  const dateTasks = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
    return taskDate === selectedDate;
  });

  // Calculate progress
  const totalTasks = dateTasks.length;
  const completedTasks = dateTasks.filter((t) => t.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by category
  const tasksByCategory = categories.reduce((acc, category) => {
    acc[category] = dateTasks.filter((task) => task.category === category);
    return acc;
  }, {} as Record<string, typeof dateTasks>);

  // Get date range for selector (today + 5 days)
  const getDateRange = () => {
    const dates = [];
    const today = new Date(selectedDate);
    for (let i = -2; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return {
      day: days[date.getDay()],
      date: date.getDate().toString(),
      isToday: date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      isSelected: date.toISOString().split('T')[0] === selectedDate,
    };
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTask(newTaskTitle.trim(), newTaskCategory);
      setNewTaskTitle('');
      setNewTaskCategory('PERSONAL');
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
          createTask(line, newTaskCategory);
          if (index === lines.length - 1) {
            setIsProcessingBulk(false);
            setNewTaskTitle('');
            setNewTaskCategory('PERSONAL');
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

  const handleStartEdit = (task: typeof tasks[0]) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    if (editingTitle.trim()) {
      updateTask(taskId, { title: editingTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, taskId?: string) => {
    if (e.key === 'Enter') {
      if (taskId && editingTaskId === taskId) {
        handleSaveEdit(taskId);
      } else {
        // Check if text contains multiple lines (Shift+Enter or pasted multi-line)
        const text = (e.target as HTMLInputElement).value;
        if (text.includes('\n') || text.includes('\r')) {
          e.preventDefault();
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
        <h1 className="todo-title">Today</h1>
      </div>

      {/* Date Selector */}
      <div className="todo-date-selector">
        {getDateRange().map((date, index) => {
          const formatted = formatDate(date);
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
              className={`todo-date-btn ${formatted.isSelected ? 'selected' : ''} ${formatted.isToday ? 'today' : ''}`}
            >
              <span className="todo-date-day">{formatted.day}</span>
              <span className="todo-date-number">{formatted.date}</span>
            </button>
          );
        })}
      </div>

      {/* Progress Card */}
      <div className="todo-progress-card">
        <div className="todo-progress-content">
          <div className="todo-progress-text">
            <div className="todo-progress-label">Todo Done</div>
            <div className="todo-progress-subtitle">keep it up</div>
          </div>
          <div className="todo-progress-circle">
            <div className="todo-progress-value">
              {completedTasks}/{totalTasks}
            </div>
          </div>
        </div>
      </div>

      {/* Task List by Category */}
      <div className="todo-tasks-container">
        {categories.map((category) => {
          const categoryTasks = tasksByCategory[category] || [];
          if (categoryTasks.length === 0) return null;

          return (
            <div key={category} className="todo-category-section">
              <div className="todo-category-title">{category}</div>
              <div className="todo-tasks-list">
                {categoryTasks.map((task) => (
                  <div key={task.id} className={`todo-task-item ${task.completed ? 'completed' : ''}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
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
                            onClick={() => deleteTask(task.id)}
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
            </div>
          );
        })}
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
        <select
          value={newTaskCategory}
          onChange={(e) => setNewTaskCategory(e.target.value)}
          className="todo-category-select"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
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
          disabled={isProcessingBulk || !newTaskTitle.trim()}
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
