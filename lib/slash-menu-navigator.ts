import type { Editor } from '@tiptap/core';
import {
  commandHasSubmenu,
  filterCommands,
  resolveCommandChildren,
  type PageEditorCommand,
} from '@/lib/pages-editor-commands';
import { getSelectionSlashCommands } from '@/lib/pages-editor-commands';

export type SlashMenuNavigatorState = {
  active: boolean;
  query: string;
  items: PageEditorCommand[];
  selectedIndex: number;
  submenuPath: PageEditorCommand[];
};

export function getSelectionClientRect(editor: Editor): () => DOMRect | null {
  return () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const top = Math.min(start.top, end.top);
    const bottom = Math.max(start.bottom, end.bottom);
    const left = Math.min(start.left, end.left);
    const right = Math.max(start.right, end.right);
    return new DOMRect(left, top, Math.max(right - left, 24), Math.max(bottom - top, 20));
  };
}

export function createSlashMenuNavigator(
  getRootItems: () => PageEditorCommand[],
  onCommand: (item: PageEditorCommand) => void
) {
  let selectedIndex = 0;
  let submenuPath: PageEditorCommand[] = [];
  let currentItems: PageEditorCommand[] = [];
  let query = '';

  const rootItems = () => filterCommands(query, getRootItems());

  const currentSource = () => {
    if (!submenuPath.length) return rootItems();
    const parent = submenuPath[submenuPath.length - 1];
    return filterCommands(query, resolveCommandChildren(parent));
  };

  const snapshot = (): SlashMenuNavigatorState => ({
    active: true,
    query,
    items: currentItems,
    selectedIndex,
    submenuPath: [...submenuPath],
  });

  let emit: (state: SlashMenuNavigatorState | null) => void = () => {};
  let active = false;

  const refresh = () => emit(snapshot());

  const exitSubmenu = () => {
    if (!submenuPath.length) return false;
    submenuPath = submenuPath.slice(0, -1);
    currentItems = currentSource();
    selectedIndex = 0;
    refresh();
    return true;
  };

  const selectItem = (item: PageEditorCommand) => {
    if (commandHasSubmenu(item)) {
      submenuPath = [...submenuPath, item];
      currentItems = resolveCommandChildren(item);
      selectedIndex = 0;
      refresh();
      return;
    }
    onCommand(item);
    active = false;
    emit(null);
  };

  return {
    bind(onChange: (state: SlashMenuNavigatorState | null) => void) {
      emit = onChange;
    },
    isActive() {
      return active;
    },
    open(initialQuery = '') {
      query = initialQuery;
      submenuPath = [];
      selectedIndex = 0;
      currentItems = rootItems();
      active = true;
      refresh();
    },
    close() {
      submenuPath = [];
      active = false;
      emit(null);
    },
    setQuery(next: string) {
      if (next !== query && submenuPath.length) submenuPath = [];
      query = next;
      currentItems = currentSource();
      selectedIndex = 0;
      refresh();
    },
    handleKeyDown(event: KeyboardEvent) {
      if (!currentItems.length) return false;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (exitSubmenu()) return true;
        active = false;
        this.close();
        return true;
      }

      if (event.key === 'ArrowLeft' && submenuPath.length) {
        event.preventDefault();
        exitSubmenu();
        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
        refresh();
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        refresh();
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const item = currentItems[selectedIndex];
        if (item) selectItem(item);
        return true;
      }

      return false;
    },
    selectItem,
    setSelectedIndex(index: number) {
      if (!currentItems.length) return;
      selectedIndex = Math.max(0, Math.min(index, currentItems.length - 1));
      refresh();
    },
    goBack: exitSubmenu,
  };
}

export function createSelectionSlashNavigator(onCommand: (item: PageEditorCommand) => void) {
  return createSlashMenuNavigator(getSelectionSlashCommands, onCommand);
}
