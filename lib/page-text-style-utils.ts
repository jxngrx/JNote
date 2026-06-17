import type { Editor } from '@tiptap/core';

export type TextStyleAttrs = {
  fontFamily?: string | null;
  fontSize?: string | null;
  color?: string | null;
};

export function getTextStyleAttrs(editor: Editor): TextStyleAttrs {
  return editor.getAttributes('textStyle') as TextStyleAttrs;
}

/** Merge into existing textStyle mark so fontFamily / fontSize / color don't clobber each other. */
export function applyTextStyleAttrs(
  editor: Editor,
  attrs: Partial<TextStyleAttrs>,
  { extend = true }: { extend?: boolean } = {}
) {
  const current = getTextStyleAttrs(editor);
  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries({ ...current, ...attrs })) {
    if (value == null || value === '') continue;
    next[key] = value;
  }

  let chain = editor.chain().focus();
  if (extend) chain = chain.extendMarkRange('textStyle');

  if (Object.keys(next).length === 0) {
    chain.removeEmptyTextStyle().run();
    return;
  }

  chain.setMark('textStyle', next).run();
}

export function setFontFamilyKeepStyle(editor: Editor, fontFamily: string) {
  applyTextStyleAttrs(editor, { fontFamily });
}

export function setFontSizeKeepStyle(editor: Editor, fontSize: string) {
  applyTextStyleAttrs(editor, { fontSize });
}

export function unsetFontSizeKeepStyle(editor: Editor) {
  const current = getTextStyleAttrs(editor);
  const { fontSize: _drop, ...rest } = current;
  applyTextStyleAttrs(editor, rest as TextStyleAttrs, { extend: true });
}

export function unsetFontFamilyKeepStyle(editor: Editor) {
  const current = getTextStyleAttrs(editor);
  const { fontFamily: _drop, ...rest } = current;
  applyTextStyleAttrs(editor, rest as TextStyleAttrs, { extend: true });
}
