import type { Editor } from '@tiptap/core';
import { setFontSizeKeepStyle } from '@/lib/page-text-style-utils';

export const PAGE_FONT_SIZE_MIN = 11;
export const PAGE_FONT_SIZE_MAX = 48;
export const PAGE_FONT_SIZE_DEFAULT = 15;
export const PAGE_FONT_SIZE_STEP = 1;

export const PAGE_FONT_SIZE_PRESETS: { id: string; label: string; description: string; px: number }[] = [
  { id: 'size-small', label: 'Small', description: '13px body text', px: 13 },
  { id: 'size-normal', label: 'Normal', description: '15px default', px: 15 },
  { id: 'size-large', label: 'Large', description: '18px emphasis', px: 18 },
  { id: 'size-huge', label: 'Huge', description: '24px display', px: 24 },
  { id: 'size-xl', label: 'Extra large', description: '32px headline', px: 32 },
];

export function clampPageFontSize(px: number) {
  return Math.min(PAGE_FONT_SIZE_MAX, Math.max(PAGE_FONT_SIZE_MIN, Math.round(px)));
}

export function parseFontSizePx(value?: string | null, fallback = PAGE_FONT_SIZE_DEFAULT) {
  if (!value) return fallback;
  const match = value.match(/^([\d.]+)px$/);
  if (!match) return fallback;
  return clampPageFontSize(Number(match[1]));
}

export function getSelectionFontSizePx(editor: Editor, pageDefault = PAGE_FONT_SIZE_DEFAULT) {
  const attr = editor.getAttributes('textStyle').fontSize as string | undefined;
  return parseFontSizePx(attr, pageDefault);
}

export function applyPageFontSizeToEditor(
  editor: Editor,
  nextPx: number,
  pageDefaultPx: number,
  onPageDefaultChange: (px: number) => void
) {
  const size = clampPageFontSize(nextPx);
  const css = `${size}px`;
  const { from, to, empty } = editor.state.selection;

  if (!empty && to > from) {
    setFontSizeKeepStyle(editor, css);
    return;
  }

  onPageDefaultChange(size);
}

export function bumpPageFontSize(
  editor: Editor,
  delta: number,
  pageDefaultPx: number,
  onPageDefaultChange: (px: number) => void
) {
  const { from, to, empty } = editor.state.selection;
  if (!empty && to > from) {
    const current = getSelectionFontSizePx(editor, pageDefaultPx);
    applyPageFontSizeToEditor(editor, current + delta, pageDefaultPx, onPageDefaultChange);
    return;
  }
  applyPageFontSizeToEditor(editor, pageDefaultPx + delta, pageDefaultPx, onPageDefaultChange);
}
