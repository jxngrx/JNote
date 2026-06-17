'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import { Check, GripVertical, Trash2 } from 'lucide-react';
import { createDefaultColumns, type KanbanColumn, type TodoItem } from '@/lib/todo-store';
import { isLockedColumn } from '@/lib/todo-column-utils';
import { useTodoUiStore } from '@/lib/todo-ui-store';
import { cn } from '@/lib/utils';

import './todo-kanban.css';

const KANBAN_COLUMN_MIN_WIDTH_DEFAULT = 160;

function computeKanbanColumnBasis(
  containerWidth: number,
  columnCount: number,
  columnWidthSetting: number,
  gapPx: number,
  minWidth = KANBAN_COLUMN_MIN_WIDTH_DEFAULT
): number {
  if (columnCount <= 0 || containerWidth <= 0) return columnWidthSetting;

  const gapTotal = Math.max(0, columnCount - 1) * gapPx;
  const share = (containerWidth - gapTotal) / columnCount;

  if (share >= columnWidthSetting) {
    return columnWidthSetting;
  }

  const wouldOverflow =
    columnCount * columnWidthSetting + gapTotal > containerWidth;
  if (wouldOverflow && share < minWidth) {
    return columnWidthSetting;
  }

  return Math.min(columnWidthSetting, Math.max(minWidth, share));
}

type TodoKanbanBoardProps = {
  columns: KanbanColumn[];
  items: TodoItem[];
  columnWidth: number;
  fontSize: number;
  onMoveItem: (itemId: string, toColumnId: string, toIndex: number) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDiscardItem: (itemId: string) => void;
  onUpdateItem: (id: string, title: string) => void;
  onCreateDraft: (columnId: string) => string | null;
  onRenameColumn: (columnId: string, title: string) => void;
  onItemMoved?: (payload: {
    itemId: string;
    fromColumnId: string;
    toColumnId: string;
  }) => void;
};

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

type KanbanCardProps = {
  item: TodoItem;
  fontSize: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isEditing?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDiscard: () => void;
  onCommitTitle: (title: string) => void;
  onCancelEdit?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
};

