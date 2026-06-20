'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArchiveRestore,
  Clock3,
  Columns3,
  Database,
  Dock,
  Eye,
  Image,
  Keyboard,
  LayoutGrid,
  Layers,
  Palette,
  Search,
  Timer,
  X,
} from 'lucide-react';
import AppearancePanel from '@/components/settings/appearance-panel';
import BackgroundPanel from '@/components/settings/background-panel';
import PomodoroSettingsPanel from '@/components/settings/pomodoro-settings-panel';
import ClockWidgetsPanel from '@/components/settings/clock-widgets-panel';
import DataPanel from '@/components/settings/data-panel';
import NavigationSettingsPanel from '@/components/settings/navigation-settings-panel';
import EyeWidgetsPanel from '@/components/settings/eye-widgets-panel';
import ShortcutsPanel from '@/components/settings/shortcuts-panel';
import BookmarksSettingsPanel from '@/components/settings/bookmarks-settings-panel';
import GithubSettingsPanel from '@/components/settings/github-settings-panel';
import { GithubIcon } from '@/components/github-icon';
import '@/components/github-settings.css';
import TodoGridSettingsPanel from '@/components/settings/todo-grid-settings-panel';
import TodoKanbanSettingsPanel from '@/components/settings/todo-kanban-settings-panel';
import TodoRecycleBinPanel from '@/components/settings/todo-recycle-bin-panel';
import './app-settings.css';

export type SettingsSection =
  | 'appearance'
  | 'background'
  | 'dock'
  | 'widgets-clock'
  | 'widgets-eye'
  | 'world-pomodoro'
  | 'todo-grid'
  | 'todo-kanban'
  | 'recycle-bin'
  | 'data'
  | 'shortcuts'
  | 'bookmarks'
  | 'github';

export type SettingsSectionInput =
  | SettingsSection
  | 'widgets'
  | 'todo'
  | 'pomodoro'
  | 'world';

type SectionMeta = {
  title: string;
  description: string;
};

const SECTION_META: Record<SettingsSection, SectionMeta> = {
  appearance: {
    title: 'Appearance',
    description: 'Theme palette, typography, and custom colors.',
  },
  background: {
    title: 'Background',
    description: 'Wallpaper, gradient, or photo for all modes.',
  },
  dock: {
    title: 'Navigation',
    description: 'Dock vs sidebar, layout, and behavior.',
  },
  'widgets-clock': {
    title: 'Clock widgets',
    description: 'Pinned world clocks — size, color, typography.',
  },
  'widgets-eye': {
    title: 'Eye widgets',
    description: 'Tracking eyes at the top of the screen.',
  },
  'world-pomodoro': {
    title: 'Pomodoro',
    description: 'Focus timer fonts, style, and defaults.',
  },
  'todo-grid': {
    title: 'Grid view',
    description: 'Cards, typography, and sounds.',
  },
  'todo-kanban': {
    title: 'Kanban view',
    description: 'Columns, typography, and sounds.',
  },
  'recycle-bin': {
    title: 'Recycle bin',
    description: 'Restore or delete tasks permanently.',
  },
  data: {
    title: 'Data',
    description: 'Export and import notes, pages, and todos.',
  },
  shortcuts: {
    title: 'Shortcuts',
    description: 'Keyboard navigation between modes.',
  },
  bookmarks: {
    title: 'Bookmarks',
    description: 'Fan or grid layout for saved sites.',
  },
  github: {
    title: 'GitHub',
    description: 'Profile tab in dock with contribution chart.',
  },
};

type NavItem = {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  tone: string;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        id: 'appearance',
        label: 'Appearance',
        icon: <Palette size={15} strokeWidth={2} />,
        tone: 'violet',
      },
      {
        id: 'background',
        label: 'Background',
        icon: <Image size={15} strokeWidth={2} />,
        tone: 'blue',
      },
      {
        id: 'dock',
        label: 'Navigation',
        icon: <Dock size={15} strokeWidth={2} />,
        tone: 'green',
      },
    ],
  },
  {
    id: 'world',
    label: 'World',
    items: [
      {
        id: 'world-pomodoro',
        label: 'Pomodoro',
        icon: <Timer size={15} strokeWidth={2} />,
        tone: 'amber',
      },
    ],
  },
  {
    id: 'widgets',
    label: 'Widgets',
    items: [
      {
        id: 'widgets-clock',
        label: 'Clock',
        icon: <Clock3 size={15} strokeWidth={2} />,
        tone: 'cyan',
      },
      {
        id: 'widgets-eye',
        label: 'Eye',
        icon: <Eye size={15} strokeWidth={2} />,
        tone: 'rose',
      },
    ],
  },
  {
    id: 'todo',
    label: 'Todo',
    items: [
      {
        id: 'todo-grid',
        label: 'Grid',
        icon: <LayoutGrid size={15} strokeWidth={2} />,
        tone: 'orange',
      },
      {
        id: 'todo-kanban',
        label: 'Kanban',
        icon: <Columns3 size={15} strokeWidth={2} />,
        tone: 'orange',
      },
      {
        id: 'recycle-bin',
        label: 'Recycle bin',
        icon: <ArchiveRestore size={15} strokeWidth={2} />,
        tone: 'slate',
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    items: [
      {
        id: 'data',
        label: 'Data',
        icon: <Database size={15} strokeWidth={2} />,
        tone: 'indigo',
      },
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        icon: <Layers size={15} strokeWidth={2} />,
        tone: 'blue',
      },
      {
        id: 'github',
        label: 'GitHub',
        icon: <GithubIcon size={15} />,
        tone: 'green',
      },
      {
        id: 'shortcuts',
        label: 'Shortcuts',
        icon: <Keyboard size={15} strokeWidth={2} />,
        tone: 'slate',
      },
    ],
  },
];

