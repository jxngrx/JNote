'use client';

import { useAppStore } from '@/lib/app-store';
import { usePagesStore } from '@/lib/pages-store';
import { useAreaStore } from '@/lib/area-store';
import { useCanvasStore } from '@/lib/store';
import { AppMode } from '@/lib/types';
import {
  StickyNote,
  FileText,
  PenTool,
  Plus,
  Settings,
  Keyboard,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
  Menu,
  Sparkles,
  Download
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const pages = usePagesStore((state) => state.pages);
  const activePageId = usePagesStore((state) => state.activePageId);
  const createPage = usePagesStore((state) => state.createPage);
  const setActivePage = usePagesStore((state) => state.setActivePage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const scenes = useAreaStore((state) => state.scenes);
  const activeSceneId = useAreaStore((state) => state.activeSceneId);
  const createScene = useAreaStore((state) => state.createScene);
  const setActiveScene = useAreaStore((state) => state.setActiveScene);
  const deleteScene = useAreaStore((state) => state.deleteScene);
  const clearAllNotes = useCanvasStore((state) => state.clearAll);
  const exportNotes = useCanvasStore((state) => state.exportJSON);

  const handleClearAllPages = () => {
    const deletePage = usePagesStore.getState().deletePage;
    const pages = usePagesStore.getState().pages;
    pages.forEach(page => deletePage(page.id));
  };

  const handleExportPages = () => {
    const state = usePagesStore.getState();
    return JSON.stringify({
      pages: state.pages,
      activePageId: state.activePageId,
      exportedAt: Date.now(),
    });
  };

  const handleClearAllScenes = () => {
    const deleteScene = useAreaStore.getState().deleteScene;
    const scenes = useAreaStore.getState().scenes;
    scenes.forEach(scene => deleteScene(scene.id));
  };

  const handleExportScenes = () => {
    const state = useAreaStore.getState();
    return JSON.stringify({
      scenes: state.scenes,
      activeSceneId: state.activeSceneId,
      exportedAt: Date.now(),
    });
  };
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pages', 'area']));

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
  };

  const handleCreatePage = () => {
    const newId = createPage();
    setActivePage(newId);
  };

  const handlePageClick = (pageId: string) => {
    setActivePage(pageId);
  };

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();

    if (pages.length <= 1) {
      alert('Cannot delete the last page. Create a new page first.');
      return;
    }

    const pageToDelete = pages.find(p => p.id === pageId);
    if (pageToDelete && window.confirm(`Are you sure you want to delete "${pageToDelete.title}"?`)) {
      deletePage(pageId);
    }
  };

  const handleCreateScene = () => {
    const newId = createScene();
    setActiveScene(newId);
  };

  const handleSceneClick = (sceneId: string) => {
    setActiveScene(sceneId);
  };

  const handleDeleteScene = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();

    if (scenes.length <= 1) {
      alert('Cannot delete the last scene. Create a new scene first.');
      return;
    }

    const sceneToDelete = scenes.find(s => s.id === sceneId);
    if (sceneToDelete && window.confirm(`Are you sure you want to delete "${sceneToDelete.title}"?`)) {
      deleteScene(sceneId);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const activePage = pages.find((p) => p.id === activePageId);

  return (
    <div className={`sidebar-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        {isExpanded ? (
          <div className="flex items-center gap-2 flex-1">
            <Sparkles size={20} className="text-white" />
            <span className="font-semibold text-base text-white">Menu</span>
          </div>
        ) : (
          <Sparkles size={20} className="text-white" />
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="sidebar-toggle-btn"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="sidebar-nav">
        {/* Sticky Notes Mode */}
        <button
          onClick={() => handleModeSwitch('sticky-notes')}
          className={`nav-item ${mode === 'sticky-notes' ? 'active' : ''}`}
          title={!isExpanded ? 'Sticky Notes' : ''}
        >
          <div className="nav-icon-wrapper">
            <StickyNote size={20} />
          </div>
          {isExpanded && <span className="nav-label">Sticky Notes</span>}
        </button>

        {/* Pages Mode */}
        <div className="nav-section">
          <div
            className={`nav-item ${mode === 'pages' ? 'active' : ''}`}
            title={!isExpanded ? 'Pages' : ''}
          >
            <button
              onClick={() => {
                handleModeSwitch('pages');
                if (!expandedSections.has('pages')) {
                  toggleSection('pages');
                }
              }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="nav-icon-wrapper">
                <FileText size={20} />
              </div>
              {isExpanded && <span className="nav-label">Pages</span>}
            </button>
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('pages');
                }}
                className="nav-expand-btn"
              >
                {expandedSections.has('pages') ? '−' : '+'}
              </button>
            )}
          </div>

          {/* Pages List (sub-items) */}
          {isExpanded && expandedSections.has('pages') && mode === 'pages' && (
            <div className="nav-subitems">
              {pages.length === 0 ? (
                <div className="nav-subitem empty">
                  <span>No pages</span>
                </div>
              ) : (
                pages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => handlePageClick(page.id)}
                    className={`nav-subitem group ${activePageId === page.id ? 'active' : ''}`}
                  >
                    <FileText size={16} className="nav-subitem-icon" />
                    <span className="nav-subitem-label">{page.title}</span>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => handleDeletePage(e, page.id)}
                        className="nav-subitem-delete"
                        title="Delete page"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Area Mode */}
        <div className="nav-section">
          <div
            className={`nav-item ${mode === 'area' ? 'active' : ''}`}
            title={!isExpanded ? 'Area' : ''}
          >
            <button
              onClick={() => {
                handleModeSwitch('area');
                if (!expandedSections.has('area')) {
                  toggleSection('area');
                }
              }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="nav-icon-wrapper">
                <PenTool size={20} />
              </div>
              {isExpanded && <span className="nav-label">Area</span>}
            </button>
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('area');
                }}
                className="nav-expand-btn"
              >
                {expandedSections.has('area') ? '−' : '+'}
              </button>
            )}
          </div>

          {/* Scenes List (sub-items) */}
          {isExpanded && expandedSections.has('area') && mode === 'area' && (
            <div className="nav-subitems">
              {scenes.length === 0 ? (
                <div className="nav-subitem empty">
                  <span>No scenes</span>
                </div>
              ) : (
                scenes.map((scene) => (
                  <div
                    key={scene.id}
                    onClick={() => handleSceneClick(scene.id)}
                    className={`nav-subitem group ${activeSceneId === scene.id ? 'active' : ''}`}
                  >
                    <PenTool size={16} className="nav-subitem-icon" />
                    <span className="nav-subitem-label">{scene.title}</span>
                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteScene(e, scene.id)}
                        className="nav-subitem-delete"
                        title="Delete scene"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Create Page (only in Pages mode) */}
        {mode === 'pages' && (
          <button
            onClick={handleCreatePage}
            className="nav-item"
            title={!isExpanded ? 'New Page' : ''}
          >
            <div className="nav-icon-wrapper">
              <Plus size={20} />
            </div>
            {isExpanded && (
              <>
                <span className="nav-label">New Page</span>
                <span className="nav-expand-btn">+</span>
              </>
            )}
          </button>
        )}

        {/* Create Scene (only in Area mode) */}
        {mode === 'area' && (
          <button
            onClick={handleCreateScene}
            className="nav-item"
            title={!isExpanded ? 'New Scene' : ''}
          >
            <div className="nav-icon-wrapper">
              <Plus size={20} />
            </div>
            {isExpanded && (
              <>
                <span className="nav-label">New Scene</span>
                <span className="nav-expand-btn">+</span>
              </>
            )}
          </button>
        )}

        {/* Shortcuts */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="nav-item"
          title={!isExpanded ? 'Shortcuts' : ''}
        >
          <div className="nav-icon-wrapper">
            <Keyboard size={20} />
          </div>
          {isExpanded && <span className="nav-label">Shortcuts</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="nav-item"
          title={!isExpanded ? 'Settings' : ''}
        >
          <div className="nav-icon-wrapper">
            <Settings size={20} />
          </div>
          {isExpanded && <span className="nav-label">Settings</span>}
        </button>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-key">⌘⇧S</span>
                <span>Switch to Sticky Notes</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘⇧P</span>
                <span>Switch to Pages</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘⇧A</span>
                <span>Switch to Area</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘N</span>
                <span>New Page/Scene</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘Z</span>
                <span>Undo</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘⇧Z</span>
                <span>Redo</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">⌘Space</span>
                <span>Focus Sidebar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <h3>Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-list">
              <div className="settings-section">
                <h4 className="settings-section-title">Data Management</h4>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all sticky notes? This cannot be undone.')) {
                      clearAllNotes();
                      setShowSettings(false);
                    }
                  }}
                  className="settings-btn danger"
                >
                  <Trash2 size={16} />
                  <span>Clear All Sticky Notes</span>
                </button>
                {mode === 'pages' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all pages? This cannot be undone.')) {
                        handleClearAllPages();
                        setShowSettings(false);
                      }
                    }}
                    className="settings-btn danger"
                  >
                    <Trash2 size={16} />
                    <span>Clear All Pages</span>
                  </button>
                )}
                {mode === 'area' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all scenes? This cannot be undone.')) {
                        handleClearAllScenes();
                        setShowSettings(false);
                      }
                    }}
                    className="settings-btn danger"
                  >
                    <Trash2 size={16} />
                    <span>Clear All Scenes</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const json = exportNotes();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `sticky-notes-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setShowSettings(false);
                  }}
                  className="settings-btn"
                >
                  <Download size={16} />
                  <span>Export Sticky Notes</span>
                </button>
                {mode === 'pages' && (
                  <button
                    onClick={() => {
                      const json = handleExportPages();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pages-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowSettings(false);
                    }}
                    className="settings-btn"
                  >
                    <Download size={16} />
                    <span>Export Pages</span>
                  </button>
                )}
                {mode === 'area' && (
                  <button
                    onClick={() => {
                      const json = handleExportScenes();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `scenes-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowSettings(false);
                    }}
                    className="settings-btn"
                  >
                    <Download size={16} />
                    <span>Export Scenes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
