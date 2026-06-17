'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link2,
  MessageSquare,
  Plus,
  Strikethrough,
  Underline,
} from 'lucide-react';
import {
  loadPinnedBubbleColors,
  pinBubbleColor,
  unpinBubbleColor,
  type PinnedBubbleColors,
} from '@/lib/page-bubble-colors-store';
import { BubbleColorPickerPopup } from '@/components/pages/bubble-color-picker-popup';

type PageBubbleMenuProps = {
  editor: Editor;
};

const BASE_TEXT_COLORS = ['#F0EDE8', '#E8432D', '#1E8A4A', '#2C6EDB', '#C47B1A'];
const BASE_HIGHLIGHT_COLORS = ['#FFF3B0', '#D4F8D4', '#D6E8FF', '#FFD6D6', '#E8D6FF'];

function mergeColors(base: string[], pinned: string[]) {
  return [...new Set([...pinned, ...base])].slice(0, 8);
}

type ColorPickerState = {
  type: 'text' | 'highlight';
  anchor: HTMLElement;
  initialColor: string;
} | null;

export function PageBubbleMenu({ editor }: PageBubbleMenuProps) {
  const [pinned, setPinned] = useState<PinnedBubbleColors>({ text: [], highlight: [] });
  const [picker, setPicker] = useState<ColorPickerState>(null);
  const textAddRef = useRef<HTMLButtonElement>(null);
  const highlightAddRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPinned(loadPinnedBubbleColors());
  }, []);

  const textColors = mergeColors(BASE_TEXT_COLORS, pinned.text);
  const highlightColors = mergeColors(BASE_HIGHLIGHT_COLORS, pinned.highlight);

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const applyColor = useCallback(
    (type: 'text' | 'highlight', color: string) => {
      if (type === 'text') {
        editor.chain().focus().setColor(color).run();
      } else {
        editor.chain().focus().toggleHighlight({ color }).run();
      }
    },
    [editor]
  );

  const openPicker = (type: 'text' | 'highlight') => {
    const anchor = type === 'text' ? textAddRef.current : highlightAddRef.current;
    if (!anchor) return;
    const current =
      type === 'text'
        ? ((editor.getAttributes('textStyle').color as string | undefined) ?? '#F0EDE8')
        : '#FFF3B0';
    setPicker({ type, anchor, initialColor: current });
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="page-bubble-menu"
        options={{ placement: 'top' }}
      >
        <button
          type="button"
          className={`page-bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className={`page-bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className={`page-bubble-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          className={`page-bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          className={`page-bubble-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code size={15} />
        </button>

        <span className="page-bubble-divider" />

        <div className="page-bubble-color-group">
          <span className="page-bubble-color-label">A</span>
          <div className="page-bubble-colors">
            {textColors.map((color) => (
              <button
                key={`text-${color}`}
                type="button"
                className={`page-bubble-swatch ${pinned.text.includes(color) ? 'is-pinned' : ''}`}
                style={{ background: color }}
                onClick={() => applyColor('text', color)}
                title={`Text color ${color}`}
              />
            ))}
            <button
              ref={textAddRef}
              type="button"
              className="page-bubble-swatch page-bubble-swatch-add"
              onClick={() => openPicker('text')}
              title="Custom text color"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>

        <span className="page-bubble-divider page-bubble-divider--color" />

        <div className="page-bubble-color-group">
          <span className="page-bubble-color-label">
            <Highlighter size={12} />
          </span>
          <div className="page-bubble-colors">
            {highlightColors.map((color) => (
              <button
                key={`hl-${color}`}
                type="button"
                className={`page-bubble-swatch page-bubble-swatch-highlight ${pinned.highlight.includes(color) ? 'is-pinned' : ''}`}
                style={{ background: color }}
                onClick={() => applyColor('highlight', color)}
                title={`Highlight ${color}`}
              />
            ))}
            <button
              ref={highlightAddRef}
              type="button"
              className="page-bubble-swatch page-bubble-swatch-add"
              onClick={() => openPicker('highlight')}
              title="Custom highlight color"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>

        <span className="page-bubble-divider" />

        <button type="button" className="page-bubble-btn" onClick={setLink} title="Link">
          <Link2 size={15} />
        </button>
        <button
          type="button"
          className="page-bubble-btn is-disabled"
          title="Comments coming soon"
          disabled
        >
          <MessageSquare size={15} />
        </button>
      </BubbleMenu>

      <BubbleColorPickerPopup
        open={picker != null}
        type={picker?.type ?? 'text'}
        initialColor={picker?.initialColor ?? '#FFFFFF'}
        anchorEl={picker?.anchor ?? null}
        pinnedColors={picker ? pinned[picker.type] : []}
        onClose={() => setPicker(null)}
        onUse={(color) => {
          if (!picker) return;
          applyColor(picker.type, color);
        }}
        onSaveAndUse={(color) => {
          if (!picker) return;
          applyColor(picker.type, color);
          const next = pinBubbleColor(picker.type, color);
          setPinned(next);
        }}
        onUnpin={(color) => {
          if (!picker) return;
          const next = unpinBubbleColor(picker.type, color);
          setPinned(next);
        }}
      />
    </>
  );
}
