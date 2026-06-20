'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';
import { usePagesStore } from '@/lib/pages-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageTitle } from '@/components/pages/page-title';
import { PageTopbar } from '@/components/pages/page-topbar';
import { NotebookView } from '@/components/pages/notebook-view';
import { normalizePageFontId } from '@/lib/page-fonts';
import type { PageContentJson } from '@/lib/types';
import type { PageFontId } from '@/lib/page-fonts';
import { exportPageToPdf } from '@/lib/pages-export-pdf';
import { jsonToHtml, normalizePageContent } from '@/lib/pages-migrate-client';
import '@/components/pages/pages-editor.css';

const PageEditor = dynamic(
  () => import('@/components/pages/page-editor').then((m) => m.PageEditor),
  { ssr: false, loading: () => <div className="page-editor-loading">Loading editor…</div> }
);

export default function PagesMode() {
  const pages = usePagesStore((state) => state.pages);
  const activePageId = usePagesStore((state) => state.activePageId);
  const updatePage = usePagesStore((state) => state.updatePage);
  const createPage = usePagesStore((state) => state.createPage);

  const activePage = pages.find((p) => p.id === activePageId);

  const [savedVisible, setSavedVisible] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [editorInstance, setEditorInstance] = useState<import('@tiptap/core').Editor | null>(null);
  const [exportPdfBusy, setExportPdfBusy] = useState(false);
  const [exportPdfError, setExportPdfError] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentUpdate = useCallback(
    (contentJson: PageContentJson) => {
      if (!activePage) return;
      updatePage(activePage.id, { contentJson });
      setSavedVisible(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSavedVisible(false), 2000);
    },
    [activePage, updatePage]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!activePage) {
    return (
      <div className="pages-mode-empty">
        <div className="pages-empty-content">
          <FileText size={48} strokeWidth={1.25} className="pages-empty-icon" />
          <h2 className="pages-empty-title">No page selected</h2>
          <p className="pages-empty-desc">Create a new page to get started</p>
          <button type="button" className="pages-empty-cta" onClick={() => createPage()}>
            Create page
          </button>
        </div>
      </div>
    );
  }

  const viewMode = activePage.viewMode ?? 'editor';
  const chromeVisible = !editorFocused;
  const titleDimmed = editorFocused && !titleFocused;
  const pageFont = normalizePageFontId(activePage.fontFamily);

  const handleExportPdf = useCallback(
    async (options: { watermark?: boolean } = { watermark: true }) => {
      if (!activePage || exportPdfBusy) return;

      setExportPdfBusy(true);
      setExportPdfError(null);
      try {
        const html = editorInstance
          ? jsonToHtml(editorInstance.getJSON() as PageContentJson)
          : jsonToHtml(normalizePageContent(activePage));

        await exportPageToPdf({
          title: activePage.title,
          html,
          fontFamily: pageFont,
          watermark: options.watermark ?? true,
        });
      } catch {
        setExportPdfError('PDF export failed. Try again.');
      } finally {
        setExportPdfBusy(false);
      }
    },
    [activePage, editorInstance, exportPdfBusy, pageFont]
  );

  const editorNode = (
    <PageEditor
      key={activePage.id}
      page={activePage}
      variant={viewMode}
      onUpdate={handleContentUpdate}
      onFocusChange={setEditorFocused}
      onEditorReady={setEditorInstance}
      onPageFontSizeChange={(editorFontSize) =>
        updatePage(activePage.id, { editorFontSize })
      }
    />
  );

  return (
    <div className={`pages-mode-container pages-mode-container--${viewMode}`}>
      <ScrollArea className="page-editor-scroll">
        <PageTopbar
          editor={editorInstance}
          fontFamily={pageFont}
          width={activePage.width ?? 'narrow'}
          viewMode={viewMode}
          savedVisible={savedVisible}
          chromeVisible={chromeVisible}
          onFontFamilyChange={(fontFamily) =>
            updatePage(activePage.id, { fontFamily: fontFamily as PageFontId })
          }
          onWidthChange={(width) => updatePage(activePage.id, { width })}
          onViewModeChange={(mode) => updatePage(activePage.id, { viewMode: mode })}
          showLineNumbers={activePage.showLineNumbers ?? false}
          onShowLineNumbersChange={(showLineNumbers) =>
            updatePage(activePage.id, { showLineNumbers })
          }
          onExportPdf={(options) => void handleExportPdf(options)}
          exportPdfBusy={exportPdfBusy}
        />
        {exportPdfError ? (
          <p className="page-export-error" role="alert">
            {exportPdfError}
          </p>
        ) : null}
        <div
          className={[
            'page-editor-shell',
            activePage.width === 'full' ? 'page-editor-width-full' : 'page-editor-width-narrow',
            viewMode === 'notebook' ? 'page-editor-shell--notebook' : '',
            editorFocused ? 'page-editor-shell--typing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <PageTitle
            value={activePage.title}
            dimmed={titleDimmed}
            onFocusChange={setTitleFocused}
            onChange={(title) => updatePage(activePage.id, { title })}
          />
          {viewMode === 'notebook' ? (
            <NotebookView
              settings={activePage.notebookSettings}
              notebookFontId={activePage.notebookSettings?.notebookFont ?? pageFont}
            >
              {editorNode}
            </NotebookView>
          ) : (
            editorNode
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
