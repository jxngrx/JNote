'use client';

import { useMemo, useState } from 'react';
import {
  StickyNote,
  FileText,
  PenTool,
  Plus,
  Settings,
  Keyboard,
  CheckSquare,
  Globe,
  Globe2,
  Columns3,
  LayoutGrid,
  Timer,
} from 'lucide-react';
import type { MagneticDockEntry } from '@/components/ui/magnetic-dock';
import { useAppStore } from '@/lib/app-store';
import { usePagesStore } from '@/lib/pages-store';
import { useAreaStore } from '@/lib/area-store';
import { useTodoStore } from '@/lib/todo-store';
import { useTodoUiStore } from '@/lib/todo-ui-store';
import { useSettingsUiStore } from '@/lib/settings-ui-store';
import { useBookmarksUiStore } from '@/lib/bookmarks-ui-store';
import { useBookmarksStore } from '@/lib/bookmarks-store';
import { useWorldTimeUiStore } from '@/lib/world-time-ui-store';
import BookmarksDockIcon from '@/components/bookmarks-dock-icon';
import GithubDockAvatar from '@/components/github-dock-avatar';
import { getTodoListInitials } from '@/lib/todo-list-initials';
import { useGithubSettingsStore } from '@/lib/github-settings-store';
import { useGithubUiStore } from '@/lib/github-ui-store';
import type { AppMode } from '@/lib/types';

export type TodoListMenuState = {
  listId: string;
  listTitle: string;
  x: number;
  y: number;
} | null;

