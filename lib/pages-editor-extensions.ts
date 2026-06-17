import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import UniqueId from '@tiptap/extension-unique-id';
import { Dropcursor } from '@tiptap/extensions';
import { Gapcursor } from '@tiptap/extensions';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/components/pages/extensions/callout';
import { LinkPreview } from '@/components/pages/extensions/link-preview';
import { MarkdownInputRules } from '@/components/pages/extensions/markdown-input-rules';
import { ListMarkerSync } from '@/components/pages/extensions/list-marker-sync';
import {
  SlashCommand,
  type SlashCommandOptions,
} from '@/components/pages/extensions/slash-command';

const lowlight = createLowlight(common);

function baseExtensions(slashOptions?: SlashCommandOptions['suggestion']) {
  const extensions = [
    StarterKit.configure({
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
      horizontalRule: {},
    }),
    Placeholder.configure({
      placeholder: "Type '/' for commands…",
      emptyEditorClass: 'is-editor-empty',
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { class: 'page-editor-link' },
    }),
    TextStyle,
    FontFamily.configure({ types: ['textStyle'] }),
    FontSize.configure({ types: ['textStyle'] }),
    Color,
    Highlight.configure({ multicolor: true }),
    Typography,
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'javascript',
      HTMLAttributes: { class: 'page-code-block' },
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
    Image.configure({ inline: false, allowBase64: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    UniqueId.configure({
      types: [
        'paragraph',
        'heading',
        'blockquote',
        'callout',
        'linkPreview',
        'codeBlock',
        'bulletList',
        'orderedList',
        'taskList',
      ],
    }),
    Dropcursor.configure({ color: 'var(--blue)', width: 2 }),
    Gapcursor,
    Callout,
    LinkPreview,
    MarkdownInputRules,
    ListMarkerSync,
  ];

  if (slashOptions) {
    extensions.push(
      SlashCommand.configure({
        suggestion: slashOptions,
      })
    );
  }

  return extensions;
}

export function getMigrationExtensions() {
  return baseExtensions();
}

export function getPageEditorExtensions(
  slashOptions?: SlashCommandOptions['suggestion']
) {
  return baseExtensions(slashOptions);
}

export { lowlight };
