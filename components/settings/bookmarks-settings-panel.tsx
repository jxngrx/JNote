'use client';

import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_BOOKMARKS_SETTINGS,
  useBookmarksSettingsStore,
  type BookmarkStackLayout,
} from '@/lib/bookmarks-settings-store';
import '../bookmarks-settings.css';

function LayoutPicker({
  value,
  onChange,
}: {
  value: BookmarkStackLayout;
  onChange: (value: BookmarkStackLayout) => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--variant">
      <span className="widgets-setting-label">Stack style</span>
      <div className="widgets-variant-picker">
        <button
          type="button"
          className={`widgets-variant-picker-btn${value === 'fan' ? ' is-active' : ''}`}
          onClick={() => onChange('fan')}
        >
          Fan
        </button>
        <button
          type="button"
          className={`widgets-variant-picker-btn${value === 'grid' ? ' is-active' : ''}`}
          onClick={() => onChange('grid')}
        >
          Grid
        </button>
      </div>
    </div>
  );
}

function LayoutPreview({ layout }: { layout: BookmarkStackLayout }) {
  if (layout === 'fan') {
    return (
      <div className="bookmarks-settings-preview bookmarks-settings-preview--fan" aria-hidden>
        <div className="bookmarks-settings-preview-fan-item" style={{ '--fan-index': 2 } as React.CSSProperties}>
          <span className="bookmarks-settings-preview-pill">Notion</span>
          <span className="bookmarks-settings-preview-icon" />
        </div>
        <div className="bookmarks-settings-preview-fan-item" style={{ '--fan-index': 1 } as React.CSSProperties}>
          <span className="bookmarks-settings-preview-pill">GitHub</span>
          <span className="bookmarks-settings-preview-icon" />
        </div>
        <div className="bookmarks-settings-preview-fan-item" style={{ '--fan-index': 0 } as React.CSSProperties}>
          <span className="bookmarks-settings-preview-pill">Linear</span>
          <span className="bookmarks-settings-preview-icon" />
        </div>
        <span className="bookmarks-settings-preview-trigger" />
      </div>
    );
  }

  return (
    <div className="bookmarks-settings-preview bookmarks-settings-preview--grid" aria-hidden>
      <div className="bookmarks-settings-preview-grid-row">
        <div className="bookmarks-settings-preview-grid-item">
          <span className="bookmarks-settings-preview-icon" />
          <span>Linear</span>
        </div>
        <div className="bookmarks-settings-preview-grid-item">
          <span className="bookmarks-settings-preview-icon" />
          <span>GitHub</span>
        </div>
        <div className="bookmarks-settings-preview-grid-item">
          <span className="bookmarks-settings-preview-icon" />
          <span>Notion</span>
        </div>
      </div>
    </div>
  );
}

export default function BookmarksSettingsPanel() {
  const layout = useBookmarksSettingsStore((s) => s.layout);
  const setLayout = useBookmarksSettingsStore((s) => s.setLayout);
  const resetSettings = useBookmarksSettingsStore((s) => s.resetSettings);

  return (
    <section className="app-settings-section">
      <h3 className="app-settings-section-title">Bookmarks</h3>
      <p className="app-settings-section-copy">
        Fan shows every site in one stack. Grid groups sites into categories you create.
      </p>

      <LayoutPicker value={layout} onChange={setLayout} />

      <div className="bookmarks-settings-preview-wrap">
        <LayoutPreview layout={layout} />
      </div>

      <div className="widgets-setting-row widgets-setting-row--action">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset bookmarks settings
        </button>
      </div>
    </section>
  );
}
