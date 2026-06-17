'use client';

import { useMemo } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { normalizeTodoList, useTodoStore } from '@/lib/todo-store';
import '@/components/todo-kanban.css';

function formatDeletedAt(timestamp: number) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TodoRecycleBinPanel() {
  const lists = useTodoStore((s) => s.lists);
  const activeListId = useTodoStore((s) => s.activeListId);
  const restoreItem = useTodoStore((s) => s.restoreItem);
  const purgeTrashItem = useTodoStore((s) => s.purgeTrashItem);
  const emptyTrash = useTodoStore((s) => s.emptyTrash);

  const activeList = useMemo(() => {
    const list = lists.find((entry) => entry.id === activeListId);
    if (!list) return null;
    return normalizeTodoList(list);
  }, [lists, activeListId]);

  const items = activeList?.trash ?? [];

  if (!activeList) {
    return (
      <div className="widgets-settings">
        <section className="widgets-settings-block">
          <p className="widgets-settings-subheading">
            Create or select a todo list to manage deleted tasks.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="widgets-settings">
      <section className="widgets-settings-block">
        <p className="widgets-settings-subheading">
          Deleted tasks from <strong>{activeList.title}</strong> stay here until
          you restore or permanently remove them.
        </p>

        {items.length === 0 ? (
          <div className="todo-recycle-bin-empty">
            <p>Nothing in the bin — you&apos;re all clear.</p>
          </div>
        ) : (
          <>
            <div className="todo-recycle-bin-list todo-recycle-bin-list--panel">
              {items.map((item) => (
                <div key={item.id} className="todo-recycle-bin-row">
                  <div className="todo-recycle-bin-row-main">
                    <span className="todo-recycle-bin-title">{item.title}</span>
                    <span className="todo-recycle-bin-meta">
                      Deleted {formatDeletedAt(item.updatedAt)}
                    </span>
                  </div>
                  <div className="todo-recycle-bin-actions">
                    <button
                      type="button"
                      className="todo-recycle-bin-btn todo-recycle-bin-btn--restore"
                      onClick={() => restoreItem(item.id)}
                      title="Restore task"
                    >
                      <RotateCcw size={14} />
                      Restore
                    </button>
                    <button
                      type="button"
                      className="todo-recycle-bin-btn todo-recycle-bin-btn--purge"
                      onClick={() => purgeTrashItem(item.id)}
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="todo-recycle-bin-empty-all"
              onClick={() => emptyTrash()}
            >
              <Trash2 size={14} />
              Empty recycle bin
            </button>
          </>
        )}
      </section>
    </div>
  );
}
