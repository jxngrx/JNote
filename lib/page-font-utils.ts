'use client';

import type { Editor } from '@tiptap/core';
import { ensurePageFontLoaded, getPageFontCss, type PageFontId } from '@/lib/page-fonts';
import { setFontFamilyKeepStyle } from '@/lib/page-text-style-utils';

export function applyPageFontToEditor(
  editor: Editor,
  fontId: PageFontId | string,
  onPageDefaultChange: (fontId: PageFontId) => void
) {
  ensurePageFontLoaded(fontId);
  const css = getPageFontCss(fontId);
  const { from, to, empty } = editor.state.selection;

  if (!empty && to > from) {
    setFontFamilyKeepStyle(editor, css);
    return;
  }

  onPageDefaultChange(fontId as PageFontId);
}
