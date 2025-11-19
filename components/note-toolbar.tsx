'use client';

import { useCanvasStore } from '@/lib/store';
import { useEffect, useState, useRef } from 'react';
import { Copy, Trash2, Palette, Pin, Type, GripVertical } from 'lucide-react';
import { STICKY_NOTE_COLORS } from '@/lib/constants';

export default function NoteToolbar() {
  const selectedNoteId = useCanvasStore((state) => state.selectedNoteId);
  const notes = useCanvasStore((state) => state.notes);
  const viewport = useCanvasStore((state) => state.viewport);
  const updateNote = useCanvasStore((state) => state.updateNote);
  const deleteNote = useCanvasStore((state) => state.deleteNote);
  const duplicateNote = useCanvasStore((state) => state.duplicateNote);
  const setSelectedNote = useCanvasStore((state) => state.setSelectedNote);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextStylePicker, setShowTextStylePicker] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Calculate toolbar position based on selected note
  useEffect(() => {
    if (!selectedNote || !toolbarRef.current) {
      return;
    }

    // Calculate position relative to viewport
    const noteX = selectedNote.x * viewport.scale + viewport.translateX;
    const noteY = selectedNote.y * viewport.scale + viewport.translateY;
    const noteWidth = selectedNote.width * viewport.scale;
    const noteHeight = selectedNote.height * viewport.scale;

    // Position toolbar above the note
    const toolbarHeight = 50; // Approximate height
    const offset = 10;
    let x = noteX + noteWidth / 2;
    let y = noteY - toolbarHeight - offset;

    // Keep toolbar within viewport bounds
    const toolbarWidth = 300; // Approximate width
    x = Math.max(toolbarWidth / 2, Math.min(window.innerWidth - toolbarWidth / 2, x));
    y = Math.max(60, Math.min(window.innerHeight - toolbarHeight, y));

    setPosition({ x, y });
  }, [selectedNote, viewport]);

  if (!selectedNote) {
    return null;
  }

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger drag on the note by dispatching a custom event
    if (selectedNote) {
      const noteElement = document.querySelector(`[data-note-id="${selectedNote.id}"]`) as HTMLElement;
      if (noteElement && (noteElement as any).startDrag) {
        (noteElement as any).startDrag(e.nativeEvent);
      }
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed note-toolbar z-[200]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 0)',
      }}
      role="toolbar"
      aria-label="Note actions"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-1.5 p-2 bg-black/80 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg">
        <button
          onMouseDown={handleDragHandleMouseDown}
          className="toolbar-icon-btn drag-handle cursor-move"
          title="Drag to move"
          aria-label="Drag note"
        >
          <GripVertical size={14} />
        </button>

        <button
          onClick={() => duplicateNote(selectedNote.id)}
          className="toolbar-icon-btn"
          title="Duplicate (Ctrl+D)"
          aria-label="Duplicate note"
        >
          <Copy size={14} />
        </button>

        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="toolbar-icon-btn"
          title="Change color"
          aria-label="Change note color"
          aria-expanded={showColorPicker}
        >
          <Palette size={14} />
        </button>

        <button
          onClick={() => setShowTextStylePicker(!showTextStylePicker)}
          className="toolbar-icon-btn"
          title="Text style"
          aria-label="Change text style"
          aria-expanded={showTextStylePicker}
        >
          <Type size={14} />
        </button>

        <button
          onClick={() =>
            updateNote(selectedNote.id, { isPinned: !selectedNote.isPinned })
          }
          className="toolbar-icon-btn"
          title={`${selectedNote.isPinned ? 'Unpin' : 'Pin'} (Ctrl+P)`}
          aria-label={selectedNote.isPinned ? 'Unpin note' : 'Pin note'}
          aria-pressed={selectedNote.isPinned}
        >
          <Pin size={14} fill={selectedNote.isPinned ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => {
            deleteNote(selectedNote.id);
            setSelectedNote(null);
          }}
          className="toolbar-icon-btn hover:text-red-400"
          title="Delete (Ctrl+Delete)"
          aria-label="Delete note"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showColorPicker && (
        <div
          className="color-picker absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 gap-1 flex flex-wrap w-48 z-10"
          role="region"
          aria-label="Color palette"
          style={{
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {STICKY_NOTE_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => {
                updateNote(selectedNote.id, { color: color.hex });
                setShowColorPicker(false);
              }}
              className="w-8 h-8 rounded border-2 border-transparent hover:border-white/50 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Change to ${color.name}`}
            />
          ))}
        </div>
      )}

      {showTextStylePicker && (
        <div
          className="text-style-picker absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 gap-2 flex flex-col z-10 min-w-[200px]"
          role="region"
          aria-label="Text style options"
          style={{
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-white/70">Text Color</label>
            <input
              type="color"
              value={selectedNote.textStyle?.color || '#1a1a1a'}
              onChange={(e) => {
                updateNote(selectedNote.id, {
                  textStyle: { ...selectedNote.textStyle, color: e.target.value }
                });
              }}
              className="w-full h-6 rounded cursor-pointer"
              aria-label="Text color"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-white/70">Font Size</label>
            <select
              value={selectedNote.textStyle?.fontSize || 'medium'}
              onChange={(e) => {
                updateNote(selectedNote.id, {
                  textStyle: { ...selectedNote.textStyle, fontSize: e.target.value as 'small' | 'medium' | 'large' }
                });
              }}
              className="w-full px-2 py-1 bg-[#0C0C0C] text-white rounded text-xs border border-white/20"
              aria-label="Font size"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                updateNote(selectedNote.id, {
                  textStyle: {
                    ...selectedNote.textStyle,
                    fontWeight: selectedNote.textStyle?.fontWeight === 'bold' ? 'normal' : 'bold'
                  }
                });
              }}
              className={`flex-1 px-2 py-1 text-xs rounded transition ${
                selectedNote.textStyle?.fontWeight === 'bold'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
              aria-label="Toggle bold"
              aria-pressed={selectedNote.textStyle?.fontWeight === 'bold'}
            >
              Bold
            </button>
            <button
              onClick={() => {
                updateNote(selectedNote.id, {
                  textStyle: {
                    ...selectedNote.textStyle,
                    textDecoration: selectedNote.textStyle?.textDecoration === 'underline' ? 'none' : 'underline'
                  }
                });
              }}
              className={`flex-1 px-2 py-1 text-xs rounded transition ${
                selectedNote.textStyle?.textDecoration === 'underline'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
              aria-label="Toggle underline"
              aria-pressed={selectedNote.textStyle?.textDecoration === 'underline'}
            >
              Underline
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-white/70">Align</label>
            <select
              value={selectedNote.textStyle?.textAlign || 'left'}
              onChange={(e) => {
                updateNote(selectedNote.id, {
                  textStyle: { ...selectedNote.textStyle, textAlign: e.target.value as 'left' | 'center' | 'right' }
                });
              }}
              className="w-full px-2 py-1 bg-[#0C0C0C] text-white rounded text-xs border border-white/20"
              aria-label="Text alignment"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
