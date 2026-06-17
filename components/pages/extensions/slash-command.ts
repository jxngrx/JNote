import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import type { Editor } from '@tiptap/core';
import {
  commandHasSubmenu,
  filterCommands,
  resolveCommandChildren,
  PAGE_EDITOR_COMMANDS,
} from '@/lib/pages-editor-commands';
import type { PageEditorCommand } from '@/lib/pages-editor-commands';

export type SlashCommandOptions = {
  suggestion: Omit<SuggestionOptions<PageEditorCommand>, 'editor'>;
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowedPrefixes: [' ', '\u00a0'],
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.run?.(editor);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

let setSlashSelectedIndex: ((index: number) => void) | null = null;

export function setSlashMenuSelectedIndex(index: number) {
  setSlashSelectedIndex?.(index);
}

export type SlashMenuState = {
  active: boolean;
  query: string;
  range: { from: number; to: number } | null;
  items: PageEditorCommand[];
  selectedIndex: number;
  clientRect: (() => DOMRect | null) | null;
  command: (item: PageEditorCommand) => void;
  submenuPath: PageEditorCommand[];
  onBack?: () => void;
};

export function createSlashSuggestionRender(
  onStateChange: (state: SlashMenuState) => void
): SlashCommandOptions['suggestion'] {
  return {
    char: '/',
    startOfLine: false,
    allowedPrefixes: [' ', '\u00a0'],
    items: ({ query }) => filterCommands(query),
    command: ({ editor, range, props }) => {
      editor.chain().focus().deleteRange(range).run();
      props.run?.(editor);
    },
    render: () => {
      let selectedIndex = 0;
      let currentItems: PageEditorCommand[] = [];
      let lastQuery = '';
      let submenuPath: PageEditorCommand[] = [];
      let latestProps: {
        query: string;
        range: { from: number; to: number };
        clientRect: (() => DOMRect | null) | null | undefined;
        command: (item: PageEditorCommand) => void;
      } | null = null;

      const rootItems = (query: string) => filterCommands(query, PAGE_EDITOR_COMMANDS);

      const currentSource = (query: string) => {
        if (!submenuPath.length) return rootItems(query);
        const parent = submenuPath[submenuPath.length - 1];
        return filterCommands(query, resolveCommandChildren(parent));
      };

      const emit = () => {
        if (!latestProps) return;
        onStateChange({
          active: true,
          query: latestProps.query,
          range: latestProps.range,
          items: currentItems,
          selectedIndex,
          clientRect: latestProps.clientRect ?? null,
          command: latestProps.command,
          submenuPath: [...submenuPath],
          onBack: () => {
            exitSubmenu();
          },
        });
      };

      const exitSubmenu = () => {
        if (!submenuPath.length) return false;
        submenuPath = submenuPath.slice(0, -1);
        currentItems = currentSource(latestProps?.query ?? '');
        selectedIndex = 0;
        emit();
        return true;
      };

      setSlashSelectedIndex = (index: number) => {
        if (!currentItems.length) return;
        selectedIndex = Math.max(0, Math.min(index, currentItems.length - 1));
        emit();
      };

      return {
        onStart: (props) => {
          selectedIndex = 0;
          lastQuery = props.query;
          submenuPath = [];
          currentItems = rootItems(props.query);
          latestProps = {
            query: props.query,
            range: props.range,
            clientRect: props.clientRect,
          command: (item: PageEditorCommand) => {
            if (commandHasSubmenu(item)) {
              submenuPath = [...submenuPath, item];
              currentItems = resolveCommandChildren(item);
              selectedIndex = 0;
              emit();
              return;
            }
            props.command(item);
          },
          };
          emit();
        },
        onUpdate: (props) => {
          if (props.query !== lastQuery && submenuPath.length) {
            submenuPath = [];
          }
          currentItems = currentSource(props.query);
          if (props.query !== lastQuery) {
            selectedIndex = 0;
            lastQuery = props.query;
          } else {
            selectedIndex = Math.min(selectedIndex, Math.max(currentItems.length - 1, 0));
          }
          latestProps = {
            query: props.query,
            range: props.range,
            clientRect: props.clientRect,
          command: (item: PageEditorCommand) => {
            if (commandHasSubmenu(item)) {
              submenuPath = [...submenuPath, item];
              currentItems = resolveCommandChildren(item);
              selectedIndex = 0;
              emit();
              return;
            }
            props.command(item);
          },
          };
          emit();
        },
        onKeyDown: (props) => {
          if (!currentItems.length) return false;

          if (props.event.key === 'Escape') {
            props.event.preventDefault();
            if (exitSubmenu()) return true;
            return false;
          }

          if (props.event.key === 'ArrowLeft' && submenuPath.length) {
            props.event.preventDefault();
            exitSubmenu();
            return true;
          }

          if (props.event.key === 'ArrowUp') {
            props.event.preventDefault();
            selectedIndex =
              (selectedIndex + currentItems.length - 1) % currentItems.length;
            emit();
            return true;
          }

          if (props.event.key === 'ArrowDown') {
            props.event.preventDefault();
            selectedIndex = (selectedIndex + 1) % currentItems.length;
            emit();
            return true;
          }

          if (props.event.key === 'Enter') {
            props.event.preventDefault();
            const item = currentItems[selectedIndex];
            if (!item || !latestProps) return true;

            if (commandHasSubmenu(item)) {
              submenuPath = [...submenuPath, item];
              currentItems = resolveCommandChildren(item);
              selectedIndex = 0;
              emit();
              return true;
            }

            latestProps.command(item);
            return true;
          }

          return false;
        },
        onExit: () => {
          setSlashSelectedIndex = null;
          submenuPath = [];
          onStateChange({
            active: false,
            query: '',
            range: null,
            items: [],
            selectedIndex: 0,
            clientRect: null,
            command: () => {},
            submenuPath: [],
            onBack: undefined,
          });
        },
      };
    },
  };
}

export function openSlashMenuAt(editor: Editor, pos?: number) {
  const { from } = editor.state.selection;
  const insertPos = pos ?? from;
  editor.chain().focus().insertContentAt(insertPos, '/').run();
}
