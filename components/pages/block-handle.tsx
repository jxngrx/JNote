'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { GripVertical, Plus } from 'lucide-react';
import { openSlashMenuAt } from '@/components/pages/extensions/slash-command';

type BlockHandleProps = {
  editor: Editor;
};

type BlockTarget = {
  pos: number;
  top: number;
  height: number;
};

function findBlockAtCoords(editor: Editor, x: number, y: number): BlockTarget | null {
  const pos = editor.view.posAtCoords({ left: x, top: y })?.pos;
  if (pos == null) return null;

  const $pos = editor.state.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.isBlock && node.type.name !== 'doc') {
      const start = $pos.before(depth);
      const dom = editor.view.nodeDOM(start) as HTMLElement | null;
      if (!dom || !(dom instanceof HTMLElement)) return null;
      const root = editor.view.dom.closest('.page-editor-root') as HTMLElement | null;
      const rootRect = root?.getBoundingClientRect() ?? editor.view.dom.getBoundingClientRect();
      const rect = dom.getBoundingClientRect();
      return {
        pos: start,
        top: rect.top - rootRect.top + (root?.scrollTop ?? 0),
        height: rect.height,
      };
    }
  }
  return null;
}

export function BlockHandle({ editor }: BlockHandleProps) {
  const [target, setTarget] = useState<BlockTarget | null>(null);
  const [visible, setVisible] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const hoveringHandleRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      if (!hoveringHandleRef.current) {
        setVisible(false);
        setTarget(null);
      }
    }, 120);
  }, [clearHideTimer]);

  const updateTarget = useCallback(
    (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (handleRef.current?.contains(targetNode)) {
        clearHideTimer();
        return;
      }

      const root = editor.view.dom.closest('.page-editor-root');
      const editorEl = editor.view.dom;
      if (!root?.contains(targetNode) && !editorEl.contains(targetNode)) {
        if (!hoveringHandleRef.current) scheduleHide();
        return;
      }

      if (!editorEl.contains(targetNode)) {
        return;
      }

      clearHideTimer();
      const block = findBlockAtCoords(editor, e.clientX, e.clientY);
      if (!block) {
        scheduleHide();
        return;
      }
      setTarget(block);
      setVisible(true);
    },
    [editor, clearHideTimer, scheduleHide]
  );

  useEffect(() => {
    const root = editor.view.dom.closest('.page-editor-root');
    if (!root) return;

    root.addEventListener('mousemove', updateTarget as EventListener);
    root.addEventListener('mouseleave', scheduleHide);

    return () => {
      root.removeEventListener('mousemove', updateTarget as EventListener);
      root.removeEventListener('mouseleave', scheduleHide);
      clearHideTimer();
    };
  }, [editor, updateTarget, scheduleHide, clearHideTimer]);

  if (!visible || !target) return null;

  return (
    <div
      ref={handleRef}
      className="page-block-handle"
      style={{ top: target.top + 2 }}
      contentEditable={false}
      onMouseEnter={() => {
        hoveringHandleRef.current = true;
        clearHideTimer();
      }}
      onMouseLeave={() => {
        hoveringHandleRef.current = false;
        scheduleHide();
      }}
    >
      <button
        type="button"
        className="page-block-handle-btn"
        aria-label="Drag block"
        onMouseDown={(e) => {
          e.preventDefault();
          const node = editor.state.doc.nodeAt(target.pos);
          if (!node) return;
          editor.chain().focus().setNodeSelection(target.pos).run();
        }}
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        className="page-block-handle-btn"
        aria-label="Insert block below"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const end = target.pos + (editor.state.doc.nodeAt(target.pos)?.nodeSize ?? 0);
          openSlashMenuAt(editor, end);
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
