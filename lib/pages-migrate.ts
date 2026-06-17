import type { PageContentJson } from '@/lib/types';

export type { PageContentJson };

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

export function needsContentMigration(page: {
  content?: string;
  contentJson?: PageContentJson | null;
}): boolean {
  if (page.contentJson && page.contentJson.type === 'doc') return false;
  return Boolean(page.content?.trim());
}
