'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';

type LineEntry = {
  num: number;
  top: number;
};

function topWithinRoot(el: HTMLElement, root: HTMLElement) {
  return el.getBoundingClientRect().top - root.getBoundingClientRect().top;
}

function getVisualLineTops(block: HTMLElement, root: HTMLElement): number[] {
  const range = document.createRange();
  range.selectNodeContents(block);

  const rects = Array.from(range.getClientRects()).filter((rect) => rect.height > 1);
  const tops: number[] = [];
  let lastTop = -1;

  for (const rect of rects) {
    const top = Math.round(rect.top);
    if (tops.length === 0 || Math.abs(top - lastTop) > 2) {
      tops.push(top - root.getBoundingClientRect().top);
      lastTop = top;
    }
  }

  if (tops.length === 0) {
    tops.push(topWithinRoot(block, root));
  }

  return tops;
}

function collectBlockElements(editor: Editor): HTMLElement[] {
  const blocks: HTMLElement[] = [];

  const pushDom = (node: Node | null) => {
    if (node instanceof HTMLElement) blocks.push(node);
  };

  editor.state.doc.forEach((node, offset) => {
    if (['bulletList', 'orderedList', 'taskList'].includes(node.type.name)) {
      node.forEach((_child, childOffset) => {
        pushDom(editor.view.nodeDOM(offset + 1 + childOffset));
      });
      return;
    }

    if (!node.isBlock) return;
    pushDom(editor.view.nodeDOM(offset));
  });

  if (blocks.length === 0) {
    const prosemirror = editor.view.dom as HTMLElement;
    Array.from(prosemirror.children).forEach((child) => {
      if (child instanceof HTMLElement) blocks.push(child);
    });
  }

  return blocks;
}

function collectLineEntries(editor: Editor): LineEntry[] {
  const root = editor.view.dom.closest('.page-editor-root') as HTMLElement | null;
  if (!root) return [];

  const blocks = collectBlockElements(editor);
  const lines: LineEntry[] = [];
  let num = 0;

  for (const block of blocks) {
    const lineTops = getVisualLineTops(block, root);
    for (const top of lineTops) {
      num += 1;
      lines.push({ num, top });
    }
  }

  return lines;
}

type LineNumbersGutterProps = {
  editor: Editor;
  enabled: boolean;
};

export function LineNumbersGutter({ editor, enabled }: LineNumbersGutterProps) {
  const [lines, setLines] = useState<LineEntry[]>([]);

  const measure = useCallback(() => {
    if (!enabled) {
      setLines([]);
      return;
    }
    requestAnimationFrame(() => {
      setLines(collectLineEntries(editor));
    });
  }, [editor, enabled]);

  useEffect(() => {
    if (!enabled) return;
    measure();
    editor.on('update', measure);
    editor.on('selectionUpdate', measure);
    editor.on('transaction', measure);

    const scrollEl = editor.view.dom.closest('.page-editor-scroll');
    scrollEl?.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    const observer = new ResizeObserver(measure);
    observer.observe(editor.view.dom);

    return () => {
      editor.off('update', measure);
      editor.off('selectionUpdate', measure);
      editor.off('transaction', measure);
      scrollEl?.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [editor, enabled, measure]);

  if (!enabled || lines.length === 0) return null;

  return (
    <div className="page-line-numbers-gutter" aria-hidden>
      {lines.map((line) => (
        <span
          key={`${line.num}-${line.top}`}
          className="page-line-number"
          style={{ top: line.top }}
        >
          {line.num}
        </span>
      ))}
    </div>
  );
}
