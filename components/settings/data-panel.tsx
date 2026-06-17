'use client';

import { Download, Upload } from 'lucide-react';
import { useAreaStore } from '@/lib/area-store';
import { useCanvasStore } from '@/lib/store';
import { usePagesStore } from '@/lib/pages-store';
import type { Page } from '@/lib/types';
import { useTodoStore } from '@/lib/todo-store';

type DataPanelProps = {
  onClose: () => void;
};

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pickJsonFile(onText: (text: string) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    onText(await file.text());
  };
  input.click();
}

const DATA_ACTIONS = [
  {
    id: 'sticky-notes',
    title: 'Sticky Notes',
    description: 'Export or import all sticky notes on the canvas.',
    exportFilename: () => `sticky-notes-${Date.now()}.json`,
    export: () => useCanvasStore.getState().exportJSON(),
    import: (text: string) => useCanvasStore.getState().importJSON(text),
    invalidMessage: 'Invalid sticky notes JSON file.',
  },
  {
    id: 'pages',
    title: 'Pages',
    description: 'Export or import your pages workspace.',
    exportFilename: () => `pages-${Date.now()}.json`,
    export: () => {
      const state = usePagesStore.getState();
      return JSON.stringify({
        pages: state.pages,
        activePageId: state.activePageId,
        exportedAt: Date.now(),
      });
    },
    import: async (text: string) => {
      const parsed = JSON.parse(text);
      const { normalizePageContent, jsonToHtml } = await import('@/lib/pages-migrate-client');
      const nextPages = Array.isArray(parsed.pages)
        ? parsed.pages.map((p: Page) => {
            const contentJson = normalizePageContent(p);
            return {
              ...p,
              contentJson,
              content: p.content?.trim() ? p.content : jsonToHtml(contentJson),
            };
          })
        : [];
      const activePageId =
        typeof parsed.activePageId === 'string' ? parsed.activePageId : null;
      usePagesStore.setState({ pages: nextPages, activePageId });
      usePagesStore.getState().saveToStorage();
    },
    invalidMessage: 'Invalid pages JSON file.',
  },
  {
    id: 'area',
    title: 'Area',
    description: 'Export or import Area scenes and drawings.',
    exportFilename: () => `area-${Date.now()}.json`,
    export: () => useAreaStore.getState().exportJSON(),
    import: (text: string) => useAreaStore.getState().importJSON(text),
    invalidMessage: 'Invalid area JSON file.',
  },
  {
    id: 'todo',
    title: 'Todo',
    description: 'Export or import todo lists, columns, and trash.',
    exportFilename: () => `todo-${Date.now()}.json`,
    export: () => {
      const state = useTodoStore.getState();
      return JSON.stringify({
        lists: state.lists,
        activeListId: state.activeListId,
        exportedAt: Date.now(),
      });
    },
    import: (text: string) => useTodoStore.getState().importJSON(text),
    invalidMessage: 'Invalid todo JSON file.',
  },
] as const;

export default function DataPanel({ onClose }: DataPanelProps) {
  return (
    <section className="app-settings-section">
      <h3 className="app-settings-section-title">Workspace data</h3>
      <p className="app-settings-section-desc">
        Export or import content for each mode. Imports replace current data for
        that mode.
      </p>
      {DATA_ACTIONS.map((action) => (
        <div key={action.id} className="app-settings-action-row">
          <div className="app-settings-action-copy">
            <strong>{action.title}</strong>
            <span>{action.description}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              className="app-settings-btn app-settings-btn--ghost"
              onClick={() => {
                downloadJson(action.exportFilename(), action.export());
                onClose();
              }}
            >
              <Download size={14} />
              Export
            </button>
            <button
              type="button"
              className="app-settings-btn"
              onClick={() => {
                pickJsonFile((text) => {
                  void (async () => {
                    try {
                      await action.import(text);
                      onClose();
                    } catch (e) {
                      alert(action.invalidMessage);
                      console.error(e);
                    }
                  })();
                });
              }}
            >
              <Upload size={14} />
              Import
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
