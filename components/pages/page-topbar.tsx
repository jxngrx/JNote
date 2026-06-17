'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { PageFontFamily, PageViewMode, PageWidth } from '@/lib/types';
import type { PagePdfExportOptions } from '@/lib/pages-export-pdf';
import {
  PAGE_FONT_GROUPS,
  PAGE_FONTS,
  normalizePageFontId,
  type PageFontId,
} from '@/lib/page-fonts';
import { applyPageFontToEditor } from '@/lib/page-font-utils';
import { usePageFontLoader } from '@/hooks/use-page-font-loader';
import { Hash, FileDown, ChevronDown } from 'lucide-react';

const SHOW_NOTEBOOK_MODE = false;

type PageTopbarProps = {
  editor: Editor | null;
  fontFamily: PageFontFamily;
  width: PageWidth;
  viewMode: PageViewMode;
  savedVisible: boolean;
  chromeVisible: boolean;
  onFontFamilyChange: (value: PageFontId) => void;
  onWidthChange: (value: PageWidth) => void;
  onViewModeChange: (value: PageViewMode) => void;
  showLineNumbers: boolean;
  onShowLineNumbersChange: (value: boolean) => void;
  onExportPdf?: (options: PagePdfExportOptions) => void;
  exportPdfBusy?: boolean;
};

function countCharacters(editor: Editor | null): number {
  if (!editor) return 0;
  return editor.state.doc.textContent.length;
}

function resolveActiveFontId(editor: Editor | null, pageFont: PageFontId): PageFontId {
  if (!editor) return pageFont;
  const { empty } = editor.state.selection;
  if (empty) return pageFont;
  const attr = editor.getAttributes('textStyle').fontFamily as string | undefined;
  if (!attr) return pageFont;
  const match = PAGE_FONTS.find(
    (f) => attr.includes(f.label) || attr === f.css || attr.includes(f.css.replace(/var\(|\)/g, ''))
  );
  if (match) return match.id;
  return pageFont;
}

export function PageTopbar({
  editor,
  fontFamily,
  width,
  viewMode,
  savedVisible,
  chromeVisible,
  onFontFamilyChange,
  onWidthChange,
  onViewModeChange,
  showLineNumbers,
  onShowLineNumbersChange,
  onExportPdf,
  exportPdfBusy = false,
}: PageTopbarProps) {
  const [charCount, setCharCount] = useState(0);
  const [displayFont, setDisplayFont] = useState<PageFontId>(normalizePageFontId(fontFamily));
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const pageFont = normalizePageFontId(fontFamily);
  usePageFontLoader(pageFont);

  useEffect(() => {
    if (!editor) {
      setCharCount(0);
      setDisplayFont(pageFont);
      return;
    }
    const update = () => {
      setCharCount(countCharacters(editor));
      setDisplayFont(resolveActiveFontId(editor, pageFont));
    };
    update();
    editor.on('update', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('update', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor, pageFont]);

  useEffect(() => {
    setDisplayFont(resolveActiveFontId(editor, pageFont));
  }, [editor, pageFont, fontFamily]);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportMenuOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [exportMenuOpen]);

  const handleFontChange = (nextId: PageFontId) => {
    if (editor) {
      applyPageFontToEditor(editor, nextId, onFontFamilyChange);
    } else {
      onFontFamilyChange(nextId);
    }
  };

  return (
    <div className={`page-topbar ${chromeVisible ? 'is-visible' : 'is-faded'}${SHOW_NOTEBOOK_MODE ? '' : ' page-topbar--no-center'}`}>
      <div className="page-topbar-left">
        <select
          className="page-topbar-select page-topbar-font-select"
          value={displayFont}
          onChange={(e) => handleFontChange(e.target.value as PageFontId)}
          aria-label="Font family"
        >
          {PAGE_FONT_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {PAGE_FONTS.filter((f) => f.group === group.id).map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {viewMode === 'editor' ? (
          <select
            className="page-topbar-select"
            value={width}
            onChange={(e) => onWidthChange(e.target.value as PageWidth)}
            aria-label="Page width"
          >
            <option value="narrow">Narrow</option>
            <option value="full">Full</option>
          </select>
        ) : null}
      </div>

      {SHOW_NOTEBOOK_MODE ? (
        <div className="page-topbar-center">
          <div className="page-view-mode-toggle" role="group" aria-label="Notes view mode">
            <button
              type="button"
              className={`page-view-mode-btn ${viewMode === 'editor' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('editor')}
              title="Editor mode"
            >
              <span>Editor</span>
            </button>
            <button
              type="button"
              className={`page-view-mode-btn ${viewMode === 'notebook' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('notebook')}
              title="Notebook mode"
            >
              <span>Notebook</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="page-topbar-right">
        {onExportPdf ? (
          <div className="page-topbar-export-menu" ref={exportMenuRef}>
            <button
              type="button"
              className="page-topbar-export-btn"
              onClick={() => onExportPdf({ watermark: true })}
              disabled={exportPdfBusy}
              title="Export page as PDF"
              aria-label="Export page as PDF"
            >
              <FileDown size={13} />
              <span>{exportPdfBusy ? 'Exporting…' : 'PDF'}</span>
            </button>
            <button
              type="button"
              className="page-topbar-export-menu-trigger"
              onClick={() => setExportMenuOpen((open) => !open)}
              disabled={exportPdfBusy}
              aria-label="More PDF export options"
              aria-expanded={exportMenuOpen}
              aria-haspopup="menu"
            >
              <ChevronDown size={12} />
            </button>
            {exportMenuOpen ? (
              <div className="page-topbar-export-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="page-topbar-export-dropdown-item"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportPdf({ watermark: false });
                  }}
                >
                  PDF without watermark
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          className={`page-topbar-line-toggle${showLineNumbers ? ' is-active' : ''}`}
          onClick={() => onShowLineNumbersChange(!showLineNumbers)}
          aria-pressed={showLineNumbers}
          title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
        >
          <Hash size={13} />
          <span>Lines</span>
        </button>
        <span className="page-topbar-meta">{charCount.toLocaleString()} chars</span>
        <span className={`page-topbar-save ${savedVisible ? 'is-visible' : ''}`}>Saved</span>
      </div>
    </div>
  );
}
