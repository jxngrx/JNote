import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Sparkles,
  Strikethrough,
  Table2,
  Text,
  Type,
  Underline,
} from 'lucide-react';
import { promptAndInsertLinkPreview } from '@/lib/link-preview-utils';
import { PAGE_FONTS, PAGE_FONT_GROUPS, getPageFontCss, ensurePageFontLoaded } from '@/lib/page-fonts';
import { PAGE_FONT_SIZE_PRESETS } from '@/lib/page-font-size';
import { loadPinnedBubbleColors } from '@/lib/page-bubble-colors-store';
import {
  setFontFamilyKeepStyle,
  setFontSizeKeepStyle,
  unsetFontFamilyKeepStyle,
  unsetFontSizeKeepStyle,
} from '@/lib/page-text-style-utils';

export type PageEditorCommand = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  swatch?: string;
  fontPreview?: string;
  shortcut?: string;
  children?: PageEditorCommand[];
  getChildren?: () => PageEditorCommand[];
  run?: (editor: Editor) => void;
};

const BASE_TEXT_COLORS = ['#F0EDE8', '#E8432D', '#1E8A4A', '#2C6EDB', '#C47B1A', '#1A1A1A'];
const BASE_HIGHLIGHT_COLORS = ['#FFF3B0', '#D4F8D4', '#D6E8FF', '#FFD6D6', '#E8D6FF', '#FFFFFF'];

function getTextColorChildren(): PageEditorCommand[] {
  const pinned =
    typeof window !== 'undefined' ? loadPinnedBubbleColors().text : [];
  const colors = [...new Set([...pinned, ...BASE_TEXT_COLORS])];
  return [
    {
      id: 'color-reset',
      label: 'Default',
      description: 'Reset to theme text color',
      icon: Eraser,
      keywords: ['reset', 'clear', 'default'],
      run: (editor) => editor.chain().focus().unsetColor().run(),
    },
    ...colors.map((color) => ({
      id: `text-color-${color}`,
      label: color.toUpperCase(),
      description: 'Apply text color',
      icon: Palette,
      swatch: color,
      keywords: [color, 'text'],
      run: (editor: Editor) => editor.chain().focus().setColor(color).run(),
    })),
  ];
}

function getHighlightChildren(): PageEditorCommand[] {
  const pinned =
    typeof window !== 'undefined' ? loadPinnedBubbleColors().highlight : [];
  const colors = [...new Set([...pinned, ...BASE_HIGHLIGHT_COLORS])];
  return [
    {
      id: 'highlight-reset',
      label: 'Remove highlight',
      description: 'Clear highlight mark',
      icon: Eraser,
      keywords: ['reset', 'clear', 'none'],
      run: (editor) => editor.chain().focus().unsetHighlight().run(),
    },
    ...colors.map((color) => ({
      id: `highlight-${color}`,
      label: color.toUpperCase(),
      description: 'Apply highlight',
      icon: Highlighter,
      swatch: color,
      keywords: [color, 'highlight', 'mark'],
      run: (editor: Editor) => editor.chain().focus().toggleHighlight({ color }).run(),
    })),
  ];
}

function getFontChildren(): PageEditorCommand[] {
  return PAGE_FONTS.map((font) => ({
    id: `font-${font.id}`,
    label: font.label,
    description: `${PAGE_FONT_GROUPS.find((g) => g.id === font.group)?.label ?? 'Font'} · ${font.label}`,
    icon: Type,
    fontPreview: font.css,
    keywords: [font.label, font.id, font.group, 'font', 'typeface'],
    run: (editor: Editor) => {
      ensurePageFontLoaded(font.id);
      setFontFamilyKeepStyle(editor, getPageFontCss(font.id));
    },
  }));
}

function getFontSizeChildren(): PageEditorCommand[] {
  return [
    {
      id: 'size-reset',
      label: 'Default size',
      description: 'Reset to page default',
      icon: Eraser,
      keywords: ['reset', 'normal', 'default'],
      run: (editor) => unsetFontSizeKeepStyle(editor),
    },
    ...PAGE_FONT_SIZE_PRESETS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      description: preset.description,
      icon: Type,
      keywords: [preset.label, `${preset.px}`, 'size', 'font'],
      run: (editor: Editor) => setFontSizeKeepStyle(editor, `${preset.px}px`),
    })),
  ];
}

