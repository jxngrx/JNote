'use client';

import { useState } from 'react';
import { GripVertical, Lock, Plus, Trash2, X } from 'lucide-react';
import type { KanbanColumn } from '@/lib/todo-store';
import {
  getDoneColumn,
  getMiddleColumns,
  getStartColumn,
  sortColumns,
} from '@/lib/todo-column-utils';
import './todo-kanban.css';

export type TodoColumnManagerContentProps = {
  columns: KanbanColumn[];
  onAddColumn: (title: string) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderMiddleColumns: (orderedMiddleIds: string[]) => void;
  embedded?: boolean;
};

export function TodoColumnManagerContent({
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderMiddleColumns,
  embedded = false,
}: TodoColumnManagerContentProps) {
  const [newTitle, setNewTitle] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const sorted = sortColumns(columns);
  const startColumn = getStartColumn(sorted);
  const doneColumn = getDoneColumn(sorted);
  const middleColumns = getMiddleColumns(sorted);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddColumn(trimmed);
    setNewTitle('');
  };

  const moveMiddleColumn = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = middleColumns.map((col) => col.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, fromId);
    onReorderMiddleColumns(ids);
  };

  const renderLockedRow = (column: KanbanColumn) => (
    <div key={column.id} className="todo-column-manager-row is-locked">
      <span className="todo-column-manager-lock" aria-hidden>
        <Lock size={13} />
      </span>
      <input
        className="todo-column-manager-input"
        value={column.title}
        readOnly
        aria-label={`${column.title} (locked)`}
      />
      <span className="todo-column-manager-locked-label">Locked</span>
    </div>
  );

  return (
    <div
      className={`todo-column-manager-content${
        embedded ? ' todo-column-manager-content--embedded' : ''
      }`}
    >
      <p className="todo-column-manager-subtitle">
        To Do and Done stay fixed. Add, rename, reorder, or remove the stages
        between them.
      </p>

      <div className="todo-column-manager-list">
        {startColumn && renderLockedRow(startColumn)}

        {middleColumns.map((column) => (
          <div
            key={column.id}
            className={`todo-column-manager-row ${dragId === column.id ? 'is-dragging' : ''}`}
            draggable
            onDragStart={() => setDragId(column.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) moveMiddleColumn(dragId, column.id);
              setDragId(null);
            }}
          >
            <span className="todo-column-manager-grip" aria-hidden>
              <GripVertical size={14} />
            </span>
            <input
              className="todo-column-manager-input"
              value={column.title}
              onChange={(e) => onUpdateColumn(column.id, e.target.value)}
              aria-label={`Column name for ${column.title}`}
            />
            <button
              type="button"
              className="todo-column-manager-delete"
              onClick={() => onDeleteColumn(column.id)}
              disabled={middleColumns.length === 0}
              title="Delete column"
              aria-label={`Delete ${column.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {doneColumn && renderLockedRow(doneColumn)}
      </div>

      <div className="todo-column-manager-footer">
        <div className="todo-column-manager-add">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="New column name…"
            className="todo-column-manager-add-input"
          />
          <button
            type="button"
            className="todo-column-manager-add-btn"
            onClick={handleAdd}
          >
            <Plus size={14} />
            Add column
          </button>
        </div>
      </div>
    </div>
  );
}

type TodoColumnManagerProps = TodoColumnManagerContentProps & {
  open: boolean;
  onClose: () => void;
};

export default function TodoColumnManager({
  open,
  onClose,
  ...contentProps
}: TodoColumnManagerProps) {
  if (!open) return null;

  return (
    <div className="todo-app-modal-overlay" onClick={onClose}>
      <div
        className="todo-app-modal todo-column-manager todo-column-manager--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="todo-column-manager-title"
      >
        <div className="todo-app-modal-header">
          <div>
            <h3 id="todo-column-manager-title">Board columns</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="todo-app-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <TodoColumnManagerContent {...contentProps} />
      </div>
    </div>
  );
}
