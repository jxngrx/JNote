'use client';

import { usePagesStore } from '@/lib/pages-store';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  Download,
  Trash2
} from 'lucide-react';

export default function PagesMode() {
  const pages = usePagesStore((state) => state.pages);
  const activePageId = usePagesStore((state) => state.activePageId);
  const updatePage = usePagesStore((state) => state.updatePage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const setActivePage = usePagesStore((state) => state.setActivePage);
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('16px');
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId);

  // Auto-create page if none exist
  useEffect(() => {
    if (pages.length === 0) {
      const createPage = usePagesStore.getState().createPage;
      createPage();
    }
  }, [pages.length]);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && activePage) {
      if (editorRef.current.innerHTML !== activePage.content) {
        editorRef.current.innerHTML = activePage.content || '';
      }
    } else if (editorRef.current && !activePage) {
      editorRef.current.innerHTML = '';
    }
  }, [activePage?.id, activePage]);

  // Sync content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current && activePage) {
      const content = editorRef.current.innerHTML;
      updatePage(activePage.id, { content });
    }
  }, [activePage, updatePage]);

  // Handle formatting commands
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
    updateToolbarState();
  }, [handleContentChange]);

  const updateToolbarState = useCallback(() => {
    if (!editorRef.current) return;

    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer as HTMLElement;
      const parent = element.nodeType === 3 ? element.parentElement : element;

      if (parent) {
        const computedStyle = window.getComputedStyle(parent);
        const align = computedStyle.textAlign as 'left' | 'center' | 'right';
        setTextAlign(align || 'left');
      }
    }
  }, []);

  const handleSelectionChange = useCallback(() => {
    updateToolbarState();
  }, [updateToolbarState]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== editorRef.current) return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        execCommand('undo');
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        execCommand('redo');
      }

      // Formatting shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        execCommand('underline');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [execCommand]);

  const handleExport = () => {
    if (!activePage) return;

    const content = editorRef.current?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage.title || 'page'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!activePage || pages.length <= 1) return;

    if (window.confirm(`Are you sure you want to delete "${activePage.title}"?`)) {
      deletePage(activePage.id);
      // The store will automatically set the active page to the first remaining page
    }
  };

  if (!activePage) {
    return (
      <div className="pages-mode-empty">
        <div className="empty-content">
          <Type size={48} className="text-white/20" />
          <h2 className="text-xl font-semibold text-white/60 mt-4">No page selected</h2>
          <p className="text-white/40 mt-2">Create a new page to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pages-mode-container">
      {/* Floating Toolbar */}
      <div className="pages-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => execCommand('undo')}
            className="toolbar-btn"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="toolbar-btn"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={() => execCommand('bold')}
            className={`toolbar-btn ${isBold ? 'active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className={`toolbar-btn ${isItalic ? 'active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              execCommand('fontSize', '7');
              if (editorRef.current) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const element = range.commonAncestorContainer as HTMLElement;
                  const parent = element.nodeType === 3 ? element.parentElement : element;
                  if (parent) {
                    parent.style.fontSize = e.target.value;
                  }
                }
              }
            }}
            className="toolbar-select"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>

          <input
            type="color"
            value={fontColor}
            onChange={(e) => {
              setFontColor(e.target.value);
              execCommand('foreColor', e.target.value);
            }}
            className="toolbar-color"
            title="Text Color"
          />
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={() => {
              setTextAlign('left');
              execCommand('justifyLeft');
            }}
            className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => {
              setTextAlign('center');
              execCommand('justifyCenter');
            }}
            className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => {
              setTextAlign('right');
              execCommand('justifyRight');
            }}
            className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={handleExport}
            className="toolbar-btn"
            title="Export Page"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="toolbar-btn hover:text-red-400"
            title="Delete Page"
            disabled={!activePage || pages.length <= 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="pages-editor-wrapper">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="pages-editor"
          onInput={handleContentChange}
          onBlur={handleContentChange}
          style={{
            fontSize,
            color: fontColor,
            textAlign,
          }}
          data-placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