function getListTriggerChildren(): PageEditorCommand[] {
  return [
    {
      id: 'bullet-trigger',
      label: 'Bullet list',
      description: 'Type - * + . then space',
      icon: List,
      keywords: ['bullet', 'ul', 'unordered', '-', '*', '+', '.'],
      shortcut: '-',
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'numbered-trigger',
      label: 'Numbered list',
      description: 'Type 1. or 1) then space',
      icon: ListOrdered,
      keywords: ['numbered', 'ol', 'ordered', '1.'],
      shortcut: '1.',
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'todo-trigger',
      label: 'To-do list',
      description: 'Type [] or [ ] then space',
      icon: CheckSquare,
      keywords: ['todo', 'task', 'checkbox', '[]'],
      shortcut: '[]',
      run: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'quote-trigger',
      label: 'Quote block',
      description: 'Type > then space',
      icon: Quote,
      keywords: ['quote', 'blockquote', 'cite', '>'],
      shortcut: '>',
      run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
  ];
}

function blockCommands(): PageEditorCommand[] {
  return [
    {
      id: 'lists',
      label: 'Lists',
      description: 'Bullets, numbers, todos, quotes',
      icon: List,
      keywords: ['list', 'bullet', 'number', 'todo', 'quote', 'trigger'],
      getChildren: getListTriggerChildren,
    },
    {
      id: 'text',
      label: 'Text',
      description: 'Plain paragraph',
      icon: Text,
      keywords: ['paragraph', 'plain', 'p'],
      run: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      id: 'h1',
      label: 'Heading 1',
      description: 'Large section heading',
      icon: Heading1,
      keywords: ['heading', 'title', 'h1'],
      run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      keywords: ['heading', 'subtitle', 'h2'],
      run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3,
      keywords: ['heading', 'h3'],
      run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Block quote — type > then space',
      icon: Quote,
      keywords: ['blockquote', 'cite', '>'],
      run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'callout',
      label: 'Callout',
      description: 'Highlighted callout box',
      icon: Sparkles,
      keywords: ['note', 'alert', 'tip'],
      run: (editor) =>
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'callout',
            attrs: { emoji: '💡' },
            content: [{ type: 'paragraph' }],
          })
          .run(),
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Horizontal rule',
      icon: Minus,
      keywords: ['hr', 'line', 'rule', '---'],
      run: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      id: 'bullet',
      label: 'Bullet list',
      description: 'Unordered — type - * + . then space',
      icon: List,
      keywords: ['ul', 'unordered', '-', '*'],
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'numbered',
      label: 'Numbered list',
      description: 'Ordered — type 1. or 1) then space',
      icon: ListOrdered,
      keywords: ['ol', 'ordered', '1.', '1)'],
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'todo',
      label: 'To-do list',
      description: 'Checkbox — type [] then space',
      icon: CheckSquare,
      keywords: ['task', 'checkbox', 'check', '[]'],
      run: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'code',
      label: 'Code block',
      description: 'Syntax-highlighted block',
      icon: Code2,
      keywords: ['codeblock', 'snippet', '```'],
      run: (editor) => editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run(),
    },
    {
      id: 'link',
      label: 'Link preview',
      description: 'Embed URL with rich preview card',
      icon: Link2,
      keywords: ['url', 'bookmark', 'embed', 'website', 'preview'],
      run: (editor) => {
        void promptAndInsertLinkPreview(editor);
      },
    },
    {
      id: 'inline-link',
      label: 'Inline link',
      description: 'Hyperlink selected text',
      icon: Link2,
      keywords: ['hyperlink', 'href', 'anchor'],
      run: (editor) => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', prev ?? 'https://');
        if (url === null) return;
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
      },
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Upload image',
      icon: ImageIcon,
      keywords: ['photo', 'picture', 'img', 'upload'],
      run: (editor) => {
        const insertPos = editor.state.selection.from;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = () => {
          const file = input.files?.[0];
          input.remove();

          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            window.alert('Image must be 5 MB or smaller.');
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const src = reader.result as string;
            if (!src.startsWith('data:')) return;

            editor
              .chain()
              .focus()
              .insertContentAt(insertPos, {
                type: 'image',
                attrs: { src, alt: file.name },
              })
              .run();
          };
          reader.onerror = () => {
            window.alert('Could not read image file.');
          };
          reader.readAsDataURL(file);
        };

        input.click();
      },
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Insert 3×3 table',
      icon: Table2,
      keywords: ['grid', 'rows', 'columns'],
      run: (editor) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
  ];
}

