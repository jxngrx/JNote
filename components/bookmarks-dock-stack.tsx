'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { FolderPlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  DEFAULT_CATEGORY_ID,
  useBookmarksStore,
  type Bookmark,
  type BookmarkCategory,
} from '@/lib/bookmarks-store';
import { useBookmarksUiStore } from '@/lib/bookmarks-ui-store';
import { useBookmarksSettingsStore } from '@/lib/bookmarks-settings-store';
import { getBookmarkFaviconUrl } from '@/lib/bookmark-utils';
import { useBookmarkAnchor } from '@/hooks/use-bookmark-anchor';
import './bookmarks-dock-stack.css';

function BookmarkFavicon({ bookmark }: { bookmark: Bookmark }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="bookmarks-stack-icon"
      src={bookmark.favicon}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = getBookmarkFaviconUrl(bookmark.url);
      }}
    />
  );
}

function BookmarkTile({
  bookmark,
  onOpen,
  onRemove,
}: {
  bookmark: Bookmark;
  onOpen: (bookmark: Bookmark) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bookmarks-stack-item-wrap">
      <button
        type="button"
        className="bookmarks-stack-item"
        onClick={() => onOpen(bookmark)}
        title={bookmark.url}
      >
        <span className="bookmarks-stack-icon-wrap">
          <BookmarkFavicon bookmark={bookmark} />
        </span>
        <span className="bookmarks-stack-label">{bookmark.title}</span>
      </button>
      <button
        type="button"
        className="bookmarks-stack-remove"
        aria-label={`Remove ${bookmark.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(bookmark.id);
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function BookmarkAddBar({
  url,
  error,
  isAdding,
  inputRef,
  onUrlChange,
  onSubmit,
  variant,
  categoryLabel,
}: {
  url: string;
  error: string | null;
  isAdding: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  variant: 'grid' | 'fan';
  categoryLabel?: string;
}) {
  return (
    <div
      className={`bookmarks-add-bar${
        variant === 'fan' ? ' bookmarks-add-bar--fan' : ''
      }`}
    >
      {categoryLabel ? (
        <p className="bookmarks-add-target">
          Adding to <span>{categoryLabel}</span>
        </p>
      ) : null}
      <form
        className="bookmarks-stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          ref={inputRef}
          className="bookmarks-stack-input"
          type="url"
          inputMode="url"
          placeholder="Add site — github.com, notion.so…"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          aria-label="Bookmark URL"
        />
        <button
          type="submit"
          className="bookmarks-stack-add-btn"
          disabled={!url.trim() || isAdding}
          aria-label="Add bookmark"
        >
          <Plus size={14} />
        </button>
      </form>
      {error ? <p className="bookmarks-stack-error">{error}</p> : null}
    </div>
  );
}

function CategorySection({
  category,
  bookmarks,
  isDefault,
  onOpen,
  onRemoveBookmark,
  onRename,
  onDelete,
}: {
  category: BookmarkCategory;
  bookmarks: Bookmark[];
  isDefault: boolean;
  onOpen: (bookmark: Bookmark) => void;
  onRemoveBookmark: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(category.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(category.name);
  }, [category.name]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitRename = () => {
    const result = onRename(category.id, draftName);
    if (result) setIsEditing(false);
  };

  return (
    <section className="bookmarks-category-section">
      <div className="bookmarks-category-head">
        {isEditing ? (
          <input
            ref={inputRef}
            className="bookmarks-category-name-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitRename();
              }
              if (event.key === 'Escape') {
                setDraftName(category.name);
                setIsEditing(false);
              }
            }}
            aria-label="Category name"
          />
        ) : (
          <h3 className="bookmarks-category-title">{category.name}</h3>
        )}
        <div className="bookmarks-category-actions">
          <span className="bookmarks-category-count">{bookmarks.length}</span>
          <button
            type="button"
            className="bookmarks-category-action-btn"
            aria-label={`Rename ${category.name}`}
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={12} />
          </button>
          {!isDefault ? (
            <button
              type="button"
              className="bookmarks-category-action-btn bookmarks-category-action-btn--danger"
              aria-label={`Delete ${category.name}`}
              onClick={() => onDelete(category.id)}
            >
              <Trash2 size={12} />
            </button>
          ) : null}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <p className="bookmarks-category-empty">No sites in this category yet.</p>
      ) : (
        <div className="bookmarks-stack-scroll">
          {bookmarks.map((bookmark) => (
            <BookmarkTile
              key={bookmark.id}
              bookmark={bookmark}
              onOpen={onOpen}
              onRemove={onRemoveBookmark}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BookmarksGridStack({
  categories,
  bookmarks,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onOpen,
  onRemove,
}: {
  categories: BookmarkCategory[];
  bookmarks: Bookmark[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddCategory: (name: string) => string | null;
  onRenameCategory: (id: string, name: string) => boolean;
  onDeleteCategory: (id: string) => void;
  onOpen: (bookmark: Bookmark) => void;
  onRemove: (id: string) => void;
}) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const handleAddCategory = () => {
    const error = onAddCategory(categoryName);
    if (error) {
      setCategoryError(error);
      return;
    }
    setCategoryName('');
    setCategoryError(null);
  };

  return (
    <div className="bookmarks-grid-body">
      <div className="bookmarks-category-bar">
        <div className="bookmarks-category-chips" role="tablist" aria-label="Bookmark categories">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              className={`bookmarks-category-chip${
                selectedCategoryId === category.id ? ' is-active' : ''
              }`}
              aria-selected={selectedCategoryId === category.id}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <form
          className="bookmarks-category-create"
          onSubmit={(event) => {
            event.preventDefault();
            handleAddCategory();
          }}
        >
          <input
            className="bookmarks-category-create-input"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="New category"
            aria-label="New category name"
          />
          <button
            type="submit"
            className="bookmarks-category-create-btn"
            disabled={!categoryName.trim()}
            aria-label="Add category"
          >
            <FolderPlus size={14} />
          </button>
        </form>
      </div>

      {categoryError ? (
        <p className="bookmarks-stack-error bookmarks-category-error">{categoryError}</p>
      ) : null}

      {(() => {
        const category = categories.find((item) => item.id === selectedCategoryId);
        if (!category) return null;

        return (
          <CategorySection
            key={category.id}
            category={category}
            bookmarks={bookmarks.filter(
              (bookmark) => bookmark.categoryId === category.id
            )}
            isDefault={category.id === DEFAULT_CATEGORY_ID}
            onOpen={onOpen}
            onRemoveBookmark={onRemove}
            onRename={(id, name) => onRenameCategory(id, name)}
            onDelete={onDeleteCategory}
          />
        );
      })()}
    </div>
  );
}

function BookmarksFanStack({
  bookmarks,
  onOpen,
  onRemove,
}: {
  bookmarks: Bookmark[];
  onOpen: (bookmark: Bookmark) => void;
  onRemove: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <p className="bookmarks-fan-empty">
        Add a site below. Labels fan out with favicons on the right.
      </p>
    );
  }

  return (
    <div className="bookmarks-fan-list">
      {bookmarks.map((bookmark, index) => (
        <div
          key={bookmark.id}
          className="bookmarks-fan-item"
          style={{ '--fan-index': index } as React.CSSProperties}
        >
          <button
            type="button"
            className="bookmarks-fan-row"
            onClick={() => onOpen(bookmark)}
            title={bookmark.url}
          >
            <span className="bookmarks-fan-label-pill">{bookmark.title}</span>
            <span className="bookmarks-fan-icon-wrap">
              <BookmarkFavicon bookmark={bookmark} />
            </span>
          </button>
          <button
            type="button"
            className="bookmarks-fan-remove"
            aria-label={`Remove ${bookmark.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(bookmark.id);
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function BookmarksDockStack() {
  const open = useBookmarksUiStore((s) => s.open);
  const closeBookmarks = useBookmarksUiStore((s) => s.closeBookmarks);
  const layout = useBookmarksSettingsStore((s) => s.layout);
  const categories = useBookmarksStore((s) => s.categories);
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const selectedCategoryId = useBookmarksStore((s) => s.selectedCategoryId);
  const setSelectedCategoryId = useBookmarksStore((s) => s.setSelectedCategoryId);
  const addCategory = useBookmarksStore((s) => s.addCategory);
  const renameCategory = useBookmarksStore((s) => s.renameCategory);
  const removeCategory = useBookmarksStore((s) => s.removeCategory);
  const addBookmark = useBookmarksStore((s) => s.addBookmark);
  const removeBookmark = useBookmarksStore((s) => s.removeBookmark);
  const openBookmark = useBookmarksStore((s) => s.openBookmark);

  const fanBookmarks = useMemo(() => {
    const order = new Map(categories.map((category, index) => [category.id, index]));
    return [...bookmarks].sort((a, b) => {
      const categoryDelta =
        (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0);
      if (categoryDelta !== 0) return categoryDelta;
      return b.createdAt - a.createdAt;
    });
  }, [bookmarks, categories]);

  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchor = useBookmarkAnchor(open);

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );
  const generalCategory = categories.find(
    (category) => category.id === DEFAULT_CATEGORY_ID
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBookmarks();
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (
        (target as HTMLElement).closest?.(
          'button.mag-dock-item[aria-label="Bookmarks"], button.app-sidebar-item[aria-label="Bookmarks"]'
        )
      ) {
        return;
      }
      closeBookmarks();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, closeBookmarks]);

  useEffect(() => {
    if (open) {
      setError(null);
      window.setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setUrl('');
      setError(null);
    }
  }, [open]);

  const handleAdd = async () => {
    if (!url.trim() || isAdding) return;

    setIsAdding(true);
    setError(null);

    const result = await addBookmark(
      url,
      layout === 'grid' ? selectedCategoryId : DEFAULT_CATEGORY_ID
    );
    setIsAdding(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setUrl('');
    inputRef.current?.focus();
  };

  const handleAddCategory = (name: string) => {
    const result = addCategory(name);
    if (!result.ok) return result.error;
    return null;
  };

  const handleRenameCategory = (id: string, name: string) => {
    const result = renameCategory(id, name);
    if (!result.ok) return false;
    return true;
  };

  const handleDeleteCategory = (id: string) => {
    const result = removeCategory(id);
    if (!result.ok) {
      setError(result.error ?? 'Could not delete category.');
    }
  };

  if (!mounted) return null;

  const anchorStyle = {
    '--bookmarks-anchor-x': `${anchor.x}px`,
    '--bookmarks-anchor-y': `${anchor.y}px`,
  } as React.CSSProperties;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={`bookmarks-stack-wrap bookmarks-stack-wrap--${layout}`}
          ref={panelRef}
          style={anchorStyle}
        >
          {layout === 'fan' ? (
            <motion.div
              className="bookmarks-fan-shell"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              aria-label="Bookmarks"
            >
              <BookmarksFanStack
                bookmarks={fanBookmarks}
                onOpen={openBookmark}
                onRemove={removeBookmark}
              />
              <BookmarkAddBar
                url={url}
                error={error}
                isAdding={isAdding}
                inputRef={inputRef}
                onUrlChange={setUrl}
                onSubmit={() => void handleAdd()}
                variant="fan"
                categoryLabel={generalCategory?.name ?? 'General'}
              />
            </motion.div>
          ) : (
            <motion.section
              className="bookmarks-stack-panel bookmarks-stack-panel--grid"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              aria-label="Bookmarks"
            >
              <div className="bookmarks-stack-header">
                <h2 className="bookmarks-stack-title">Bookmarks</h2>
                <button
                  type="button"
                  className="bookmarks-stack-close-btn"
                  onClick={closeBookmarks}
                  aria-label="Close bookmarks"
                >
                  <X size={14} />
                </button>
              </div>

              <BookmarkAddBar
                url={url}
                error={error}
                isAdding={isAdding}
                inputRef={inputRef}
                onUrlChange={setUrl}
                onSubmit={() => void handleAdd()}
                variant="grid"
                categoryLabel={selectedCategory?.name}
              />

              <BookmarksGridStack
                categories={categories}
                bookmarks={bookmarks}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
                onOpen={openBookmark}
                onRemove={removeBookmark}
              />
            </motion.section>
          )}
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
