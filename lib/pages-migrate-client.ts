'use client';

import { generateJSON, generateHTML } from '@tiptap/html';
import type { PageContentJson } from '@/lib/types';
import { getMigrationExtensions } from '@/lib/pages-editor-extensions';

const EMPTY_DOC: PageContentJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function migrateHtmlToJson(html: string): PageContentJson {
  const trimmed = html?.trim();
  if (!trimmed) return EMPTY_DOC;

  try {
    return generateJSON(trimmed, getMigrationExtensions()) as PageContentJson;
  } catch {
    return EMPTY_DOC;
  }
}

export function jsonToHtml(json: PageContentJson): string {
  try {
    return generateHTML(json, getMigrationExtensions());
  } catch {
    return '';
  }
}

export function normalizePageContent(page: {
  content?: string;
  contentJson?: PageContentJson | null;
}): PageContentJson {
  if (page.contentJson && page.contentJson.type === 'doc') {
    return page.contentJson;
  }
  if (page.content?.trim()) {
    return migrateHtmlToJson(page.content);
  }
  return EMPTY_DOC;
}

export function extractPlainTextFromJson(json: PageContentJson | null | undefined): string {
  if (!json) return '';
  const parts: string[] = [];

  function walk(node: PageContentJson) {
    if (node.type === 'text' && typeof node.text === 'string') {
      parts.push(node.text);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(json);
  return parts.join('');
}

export { EMPTY_DOC };