function normalizeSection(section: SettingsSectionInput): SettingsSection {
  if (section === 'widgets') return 'widgets-clock';
  if (section === 'todo') return 'todo-grid';
  if (section === 'pomodoro' || section === 'world') return 'world-pomodoro';
  return section;
}

type AppSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  initialSection?: SettingsSectionInput;
};

export default function AppSettingsModal({
  open,
  onClose,
  initialSection = 'appearance',
}: AppSettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>(() =>
    normalizeSection(initialSection)
  );
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setSection(normalizeSection(initialSection));
      setQuery('');
    }
  }, [open, initialSection]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_SECTIONS;

    return NAV_SECTIONS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const meta = SECTION_META[item.id];
        return (
          item.label.toLowerCase().includes(q) ||
          meta.title.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q)
        );
      }),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  if (!open || !mounted) return null;

  const active = SECTION_META[section];
  const activeNavItem = NAV_SECTIONS.flatMap((g) => g.items).find(
    (item) => item.id === section
  );

  return createPortal(
    <div className="app-settings-overlay" onClick={onClose}>
      <div
        className="app-settings-shell"
        data-section-tone={activeNavItem?.tone ?? 'slate'}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-settings-title"
      >
        <aside className="app-settings-sidebar">
          <div className="app-settings-sidebar-head">
            <h1 className="app-settings-sidebar-title">Settings</h1>
            <button
              type="button"
              className="app-settings-close app-settings-close--sidebar"
              onClick={onClose}
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>

          <label className="app-settings-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings"
              aria-label="Search settings"
            />
          </label>

          <nav className="app-settings-nav" aria-label="Settings sections">
            {filteredSections.length === 0 ? (
              <p className="app-settings-nav-empty">No settings match your search.</p>
            ) : (
              filteredSections.map((group) => (
                <div key={group.id} className="app-settings-nav-section">
                  <p className="app-settings-nav-section-label">{group.label}</p>
                  <div className="app-settings-nav-list">
                    {group.items.map((item) => {
                      const meta = SECTION_META[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`app-settings-nav-item${
                            section === item.id ? ' is-active' : ''
                          }`}
                          onClick={() => setSection(item.id)}
                        >
                          <span
                            className={`app-settings-nav-icon app-settings-nav-icon--${item.tone}`}
                            aria-hidden
                          >
                            {item.icon}
                          </span>
                          <span className="app-settings-nav-copy">
                            <span className="app-settings-nav-label">{item.label}</span>
                            <span className="app-settings-nav-desc">{meta.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        </aside>

        <div className="app-settings-main">
          <header className="app-settings-main-header">
            <div className="app-settings-main-header-inner">
              {activeNavItem && (
                <span
                  className={`app-settings-main-icon app-settings-nav-icon app-settings-nav-icon--${activeNavItem.tone}`}
                  aria-hidden
                >
                  {activeNavItem.icon}
                </span>
              )}
              <div className="app-settings-main-header-copy">
                <p className="app-settings-main-eyebrow">Settings</p>
                <h2 id="app-settings-title">{active.title}</h2>
                <p>{active.description}</p>
              </div>
            </div>
          </header>

          <div className="app-settings-content">
            {section === 'appearance' && <AppearancePanel />}
            {section === 'background' && <BackgroundPanel />}
            {section === 'dock' && <NavigationSettingsPanel />}
            {section === 'world-pomodoro' && <PomodoroSettingsPanel />}
            {section === 'widgets-clock' && <ClockWidgetsPanel />}
            {section === 'widgets-eye' && <EyeWidgetsPanel />}
            {section === 'todo-grid' && <TodoGridSettingsPanel />}
            {section === 'todo-kanban' && <TodoKanbanSettingsPanel />}
            {section === 'recycle-bin' && <TodoRecycleBinPanel />}
            {section === 'data' && <DataPanel onClose={onClose} />}
            {section === 'shortcuts' && <ShortcutsPanel />}
            {section === 'bookmarks' && <BookmarksSettingsPanel />}
            {section === 'github' && <GithubSettingsPanel />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
