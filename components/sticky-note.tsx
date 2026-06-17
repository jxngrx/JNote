'use client';

import { StickyNote as StickyNoteType } from '@/lib/types';
import { useCanvasStore } from '@/lib/store';
import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { NATIVE_SCROLL_CLASS } from '@/components/ui/scroll-area';

interface StickyNoteProps {
  note: StickyNoteType;
}

function StickyNoteComponent({ note }: StickyNoteProps) {
  const updateNote = useCanvasStore((state) => state.updateNote);
  const deleteNote = useCanvasStore((state) => state.deleteNote);
  const duplicateNote = useCanvasStore((state) => state.duplicateNote);
  const setSelectedNote = useCanvasStore((state) => state.setSelectedNote);
  const contentRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentDragPositionRef = useRef({ x: note.x, y: note.y });
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const selectedNoteId = useCanvasStore((state) => state.selectedNoteId);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [noteNumber, setNoteNumber] = useState(0);
  const notes = useCanvasStore((state) => state.notes);

  useEffect(() => {
    setIsCreating(true);
    const timer = setTimeout(() => setIsCreating(false), 300);
    return () => clearTimeout(timer);
  }, [note.id]);

  useEffect(() => {
    const index = notes.findIndex((n) => n.id === note.id);
    setNoteNumber(index + 1);
  }, [note.id, notes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== contentRef.current) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateNote(note.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
        e.preventDefault();
        deleteNote(note.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        updateNote(note.id, { isPinned: !note.isPinned });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, duplicateNote, deleteNote, updateNote]);

  const handleContentFocus = useCallback(() => {
    setIsEditing(true);
    setSelectedNote(note.id);
  }, [note.id, setSelectedNote]);

  const handleContentBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle note click to select
  const handleNoteClick = useCallback((e: React.MouseEvent) => {
    // Don't select if clicking on content editor
    if ((e.target as HTMLElement).closest('.sticky-note-editor') ||
        (e.target as HTMLElement).classList.contains('sticky-note-editor')) {
      return;
    }
    // Don't select if clicking on resize handles
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return;
    }
    setSelectedNote(note.id);
  }, [note.id, setSelectedNote]);

  // Drag handle mouse down handler (called from external toolbar)
  const handleDragStart = useCallback((e: MouseEvent | React.MouseEvent) => {
    // Store initial mouse position and note position
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    currentDragPositionRef.current = { x: note.x, y: note.y };
    setIsDragging(true);
  }, [note.x, note.y]);

  // Expose drag start handler via ref for external toolbar
  useEffect(() => {
    if (noteRef.current && selectedNoteId === note.id) {
      (noteRef.current as any).startDrag = handleDragStart;
    }
  }, [selectedNoteId, note.id, handleDragStart]);

  const handleContentChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const text = (e.target as HTMLDivElement).textContent || '';
    updateNote(note.id, { content: text });
  }, [note.id, updateNote]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
  }, [isEditing]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        updateNote(note.id, {
          width: Math.max(240, note.width + deltaX),
          height: Math.max(160, note.height + deltaY),
        });

        setResizeStart({ x: e.clientX, y: e.clientY });
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, note, resizeStart, updateNote]);

  // Optimized drag handling with CSS transforms for smooth performance
  useEffect(() => {
    if (!isDragging) {
      // Reset transform when not dragging
      if (noteRef.current) {
        noteRef.current.style.transform = '';
      }
      return;
    }

    // Bring note to front
    const maxZIndex = Math.max(...useCanvasStore.getState().notes.map((n) => n.zIndex)) + 1;
    updateNote(note.id, { zIndex: maxZIndex });

    const handleMouseMove = (e: MouseEvent) => {
      // Use CSS transform for smooth dragging without re-renders
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      if (noteRef.current) {
        noteRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Calculate final position
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const finalX = currentDragPositionRef.current.x + deltaX;
      const finalY = currentDragPositionRef.current.y + deltaY;

      // Sync final position to state
      updateNote(note.id, {
        x: finalX,
        y: finalY,
      });
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, note.id, note.x, note.y, updateNote]);

  const noteStyles = useMemo(() => ({
    left: `${note.x}px`,
    top: `${note.y}px`,
    width: `${note.width}px`,
    height: `${note.height}px`,
    zIndex: note.zIndex,
    backgroundColor: note.color,
    color: note.textStyle?.color || '#1a1a1a',
    animation: isCreating ? 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
    opacity: isDragging ? 0.95 : 1,
  }), [note.x, note.y, note.width, note.height, note.zIndex, note.color, note.textStyle?.color, isCreating, isDragging]);

  const editorStyles = useMemo(() => ({
    fontSize: note.textStyle?.fontSize === 'small' ? '0.875rem' :
             note.textStyle?.fontSize === 'large' ? '1.25rem' : '1rem',
    fontWeight: note.textStyle?.fontWeight === 'bold' ? 'bold' : 'normal',
    textAlign: (note.textStyle?.textAlign as 'left' | 'center' | 'right') || 'left',
    textDecoration: note.textStyle?.textDecoration === 'underline' ? 'underline' : 'none',
  }), [note.textStyle]);

  // Initialize and sync contentEditable content
  useEffect(() => {
    if (contentRef.current) {
      const currentContent = contentRef.current.textContent || '';
      // Only update if:
      // 1. Content is empty and note has content (initialization)
      // 2. Content changed externally and we're not currently editing
      if ((!currentContent && note.content) ||
          (currentContent !== note.content && !isEditing)) {
        contentRef.current.textContent = note.content;
      }
    }
  }, [note.content, note.id, isEditing]);

  // Sync drag position ref when note position changes externally
  useEffect(() => {
    if (!isDragging) {
      currentDragPositionRef.current = { x: note.x, y: note.y };
    }
  }, [note.x, note.y, isDragging]);

  const isSelected = selectedNoteId === note.id;

  return (
    <div
      ref={noteRef}
      data-note-id={note.id}
      className={`sticky-note group ${isSelected ? 'ring-2 ring-blue-400/50' : ''}`}
      role="article"
      aria-label={`Note ${noteNumber}: ${note.content.substring(0, 30)}`}
      style={noteStyles}
      onClick={handleNoteClick}
    >
      <h2 className="sr-only">Note {noteNumber}</h2>

      <div className="sticky-note-label">Note {noteNumber}</div>

      <div className="sticky-note-content">
        <div
          ref={contentRef}
          className={`sticky-note-editor ${NATIVE_SCROLL_CLASS}`}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onFocus={handleContentFocus}
          onBlur={handleContentBlur}
          role="textbox"
          aria-label="Note content"
          aria-multiline="true"
          style={editorStyles}
        />
      </div>

      <div
        className="resize-handle resize-handle-se"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-sw"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-ne"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-nw"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-e"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-w"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-n"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
      <div
        className="resize-handle resize-handle-s"
        onMouseDown={handleResizeMouseDown}
        role="img"
        aria-label="Resize note"
        title="Drag to resize"
      />
    </div>
  );
}

export default memo(StickyNoteComponent);