function KanbanCard({
  item,
  fontSize,
  isDragging,
  isOverlay,
  isEditing,
  onToggle,
  onDelete,
  onDiscard,
  onCommitTitle,
  onCancelEdit,
  dragHandleProps,
}: KanbanCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(item.title);
  const timeLabel = formatRelativeTime(item.createdAt);

  useEffect(() => {
    setDraft(item.title);
  }, [item.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const isEmptyDraft = !item.title.trim();

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (isEmptyDraft) {
        onDiscard();
      } else {
        setDraft(item.title);
        onCancelEdit?.();
      }
      return;
    }
    if (trimmed !== item.title) {
      onCommitTitle(trimmed);
    } else {
      onCancelEdit?.();
    }
  };

  return (
    <motion.article
      layout={!isOverlay}
      layoutId={isOverlay ? undefined : `kanban-card-${item.id}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{
        opacity: isDragging && !isOverlay ? 0.35 : 1,
        y: 0,
        scale: isOverlay ? 1.03 : 1,
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{
        layout: { type: 'spring', stiffness: 420, damping: 34, mass: 0.55 },
        opacity: { duration: 0.18 },
        scale: { duration: 0.2 },
      }}
      className={cn(
        'todo-kanban-card',
        item.completed && 'is-done',
        isOverlay && 'is-overlay',
        isEditing && 'is-editing'
      )}
      style={{ fontSize }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="todo-kanban-card-grip"
        aria-label="Drag card"
        {...dragHandleProps}
      >
        <GripVertical size={13} />
      </button>

      <button
        type="button"
        onClick={onToggle}
        className={cn('todo-checkbox todo-kanban-checkbox', item.completed && 'checked')}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.completed && <Check size={11} strokeWidth={2.5} />}
      </button>

      <div className="todo-kanban-card-body">
        {isEditing ? (
          <input
            ref={inputRef}
            className="todo-kanban-card-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                if (isEmptyDraft) {
                  onDiscard();
                } else {
                  setDraft(item.title);
                  onCancelEdit?.();
                }
              }
            }}
            placeholder="Type a task…"
          />
        ) : (
          <>
            <p className="todo-kanban-card-title" title={item.title || 'Untitled'}>
              {item.title || <span className="todo-kanban-card-placeholder">Untitled</span>}
            </p>
            {timeLabel && item.title && (
              <span className="todo-kanban-card-meta">{timeLabel}</span>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="todo-kanban-card-delete"
        title="Delete task"
        aria-label="Delete task"
      >
        <Trash2 size={12} />
      </button>
    </motion.article>
  );
}

type SortableKanbanCardProps = {
  item: TodoItem;
  fontSize: number;
  isEditing: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDiscard: () => void;
  onCommitTitle: (title: string) => void;
  onCancelEdit: () => void;
};

function SortableKanbanCard({
  item,
  fontSize,
  isEditing,
  onToggle,
  onDelete,
  onDiscard,
  onCommitTitle,
  onCancelEdit,
}: SortableKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'item', columnId: item.columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.33, 1, 0.68, 1)',
  };

  return (
    <div ref={setNodeRef} style={style} className="todo-kanban-card-wrap">
      <KanbanCard
        item={item}
        fontSize={fontSize}
        isDragging={isDragging}
        isEditing={isEditing}
        onToggle={onToggle}
        onDelete={onDelete}
        onDiscard={onDiscard}
        onCommitTitle={onCommitTitle}
        onCancelEdit={onCancelEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

type KanbanColumnPanelProps = {
  column: KanbanColumn;
  items: TodoItem[];
  fontSize: number;
  editingItemId: string | null;
  isDragTarget: boolean;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onDiscardItem: (id: string) => void;
  onUpdateItem: (id: string, title: string) => void;
  onCreateDraft: (columnId: string) => string | null;
  onRenameColumn: (columnId: string, title: string) => void;
  onSetEditingItem: (id: string | null) => void;
};

function KanbanColumnPanel({
  column,
  items,
  fontSize,
  editingItemId,
  isDragTarget,
  onToggleItem,
  onDeleteItem,
  onDiscardItem,
  onUpdateItem,
  onCreateDraft,
  onRenameColumn,
  onSetEditingItem,
}: KanbanColumnPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const isDone = column.role === 'done';
  const isStart = column.role === 'start';

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed);
    } else {
      setTitleDraft(column.title);
    }
    setEditingTitle(false);
  };

  const handleEmptyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.todo-kanban-card-wrap')) return;
    const id = onCreateDraft(column.id);
    if (id) onSetEditingItem(id);
  };

  const handleCommitTitle = (id: string, title: string) => {
    onUpdateItem(id, title);
    onSetEditingItem(null);
  };

  return (
    <section
      className={cn(
        'todo-kanban-column',
        isDone && 'is-done-column',
        isStart && 'is-start-column',
        (isOver || isDragTarget) && 'is-drop-target'
      )}
      data-column-id={column.id}
    >
      <header className="todo-kanban-column-header">
        {editingTitle ? (
          <input
            className="todo-kanban-column-title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setTitleDraft(column.title);
                setEditingTitle(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="todo-kanban-column-title"
            onDoubleClick={() => {
              if (isLockedColumn(column)) return;
              setTitleDraft(column.title);
              setEditingTitle(true);
            }}
            title="Double-click to rename"
          >
            {column.title}
          </button>
        )}
        <div className="todo-kanban-column-badges">
          {isStart && <span className="todo-kanban-column-role is-start">Start</span>}
          {isDone && <span className="todo-kanban-column-role is-done">Done</span>}
          <span className="todo-kanban-column-count">{items.length}</span>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className="todo-kanban-column-body"
        onClick={handleEmptyClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const id = onCreateDraft(column.id);
            if (id) onSetEditingItem(id);
          }
        }}
        aria-label={`${column.title} column. Click empty space to add a card.`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="todo-kanban-column-cards">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <SortableKanbanCard
                  key={item.id}
                  item={item}
                  fontSize={fontSize}
                  isEditing={editingItemId === item.id}
                  onToggle={() => onToggleItem(item.id)}
                  onDelete={() => {
                    if (!item.title.trim()) {
                      onDiscardItem(item.id);
                    } else {
                      onDeleteItem(item.id);
                    }
                    if (editingItemId === item.id) onSetEditingItem(null);
                  }}
                  onDiscard={() => {
                    onDiscardItem(item.id);
                    if (editingItemId === item.id) onSetEditingItem(null);
                  }}
                  onCommitTitle={(title) => handleCommitTitle(item.id, title)}
                  onCancelEdit={() => onSetEditingItem(null)}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
        <div className="todo-kanban-column-spacer" aria-hidden />
      </div>
    </section>
  );
}

export default function TodoKanbanBoard({
  columns,
  items,
  columnWidth,
  fontSize,
  onMoveItem,
  onToggleItem,
  onDeleteItem,
  onDiscardItem,
  onUpdateItem,
  onCreateDraft,
  onRenameColumn,
  onItemMoved,
}: TodoKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [columnBasis, setColumnBasis] = useState(columnWidth);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragStartColumnRef = useRef<string | null>(null);
  const editingItemId = useTodoUiStore((s) => s.editingItemId);
  const setEditingItemId = useTodoUiStore((s) => s.setEditingItemId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedColumns = useMemo(() => {
    const resolvedColumns =
      Array.isArray(columns) && columns.length > 0
        ? columns
        : createDefaultColumns();

    return [...resolvedColumns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const itemsByColumn = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    sortedColumns.forEach((col) => map.set(col.id, []));
    items.forEach((item) => {
      const bucket = map.get(item.columnId);
      if (bucket) bucket.push(item);
    });
    map.forEach((bucket) => bucket.sort((a, b) => a.order - b.order));
    return map;
  }, [items, sortedColumns]);

  const updateColumnBasis = useCallback(() => {
    const board = boardRef.current;
    const scrollEl = board?.parentElement;
    if (!board || !scrollEl) return;

    const boardStyle = getComputedStyle(board);
    const gapPx =
      parseFloat(boardStyle.columnGap) ||
      parseFloat(boardStyle.gap) ||
      10.4;
    const minWidth =
      parseFloat(boardStyle.getPropertyValue('--todo-column-min')) ||
      KANBAN_COLUMN_MIN_WIDTH_DEFAULT;

    setColumnBasis(
      computeKanbanColumnBasis(
        scrollEl.clientWidth,
        sortedColumns.length,
        columnWidth,
        gapPx,
        minWidth
      )
    );
  }, [columnWidth, sortedColumns.length]);

  useEffect(() => {
    const board = boardRef.current;
    const scrollEl = board?.parentElement;
    if (!board || !scrollEl) return;

    updateColumnBasis();

    const observer = new ResizeObserver(updateColumnBasis);
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [updateColumnBasis]);

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  const findColumnIdForItem = useCallback(
    (itemId: string) => items.find((item) => item.id === itemId)?.columnId,
    [items]
  );

  const resolveOverColumnId = useCallback(
    (over: NonNullable<DragOverEvent['over']>) => {
      if (over.data.current?.type === 'column') {
        return over.data.current.columnId as string;
      }
      if (over.data.current?.type === 'item') {
        return over.data.current.columnId as string;
      }
      const id = String(over.id);
      if (id.startsWith('column-')) return id.replace('column-', '');
      return findColumnIdForItem(id);
    },
    [findColumnIdForItem]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeItemId = String(event.active.id);
    setActiveId(activeItemId);
    dragStartColumnRef.current = findColumnIdForItem(activeItemId) ?? null;
    setEditingItemId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeItemId = String(active.id);
    const activeColumnId = findColumnIdForItem(activeItemId);
    if (!activeColumnId) return;

    const targetColumnId = resolveOverColumnId(over);
    if (!targetColumnId) return;

    setOverColumnId(targetColumnId);

    if (targetColumnId === activeColumnId) return;

    const targetItems = (itemsByColumn.get(targetColumnId) ?? []).filter(
      (item) => item.id !== activeItemId
    );
    onMoveItem(activeItemId, targetColumnId, targetItems.length);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const activeColumnId = findColumnIdForItem(activeItemId);
    if (!activeColumnId) return;

    let overColumnId = activeColumnId;
    let overItemId: string | null = null;

    if (over.data.current?.type === 'item') {
      overColumnId = over.data.current.columnId as string;
      overItemId = String(over.id);
    } else if (over.data.current?.type === 'column') {
      overColumnId = over.data.current.columnId as string;
    } else if (String(over.id).startsWith('column-')) {
      overColumnId = String(over.id).replace('column-', '');
    } else {
      overItemId = String(over.id);
      overColumnId = findColumnIdForItem(overItemId) ?? activeColumnId;
    }

    const columnItems = (itemsByColumn.get(overColumnId) ?? []).filter(
      (item) => item.id !== activeItemId
    );

    let toIndex = columnItems.length;
    if (overItemId && overItemId !== activeItemId) {
      const overIndex = columnItems.findIndex((item) => item.id === overItemId);
      if (overIndex >= 0) toIndex = overIndex;
    }

    onMoveItem(activeItemId, overColumnId, toIndex);

    const fromColumnId = dragStartColumnRef.current;
    if (fromColumnId && fromColumnId !== overColumnId) {
      onItemMoved?.({
        itemId: activeItemId,
        fromColumnId,
        toColumnId: overColumnId,
      });
    }
    dragStartColumnRef.current = null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverColumnId(null);
        dragStartColumnRef.current = null;
      }}
    >
      <div
        ref={boardRef}
        className="todo-kanban-board"
        style={
          {
            '--todo-column-count': sortedColumns.length,
            '--todo-column-basis': `${columnBasis}px`,
          } as React.CSSProperties
        }
      >
        {sortedColumns.map((column) => (
          <div key={column.id} className="todo-kanban-column-shell">
            <KanbanColumnPanel
              column={column}
              items={itemsByColumn.get(column.id) ?? []}
              fontSize={fontSize}
              editingItemId={editingItemId}
              isDragTarget={overColumnId === column.id && activeId !== null}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
              onDiscardItem={onDiscardItem}
              onUpdateItem={onUpdateItem}
              onCreateDraft={onCreateDraft}
              onRenameColumn={onRenameColumn}
              onSetEditingItem={setEditingItemId}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' }}>
        {activeItem ? (
          <KanbanCard
            item={activeItem}
            fontSize={fontSize}
            isOverlay
            onToggle={() => {}}
            onDelete={() => {}}
            onDiscard={() => {}}
            onCommitTitle={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
