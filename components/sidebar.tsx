'use client';

import { useAppStore } from '@/lib/app-store';
import { usePagesStore } from '@/lib/pages-store';
import { useAreaStore } from '@/lib/area-store';
import { useCanvasStore } from '@/lib/store';
import { useTodoStore } from '@/lib/todo-store';
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
  Sparkles,
  Download,
  Upload,
  CheckSquare,
  Globe,
  Edit2
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
  const todoLists = useTodoStore((state) => state.lists);
  const activeTodoListId = useTodoStore((state) => state.activeListId);
  const createTodoList = useTodoStore((state) => state.createList);
  const setActiveTodoList = useTodoStore((state) => state.setActiveList);
  const deleteTodoList = useTodoStore((state) => state.deleteList);
  const updateTodoList = useTodoStore((state) => state.updateList);
  const clearAllNotes = useCanvasStore((state) => state.clearAll);
  const exportNotes = useCanvasStore((state) => state.exportJSON);
  const importNotes = useCanvasStore((state) => state.importJSON);

  const downloadJson = (filename: string, json: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pickJsonFile = (onText: (text: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      onText(text);
    };
    input.click();
  };

  const exportPages = () => {
    const state = usePagesStore.getState();
    return JSON.stringify({ pages: state.pages, activePageId: state.activePageId, exportedAt: Date.now() });
  };

  const importPages = (jsonText: string) => {
    const parsed = JSON.parse(jsonText);
    const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
    const activePageId = typeof parsed.activePageId === 'string' ? parsed.activePageId : null;
    usePagesStore.setState({ pages, activePageId });
    usePagesStore.getState().saveToStorage();
  };

  const exportArea = () => {
    const state = useAreaStore.getState();
    return JSON.stringify({ scenes: state.scenes, activeSceneId: state.activeSceneId, exportedAt: Date.now() });
  };

  const importArea = (jsonText: string) => {
    const parsed = JSON.parse(jsonText);
    const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
    const activeSceneId = typeof parsed.activeSceneId === 'string' ? parsed.activeSceneId : null;
    useAreaStore.setState({ scenes, activeSceneId });
    useAreaStore.getState().saveToStorage();
  };

  const exportTodo = () => {
    const state = useTodoStore.getState();
    return JSON.stringify({ lists: state.lists, activeListId: state.activeListId, exportedAt: Date.now() });
  };

  const importTodo = (jsonText: string) => {
    const parsed = JSON.parse(jsonText);
    const lists = Array.isArray(parsed.lists) ? parsed.lists : [];
    const activeListId = typeof parsed.activeListId === 'string' ? parsed.activeListId : null;
    useTodoStore.setState({ lists, activeListId });
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

  const handleTodoListClick = (listId: string) => {
    setActiveTodoList(listId);
  };

  const handleDeleteTodoList = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    const listToDelete = todoLists.find((l) => l.id === listId);
    if (listToDelete && window.confirm(`Are you sure you want to delete "${listToDelete.title}"?`)) {
      deleteTodoList(listId);
    }
  };

  const handleRenameTodoList = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    const list = todoLists.find((l) => l.id === listId);
    if (!list) return;
    const next = window.prompt('Todo list title', list.title);
    if (next !== null) updateTodoList(listId, { title: next });
  };

  const handleDeleteScene = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();

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

  type NavItemConfig = {
    key: string;
    label: string;
    title?: string;
    icon: React.ComponentType<{ size?: number }>;
    mode?: AppMode;
    onClick?: () => void;
    visible?: boolean;
  };

  type NavSectionConfig = {
    key: 'pages' | 'area' | 'todo';
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    mode: Extract<AppMode, 'pages' | 'area' | 'todo'>;
  };

  const topNavItems: NavItemConfig[] = [
    {
      key: 'world-time',
      label: 'World Time',
      title: 'World Time',
      icon: Globe,
      mode: 'world-time',
      onClick: () => handleModeSwitch('world-time'),
    },
  ];

  const sections: NavSectionConfig[] = [
    { key: 'todo', label: 'Todo', icon: CheckSquare, mode: 'todo' },
    { key: 'pages', label: 'Pages', icon: FileText, mode: 'pages' },
    { key: 'area', label: 'Area', icon: PenTool, mode: 'area' },
  ];

  const midNavItems: NavItemConfig[] = [
    {
      key: 'sticky-notes',
      label: 'Sticky Notes',
      title: 'Sticky Notes',
      icon: StickyNote,
      mode: 'sticky-notes',
      onClick: () => handleModeSwitch('sticky-notes'),
    },
  ];

  const modeActions: NavItemConfig[] = [
    {
      key: 'new-page',
      label: 'New Page',
      title: 'New Page',
      icon: Plus,
      visible: mode === 'pages',
      onClick: handleCreatePage,
    },
    {
      key: 'new-scene',
      label: 'New Scene',
      title: 'New Scene',
      icon: Plus,
      visible: mode === 'area',
      onClick: handleCreateScene,
    },
    {
      key: 'new-todo-list',
      label: 'New Todo',
      title: 'New Todo',
      icon: Plus,
      visible: mode === 'todo',
      onClick: () => {
        const newId = createTodoList();
        setActiveTodoList(newId);
      },
    },
  ];

  const bottomNavItems: NavItemConfig[] = [
    {
      key: 'shortcuts',
      label: 'Shortcuts',
      title: 'Shortcuts',
      icon: Keyboard,
      onClick: () => setShowShortcuts(!showShortcuts),
    },
    {
      key: 'settings',
      label: 'Settings',
      title: 'Settings',
      icon: Settings,
      onClick: () => setShowSettings(!showSettings),
    },
  ];

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
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.mode ? mode === item.mode : false;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`nav-item ${active ? 'active' : ''}`}
              title={!isExpanded ? item.title || item.label : ''}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              {isExpanded && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}

        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = mode === section.mode;
          const isOpen = expandedSections.has(section.key);

          return (
            <div key={section.key} className="nav-section">
              <div
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={!isExpanded ? section.label : ''}
              >
                <button
                  onClick={() => {
                    handleModeSwitch(section.mode);
                    if (!expandedSections.has(section.key)) {
                      toggleSection(section.key);
                    }
                  }}
                  className="nav-item-button"
                >
                  <div className="nav-icon-wrapper">
                    <Icon size={20} />
                  </div>
                  {isExpanded && <span className="nav-label">{section.label}</span>}
                </button>
                {isExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.key);
                    }}
                    className="nav-expand-btn"
                  >
                    {isOpen ? '−' : '+'}
                  </button>
                )}
              </div>

              {/* Section sub-items */}
              {isExpanded && isOpen && isActive && section.key === 'pages' && (
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
                        <button
                          onClick={(e) => handleDeletePage(e, page.id)}
                          className="nav-subitem-delete"
                          title="Delete page"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {isExpanded && isOpen && isActive && section.key === 'area' && (
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
                        <button
                          onClick={(e) => handleDeleteScene(e, scene.id)}
                          className="nav-subitem-delete"
                          title="Delete scene"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {isExpanded && isOpen && isActive && section.key === 'todo' && (
                <div className="nav-subitems">
                  {todoLists.length === 0 ? (
                    <div className="nav-subitem empty">
                      <span>No todo lists</span>
                    </div>
                  ) : (
                    todoLists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => handleTodoListClick(list.id)}
                        className={`nav-subitem group ${activeTodoListId === list.id ? 'active' : ''}`}
                      >
                        <CheckSquare size={16} className="nav-subitem-icon" />
                        <span className="nav-subitem-label">{list.title}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={(e) => handleRenameTodoList(e, list.id)}
                            className="nav-subitem-delete"
                            title="Rename todo"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTodoList(e, list.id)}
                            className="nav-subitem-delete"
                            title="Delete todo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {midNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.mode ? mode === item.mode : false;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`nav-item ${active ? 'active' : ''}`}
              title={!isExpanded ? item.title || item.label : ''}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              {isExpanded && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}

        {modeActions
          .filter((a) => a.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className="nav-item"
                title={!isExpanded ? item.title || item.label : ''}
              >
                <div className="nav-icon-wrapper">
                  <Icon size={20} />
                </div>
                {isExpanded && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-expand-btn">+</span>
                  </>
                )}
              </button>
            );
          })}

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="nav-item"
              title={!isExpanded ? item.title || item.label : ''}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              {isExpanded && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
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
                    downloadJson(`sticky-notes-${Date.now()}.json`, exportNotes());
                    setShowSettings(false);
                  }}
                  className="settings-btn"
                >
                  <Download size={16} />
                  <span>Export Sticky Notes</span>
                </button>
                <button
                  onClick={() => {
                    pickJsonFile((text) => {
                      try {
                        importNotes(text);
                        setShowSettings(false);
                      } catch (e) {
                        alert('Invalid sticky notes JSON file.');
                        console.error(e);
                      }
                    });
                  }}
                  className="settings-btn"
                >
                  <Upload size={16} />
                  <span>Import Sticky Notes</span>
                </button>

                <button
                  onClick={() => {
                    downloadJson(`pages-${Date.now()}.json`, exportPages());
                    setShowSettings(false);
                  }}
                  className="settings-btn"
                >
                  <Download size={16} />
                  <span>Export Pages</span>
                </button>
                <button
                  onClick={() => {
                    pickJsonFile((text) => {
                      try {
                        importPages(text);
                        setShowSettings(false);
                      } catch (e) {
                        alert('Invalid pages JSON file.');
                        console.error(e);
                      }
                    });
                  }}
                  className="settings-btn"
                >
                  <Upload size={16} />
                  <span>Import Pages</span>
                </button>

                <button
                  onClick={() => {
                    downloadJson(`area-${Date.now()}.json`, exportArea());
                    setShowSettings(false);
                  }}
                  className="settings-btn"
                >
                  <Download size={16} />
                  <span>Export Area</span>
                </button>
                <button
                  onClick={() => {
                    pickJsonFile((text) => {
                      try {
                        importArea(text);
                        setShowSettings(false);
                      } catch (e) {
                        alert('Invalid area JSON file.');
                        console.error(e);
                      }
                    });
                  }}
                  className="settings-btn"
                >
                  <Upload size={16} />
                  <span>Import Area</span>
                </button>

                <button
                  onClick={() => {
                    downloadJson(`todo-${Date.now()}.json`, exportTodo());
                    setShowSettings(false);
                  }}
                  className="settings-btn"
                >
                  <Download size={16} />
                  <span>Export Todo</span>
                </button>
                <button
                  onClick={() => {
                    pickJsonFile((text) => {
                      try {
                        importTodo(text);
                        setShowSettings(false);
                      } catch (e) {
                        alert('Invalid todo JSON file.');
                        console.error(e);
                      }
                    });
                  }}
                  className="settings-btn"
                >
                  <Upload size={16} />
                  <span>Import Todo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
