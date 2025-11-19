'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/store';
import StickyNote from './sticky-note';
import NoteToolbar from './note-toolbar';
import { Viewport } from '@/lib/types';

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const notes = useCanvasStore((state) => state.notes);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const setSelectedNote = useCanvasStore((state) => state.setSelectedNote);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Deselect note if clicking on canvas (not on a note or toolbar)
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('.canvas-content')) {
      const target = e.target as HTMLElement;
      if (!target.closest('.sticky-note') && !target.closest('.note-toolbar')) {
        setSelectedNote(null);
      }
    }

    // Only pan with middle mouse or space+left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsDraggingViewport(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingViewport) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setViewport({
      ...viewport,
      translateX: viewport.translateX + deltaX,
      translateY: viewport.translateY + deltaY,
    });

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDraggingViewport(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * zoomFactor));

    setViewport({
      ...viewport,
      scale: newScale,
    });
  };

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.style.transform = `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`;
    }
  }, [viewport]);

  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div ref={viewportRef} className="canvas-viewport">
        <div className="canvas-content">
          {notes.map((note) => (
            <StickyNote key={note.id} note={note} />
          ))}
        </div>
      </div>
      <NoteToolbar />
    </div>
  );
}
