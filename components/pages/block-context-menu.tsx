'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';
import type { Editor } from '@tiptap/core';
import { PAGE_EDITOR_COMMANDS } from '@/lib/pages-editor-commands';
import { Copy, Trash2, ArrowUp, ArrowDown, CopyPlus } from 'lucide-react';

type BlockContextMenuProps = {
  editor: Editor;
  children: React.ReactNode;
};

function getBlockRange(editor: Editor): { from: number; to: number } | null {
  const { selection } = editor.state;
  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.isBlock && node.type.name !== 'doc') {
      const from = $from.before(depth);
      const to = from + node.nodeSize;
      return { from, to };
    }
  }
  return null;
}

export function BlockContextMenu({ editor, children }: BlockContextMenuProps) {
  const duplicateBlock = () => {
    const range = getBlockRange(editor);
    if (!range) return;
    const slice = editor.state.doc.slice(range.from, range.to);
    editor.chain().focus().insertContentAt(range.to, slice.content.toJSON()).run();
  };

  const deleteBlock = () => {
    const range = getBlockRange(editor);
    if (!range) return;
    editor.chain().focus().deleteRange(range).run();
  };

  const moveBlock = (direction: 'up' | 'down') => {
    const range = getBlockRange(editor);
    if (!range) return;
    const { doc } = editor.state;
    const node = doc.slice(range.from, range.to);
    if (direction === 'up') {
      const $from = editor.state.doc.resolve(range.from);
      const depth = $from.depth;
      const index = $from.index(depth - 1);
      if (index === 0) return;
      const parentStart = $from.before(depth - 1);
      const prevNode = $from.node(depth - 1).child(index - 1);
      const insertPos = parentStart;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContentAt(insertPos, node.content.toJSON())
        .run();
    } else {
      const $from = editor.state.doc.resolve(range.from);
      const depth = $from.depth;
      const index = $from.index(depth - 1);
      const parent = $from.node(depth - 1);
      if (index >= parent.childCount - 1) return;
      const nextNode = parent.child(index + 1);
      const insertPos = range.to + nextNode.nodeSize;
      editor
        .chain()
        .focus()
        .deleteRange({ from: range.from, to: range.to + nextNode.nodeSize })
        .insertContentAt(range.from, nextNode.toJSON())
        .insertContentAt(insertPos - nextNode.nodeSize, node.content.toJSON())
        .run();
    }
  };

  const copyBlockLink = () => {
    const range = getBlockRange(editor);
    if (!range) return;
    const node = editor.state.doc.nodeAt(range.from);
    const id = node?.attrs?.id as string | undefined;
    const hash = id ? `#block-${id}` : '';
    const url = `${window.location.href.split('#')[0]}${hash}`;
    void navigator.clipboard.writeText(url);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="page-block-context-menu">
          <ContextMenu.Item className="page-block-context-item" onSelect={duplicateBlock}>
            <CopyPlus size={14} />
            Duplicate
          </ContextMenu.Item>
          <ContextMenu.Item className="page-block-context-item" onSelect={deleteBlock}>
            <Trash2 size={14} />
            Delete
          </ContextMenu.Item>
          <ContextMenu.Item className="page-block-context-item" onSelect={() => moveBlock('up')}>
            <ArrowUp size={14} />
            Move up
          </ContextMenu.Item>
          <ContextMenu.Item className="page-block-context-item" onSelect={() => moveBlock('down')}>
            <ArrowDown size={14} />
            Move down
          </ContextMenu.Item>
          <ContextMenu.Item className="page-block-context-item" onSelect={copyBlockLink}>
            <Copy size={14} />
            Copy link to block
          </ContextMenu.Item>
          <ContextMenu.Separator className="page-block-context-sep" />
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="page-block-context-item">
              Turn into
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className="page-block-context-menu">
                {PAGE_EDITOR_COMMANDS.filter((cmd) =>
                  ['text', 'h1', 'h2', 'h3', 'quote', 'callout', 'bullet', 'numbered', 'todo', 'code'].includes(cmd.id)
                ).map((cmd) => (
                  <ContextMenu.Item
                    key={cmd.id}
                    className="page-block-context-item"
                    onSelect={() => cmd.run?.(editor)}
                  >
                    {cmd.label}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
