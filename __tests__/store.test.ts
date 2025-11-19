import { useCanvasStore } from '@/lib/store';
import { renderHook, act } from '@testing-library/react';

describe('Canvas Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    useCanvasStore.setState({
      notes: [],
      viewport: { scale: 1, translateX: 0, translateY: 0 },
      selectedNoteId: null,
      lastId: '',
    });
  });

  it('should create a note with default values', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      const noteId = result.current.createNote(100, 150);
      expect(noteId).toBeDefined();
      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0]).toMatchObject({
        x: 100,
        y: 150,
        width: 320,
        height: 210,
        color: '#FFF59D',
        content: '',
      });
    });
  });

  it('should update note properties and persist to storage', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      const noteId = result.current.createNote(100, 150);
      result.current.updateNote(noteId, { content: 'Test content', color: '#BBDEFB' });
    });

    const note = result.current.notes[0];
    expect(note.content).toBe('Test content');
    expect(note.color).toBe('#BBDEFB');
    expect(localStorage.getItem('sticky-canvas-v1')).toBeDefined();
  });

  it('should delete a note', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      const noteId = result.current.createNote(100, 150);
      result.current.deleteNote(noteId);
    });

    expect(result.current.notes).toHaveLength(0);
  });

  it('should duplicate a note with offset position', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      const noteId = result.current.createNote(100, 150);
      result.current.duplicateNote(noteId);
    });

    expect(result.current.notes).toHaveLength(2);
    expect(result.current.notes[1].x).toBe(124);
    expect(result.current.notes[1].y).toBe(174);
  });

  it('should export notes as JSON', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      result.current.createNote(100, 150);
      const json = result.current.exportJSON();
      const data = JSON.parse(json);

      expect(data.notes).toHaveLength(1);
      expect(data.viewport).toBeDefined();
      expect(data.meta).toBeDefined();
    });
  });

  it('should import notes from JSON', () => {
    const { result } = renderHook(() => useCanvasStore());

    const importData = {
      notes: [
        {
          id: 'test_1',
          x: 50,
          y: 50,
          width: 320,
          height: 210,
          zIndex: 1,
          color: '#FFF59D',
          content: 'Imported note',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      viewport: { scale: 1, translateX: 0, translateY: 0 },
      meta: { lastId: 'test_1' },
    };

    act(() => {
      result.current.importJSON(JSON.stringify(importData));
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].content).toBe('Imported note');
  });

  it('should clear all notes and reset state', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      result.current.createNote(100, 150);
      result.current.createNote(200, 250);
      result.current.clearAll();
    });

    expect(result.current.notes).toHaveLength(0);
    expect(result.current.selectedNoteId).toBeNull();
    expect(localStorage.getItem('sticky-canvas-v1')).toBeNull();
  });
});