export function useAppNavigationItems() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const pages = usePagesStore((state) => state.pages);
  const activePageId = usePagesStore((state) => state.activePageId);
  const createPage = usePagesStore((state) => state.createPage);
  const setActivePage = usePagesStore((state) => state.setActivePage);
  const scenes = useAreaStore((state) => state.scenes);
  const activeSceneId = useAreaStore((state) => state.activeSceneId);
  const createScene = useAreaStore((state) => state.createScene);
  const setActiveScene = useAreaStore((state) => state.setActiveScene);
  const todoLists = useTodoStore((state) => state.lists);
  const activeTodoListId = useTodoStore((state) => state.activeListId);
  const createTodoList = useTodoStore((state) => state.createList);
  const setActiveTodoList = useTodoStore((state) => state.setActiveList);
  const reorderTodoLists = useTodoStore((state) => state.reorderLists);
  const todoViewMode = useTodoUiStore((s) => s.viewMode);
  const setTodoViewMode = useTodoUiStore((s) => s.setViewMode);
  const worldTimeView = useWorldTimeUiStore((s) => s.view);
  const setWorldTimeView = useWorldTimeUiStore((s) => s.setView);
  const openSettings = useSettingsUiStore((s) => s.openSettings);
  const bookmarksOpen = useBookmarksUiStore((s) => s.open);
  const toggleBookmarks = useBookmarksUiStore((s) => s.toggleBookmarks);
  const bookmarkCount = useBookmarksStore((s) => s.bookmarks.length);
  const githubUsername = useGithubSettingsStore((s) => s.username);
  const githubAvatarUrl = useGithubSettingsStore((s) => s.avatarUrl);
  const githubOpen = useGithubUiStore((s) => s.open);
  const toggleGithub = useGithubUiStore((s) => s.toggleGithub);
  const openGithub = useGithubUiStore((s) => s.openGithub);
  const setGithubPinned = useGithubUiStore((s) => s.setPinned);

  const [todoListMenu, setTodoListMenu] = useState<TodoListMenuState>(null);

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
  };

  const items = useMemo((): MagneticDockEntry[] => {
    const navItems: MagneticDockEntry[] = [
      {
        id: 'world-time',
        icon: <Globe size={18} />,
        label: 'World Time',
        isActive: mode === 'world-time',
        onClick: () => handleModeSwitch('world-time'),
      },
      {
        id: 'todo',
        icon: <CheckSquare size={18} />,
        label: 'Todo',
        isActive: mode === 'todo',
        onClick: () => handleModeSwitch('todo'),
      },
      {
        id: 'pages',
        icon: <FileText size={18} />,
        label: 'Pages',
        isActive: mode === 'pages',
        onClick: () => handleModeSwitch('pages'),
      },
      {
        id: 'area',
        icon: <PenTool size={18} />,
        label: 'Area',
        isActive: mode === 'area',
        onClick: () => handleModeSwitch('area'),
      },
      {
        id: 'sticky-notes',
        icon: <StickyNote size={18} />,
        label: 'Sticky Notes',
        isActive: mode === 'sticky-notes',
        onClick: () => handleModeSwitch('sticky-notes'),
      },
    ];

    if (mode === 'pages') {
      navItems.push({ type: 'separator', id: 'pages-sep' });
      navItems.push({
        id: 'new-page',
        icon: <Plus size={18} />,
        label: 'New Page',
        onClick: () => {
          const newId = createPage();
          setActivePage(newId);
        },
      });
      pages.forEach((page) => {
        navItems.push({
          id: `page-${page.id}`,
          icon: <FileText size={16} />,
          label: page.title,
          isActive: activePageId === page.id,
          isSub: true,
          onClick: () => setActivePage(page.id),
        });
      });
    }

    if (mode === 'area') {
      navItems.push({ type: 'separator', id: 'area-sep' });
      navItems.push({
        id: 'new-scene',
        icon: <Plus size={18} />,
        label: 'New Scene',
        onClick: () => {
          const newId = createScene();
          setActiveScene(newId);
        },
      });
      scenes.forEach((scene) => {
        navItems.push({
          id: `scene-${scene.id}`,
          icon: <PenTool size={16} />,
          label: scene.title,
          isActive: activeSceneId === scene.id,
          isSub: true,
          onClick: () => setActiveScene(scene.id),
        });
      });
    }

    if (mode === 'todo') {
      navItems.push({ type: 'separator', id: 'todo-sep' });
      navItems.push({
        id: 'todo-kanban-view',
        icon: <Columns3 size={18} />,
        label: 'Kanban',
        isActive: todoViewMode === 'kanban',
        onClick: () => setTodoViewMode('kanban'),
      });
      navItems.push({
        id: 'todo-grid-view',
        icon: <LayoutGrid size={18} />,
        label: 'Grid',
        isActive: todoViewMode === 'grid',
        onClick: () => setTodoViewMode('grid'),
      });
      navItems.push({ type: 'separator', id: 'todo-lists-sep' });
      navItems.push({
        id: 'new-todo',
        icon: <Plus size={18} />,
        label: 'New List',
        onClick: () => {
          const newId = createTodoList();
          setActiveTodoList(newId);
        },
      });
      todoLists.forEach((list) => {
        navItems.push({
          id: `todo-${list.id}`,
          icon: (
            <span className="mag-dock-item-initials" aria-hidden>
              {getTodoListInitials(list.title)}
            </span>
          ),
          label: list.title,
          isActive: activeTodoListId === list.id,
          isSub: true,
          reorderable: true,
          reorderId: list.id,
          onClick: () => setActiveTodoList(list.id),
          onContextMenu: (event) => {
            setTodoListMenu({
              listId: list.id,
              listTitle: list.title,
              x: event.clientX,
              y: event.clientY,
            });
          },
        });
      });
    }

    if (mode === 'world-time') {
      navItems.push({ type: 'separator', id: 'world-time-sep' });
      navItems.push({
        id: 'world-clocks-view',
        icon: <Globe2 size={18} />,
        label: 'World Clock',
        isActive: worldTimeView === 'clocks',
        isSub: true,
        onClick: () => setWorldTimeView('clocks'),
      });
      navItems.push({
        id: 'world-pomodoro-view',
        icon: <Timer size={18} />,
        label: 'Pomodoro',
        isActive: worldTimeView === 'pomodoro',
        isSub: true,
        onClick: () => setWorldTimeView('pomodoro'),
      });
    }

    navItems.push({ type: 'separator', id: 'utility-sep' });
    navItems.push({
      id: 'bookmarks',
      icon: <BookmarksDockIcon />,
      label: 'Bookmarks',
      isActive: bookmarksOpen,
      badge: bookmarkCount > 0 ? bookmarkCount : undefined,
      onClick: toggleBookmarks,
    });
    navItems.push({
      id: 'shortcuts',
      icon: <Keyboard size={18} />,
      label: 'Shortcuts',
      onClick: () => openSettings('shortcuts'),
    });
    navItems.push({
      id: 'settings',
      icon: <Settings size={18} />,
      label: 'Settings',
      onClick: () => openSettings('appearance'),
    });

    if (githubUsername) {
      navItems.push({
        id: 'github',
        icon: (
          <GithubDockAvatar username={githubUsername} avatarUrl={githubAvatarUrl} />
        ),
        label: 'GitHub',
        isActive: githubOpen,
        onClick: () => toggleGithub(),
        onMouseEnter: () => {
          setGithubPinned(true);
          openGithub();
        },
      });
    }

    return navItems;
  }, [
    mode,
    pages,
    activePageId,
    scenes,
    activeSceneId,
    todoLists,
    activeTodoListId,
    createPage,
    setActivePage,
    createScene,
    setActiveScene,
    createTodoList,
    setActiveTodoList,
    todoViewMode,
    setTodoViewMode,
    worldTimeView,
    setWorldTimeView,
    openSettings,
    bookmarksOpen,
    toggleBookmarks,
    bookmarkCount,
    githubUsername,
    githubAvatarUrl,
    githubOpen,
    toggleGithub,
    openGithub,
    setGithubPinned,
  ]);

  const onReorder =
    mode === 'todo'
      ? (orderedIds: string[]) => reorderTodoLists(orderedIds)
      : undefined;

  return {
    mode,
    items,
    onReorder,
    todoListMenu,
    setTodoListMenu,
  };
}
