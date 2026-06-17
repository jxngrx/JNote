'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useTodoStore } from '@/lib/todo-store';
import './todo-dock-context-menu.css';

type TodoDockContextMenuProps = {
  listId: string;
  listTitle: string;
  x: number;
  y: number;
  onClose: () => void;
};

export default function TodoDockContextMenu({
  listId,
  listTitle,
  x,
  y,
  onClose,
}: TodoDockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(listTitle);
  const updateList = useTodoStore((state) => state.updateList);
  const duplicateList = useTodoStore((state) => state.duplicateList);
  const deleteList = useTodoStore((state) => state.deleteList);
  const listCount = useTodoStore((state) => state.lists.length);

  useEffect(() => {
    setDraftTitle(listTitle);
  }, [listTitle]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const clampPosition = () => {
    const margin = 12;
    const width = menuRef.current?.offsetWidth ?? 220;
    const height = menuRef.current?.offsetHeight ?? 160;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    return {
      left: Math.min(Math.max(margin, x), maxX),
      top: Math.min(Math.max(margin, y), maxY),
    };
  };

  const position = clampPosition();

  const saveTitle = () => {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      updateList(listId, { title: trimmed });
    }
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      className="todo-dock-context-menu"
      style={{ left: position.left, top: position.top }}
      role="menu"
      aria-label={`Actions for ${listTitle}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      {isEditing ? (
        <div className="todo-dock-context-menu-edit">
          <label className="todo-dock-context-menu-edit-label" htmlFor="todo-dock-rename">
            List name
          </label>
          <input
            ref={inputRef}
            id="todo-dock-rename"
            className="todo-dock-context-menu-input"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveTitle();
              }
            }}
          />
          <div className="todo-dock-context-menu-edit-actions">
            <button
              type="button"
              className="todo-dock-context-menu-btn"
              onClick={() => {
                setIsEditing(false);
                setDraftTitle(listTitle);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="todo-dock-context-menu-btn todo-dock-context-menu-btn--primary"
              onClick={saveTitle}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="todo-dock-context-menu-item"
            role="menuitem"
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={14} />
            Edit name
          </button>
          <button
            type="button"
            className="todo-dock-context-menu-item"
            role="menuitem"
            onClick={() => {
              duplicateList(listId);
              onClose();
            }}
          >
            <Copy size={14} />
            Duplicate
          </button>
          <button
            type="button"
            className="todo-dock-context-menu-item todo-dock-context-menu-item--danger"
            role="menuitem"
            disabled={listCount <= 1}
            onClick={() => {
              if (listCount <= 1) return;
              deleteList(listId);
              onClose();
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
