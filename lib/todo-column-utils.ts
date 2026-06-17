import type { KanbanColumn, TodoItem } from '@/lib/todo-store';
import {
  DONE_COLUMN_ID,
  PROGRESS_COLUMN_ID,
  TODO_COLUMN_ID,
} from '@/lib/todo-store';

export type ColumnRole = 'start' | 'done' | null;

export function isLockedColumn(column: KanbanColumn): boolean {
  return (
    column.role === 'start' ||
    column.role === 'done' ||
    column.id === TODO_COLUMN_ID ||
    column.id === DONE_COLUMN_ID
  );
}

export function sortColumns(columns: KanbanColumn[]): KanbanColumn[] {
  return [...columns].sort((a, b) => a.order - b.order);
}

export function getStartColumn(columns: KanbanColumn[]): KanbanColumn | undefined {
  return columns.find((c) => c.role === 'start' || c.id === TODO_COLUMN_ID);
}

export function getDoneColumn(columns: KanbanColumn[]): KanbanColumn | undefined {
  return columns.find((c) => c.role === 'done' || c.id === DONE_COLUMN_ID);
}

export function getMiddleColumns(columns: KanbanColumn[]): KanbanColumn[] {
  const startId = getStartColumn(columns)?.id;
  const doneId = getDoneColumn(columns)?.id;
  return sortColumns(columns).filter(
    (col) => col.id !== startId && col.id !== doneId
  );
}

export function enforceColumnOrder(columns: KanbanColumn[]): KanbanColumn[] {
  const sorted = sortColumns(columns);
  const start = getStartColumn(sorted);
  const done = getDoneColumn(sorted);
  const middles = getMiddleColumns(sorted);
  const ordered = [start, ...middles, done].filter(
    (col): col is KanbanColumn => Boolean(col)
  );
  return ordered.map((col, index) => ({ ...col, order: index }));
}

export function assignColumnProgress(columns: KanbanColumn[]): KanbanColumn[] {
  const ordered = enforceColumnOrder(columns);
  const middles = getMiddleColumns(ordered);
  const middleCount = middles.length;

  return ordered.map((col) => {
    if (col.role === 'start' || col.id === TODO_COLUMN_ID) {
      return {
        ...col,
        role: 'start' as const,
        progressPercent: 0,
        title: col.title || 'To Do',
      };
    }
    if (col.role === 'done' || col.id === DONE_COLUMN_ID) {
      return {
        ...col,
        role: 'done' as const,
        progressPercent: 100,
        title: col.title || 'Done',
      };
    }

    const middleIndex = middles.findIndex((middle) => middle.id === col.id);
    const progressPercent =
      middleCount === 0
        ? 50
        : Math.round((100 / (middleCount + 1)) * (middleIndex + 1));

    return {
      ...col,
      role: null,
      progressPercent,
    };
  });
}

export function normalizeColumns(columns: KanbanColumn[]): KanbanColumn[] {
  if (columns.length === 0) return createFallbackColumns();
  return assignColumnProgress(columns);
}

export function createFallbackColumns(): KanbanColumn[] {
  return assignColumnProgress([
    {
      id: TODO_COLUMN_ID,
      title: 'To Do',
      order: 0,
      progressPercent: 0,
      role: 'start',
    },
    {
      id: PROGRESS_COLUMN_ID,
      title: 'In Progress',
      order: 1,
      progressPercent: 50,
      role: null,
    },
    {
      id: DONE_COLUMN_ID,
      title: 'Done',
      order: 2,
      progressPercent: 100,
      role: 'done',
    },
  ]);
}

export function getColumnByRole(
  columns: KanbanColumn[],
  role: Exclude<ColumnRole, null>
) {
  return role === 'start' ? getStartColumn(columns) : getDoneColumn(columns);
}

export function resolveColumn(
  columnId: string,
  columns: KanbanColumn[] | undefined
): KanbanColumn | undefined {
  return columns?.find((c) => c.id === columnId);
}

export function isDoneColumnId(columnId: string, columns: KanbanColumn[]): boolean {
  const col = resolveColumn(columnId, columns);
  return col?.role === 'done' || columnId === DONE_COLUMN_ID;
}

export function isStartColumnId(columnId: string, columns: KanbanColumn[]): boolean {
  const col = resolveColumn(columnId, columns);
  return col?.role === 'start' || columnId === TODO_COLUMN_ID;
}

export function computeItemProgress(
  item: TodoItem,
  columns: KanbanColumn[]
): number {
  const col = resolveColumn(item.columnId, columns);
  return col?.progressPercent ?? 0;
}

export function computeListProgress(
  items: TodoItem[],
  columns: KanbanColumn[] | undefined
): number {
  if (items.length === 0 || !columns?.length) return 0;
  const sum = items.reduce(
    (acc, item) => acc + computeItemProgress(item, columns),
    0
  );
  return Math.round(sum / items.length);
}

export function buildReorderIds(
  columns: KanbanColumn[],
  middleOrderedIds: string[]
): string[] | null {
  const start = getStartColumn(columns);
  const done = getDoneColumn(columns);
  const middles = getMiddleColumns(columns);

  if (!start || !done) return null;
  if (middleOrderedIds.length !== middles.length) return null;

  const middleSet = new Set(middles.map((col) => col.id));
  if (!middleOrderedIds.every((id) => middleSet.has(id))) return null;

  return [start.id, ...middleOrderedIds, done.id];
}