function styleCommands(): PageEditorCommand[] {
  return [
    {
      id: 'text-color',
      label: 'Text color',
      description: 'Pick a text color',
      icon: Palette,
      keywords: ['color', 'text', 'foreground', 'font color', 'a'],
      getChildren: getTextColorChildren,
    },
    {
      id: 'highlight',
      label: 'Highlight',
      description: 'Pick a highlight color',
      icon: Highlighter,
      keywords: ['highlight', 'mark', 'background', 'marker'],
      getChildren: getHighlightChildren,
    },
    {
      id: 'font',
      label: 'Font',
      description: 'Change typeface',
      icon: Type,
      keywords: ['font', 'typeface', 'family', 'typography'],
      getChildren: getFontChildren,
    },
    {
      id: 'size',
      label: 'Font size',
      description: 'Small to extra large',
      icon: Type,
      keywords: ['size', 'bigger', 'smaller', 'scale'],
      getChildren: getFontSizeChildren,
    },
    {
      id: 'bold',
      label: 'Bold',
      description: 'Strong emphasis',
      icon: Bold,
      keywords: ['strong', 'weight', 'b'],
      shortcut: '⌘B',
      run: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      id: 'italic',
      label: 'Italic',
      description: 'Italic emphasis',
      icon: Italic,
      keywords: ['emphasis', 'i'],
      shortcut: '⌘I',
      run: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      id: 'underline',
      label: 'Underline',
      description: 'Underline text',
      icon: Underline,
      keywords: ['u', 'line'],
      shortcut: '⌘U',
      run: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
    {
      id: 'strike',
      label: 'Strikethrough',
      description: 'Cross out text',
      icon: Strikethrough,
      keywords: ['strike', 'cross', 's'],
      shortcut: '⌘⇧S',
      run: (editor) => editor.chain().focus().toggleStrike().run(),
    },
    {
      id: 'inline-code',
      label: 'Inline code',
      description: 'Monospace inline snippet',
      icon: Code2,
      keywords: ['code', 'mono', 'snippet'],
      shortcut: '⌘E',
      run: (editor) => editor.chain().focus().toggleCode().run(),
    },
    {
      id: 'align-left',
      label: 'Align left',
      description: 'Left align block',
      icon: AlignLeft,
      keywords: ['align', 'left', 'start'],
      run: (editor) => editor.chain().focus().setTextAlign('left').run(),
    },
    {
      id: 'align-center',
      label: 'Align center',
      description: 'Center align block',
      icon: AlignCenter,
      keywords: ['align', 'center', 'middle'],
      run: (editor) => editor.chain().focus().setTextAlign('center').run(),
    },
    {
      id: 'align-right',
      label: 'Align right',
      description: 'Right align block',
      icon: AlignRight,
      keywords: ['align', 'right', 'end'],
      run: (editor) => editor.chain().focus().setTextAlign('right').run(),
    },
    {
      id: 'clear-format',
      label: 'Clear formatting',
      description: 'Remove marks and styles',
      icon: Eraser,
      keywords: ['clear', 'reset', 'plain', 'remove'],
      run: (editor) =>
        editor
          .chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .unsetColor()
          .unsetHighlight()
          .unsetFontSize()
          .unsetFontFamily()
          .run(),
    },
  ];
}

export const PAGE_EDITOR_COMMANDS: PageEditorCommand[] = [...styleCommands(), ...blockCommands()];

const SELECTION_EXCLUDED_IDS = new Set(['align-left', 'align-center', 'align-right']);

function clearSelectionFormatting(editor: Editor) {
  editor
    .chain()
    .focus()
    .unsetBold()
    .unsetItalic()
    .unsetUnderline()
    .unsetStrike()
    .unsetCode()
    .unsetColor()
    .unsetHighlight()
    .run();
  unsetFontSizeKeepStyle(editor);
  unsetFontFamilyKeepStyle(editor);
}

/** Inline / selection-only commands — no block inserts or paragraph align. */
export function getSelectionSlashCommands(): PageEditorCommand[] {
  return styleCommands()
    .filter((cmd) => !SELECTION_EXCLUDED_IDS.has(cmd.id))
    .map((cmd) =>
      cmd.id === 'clear-format'
        ? { ...cmd, run: clearSelectionFormatting }
        : cmd
    );
}

export function resolveCommandChildren(command: PageEditorCommand): PageEditorCommand[] {
  if (command.children?.length) return command.children;
  if (command.getChildren) return command.getChildren();
  return [];
}

export function commandHasSubmenu(command: PageEditorCommand) {
  return resolveCommandChildren(command).length > 0;
}

function matchesCommand(command: PageEditorCommand, q: string) {
  return (
    command.label.toLowerCase().includes(q) ||
    command.description.toLowerCase().includes(q) ||
    command.keywords.some((k) => k.includes(q))
  );
}

export function filterCommands(query: string, source = PAGE_EDITOR_COMMANDS): PageEditorCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return source;
  return source.filter((cmd) => matchesCommand(cmd, q));
}

export function getCommandById(id: string) {
  const walk = (items: PageEditorCommand[]): PageEditorCommand | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      const child = walk(resolveCommandChildren(item));
      if (child) return child;
    }
    return undefined;
  };
  return walk(PAGE_EDITOR_COMMANDS);
}
