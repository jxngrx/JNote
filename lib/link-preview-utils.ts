import { sanitizePreviewImageUrl } from '@/lib/link-preview-image';

export type LinkPreviewData = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function pickMeta(html: string, key: string, attr: 'property' | 'name' = 'property') {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`,
    'i'
  );
  const match = html.match(pattern);
  return decodeHtml((match?.[1] ?? match?.[2] ?? '').trim());
}

function pickTitle(html: string) {
  const og = pickMeta(html, 'og:title');
  if (og) return og;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return decodeHtml(match?.[1]?.trim() ?? '');
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function resolveUrl(base: string, maybeRelative: string) {
  if (!maybeRelative) return '';
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

export function extractLinkPreviewFromHtml(html: string, url: string): LinkPreviewData {
  const title = pickMeta(html, 'og:title') || pickTitle(html);
  const description =
    pickMeta(html, 'og:description') || pickMeta(html, 'description', 'name');
  const rawImage = pickMeta(html, 'og:image') || pickMeta(html, 'twitter:image');
  const resolvedImage = resolveUrl(url, rawImage);
  const image = sanitizePreviewImageUrl(resolvedImage, url);
  const siteName = pickMeta(html, 'og:site_name') || new URL(url).hostname.replace(/^www\./, '');

  return {
    url,
    title: title || siteName,
    description,
    image,
    siteName,
  };
}

export function normalizeLinkPreviewUrl(raw: string) {
  return normalizeUrl(raw);
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Preview fetch failed');
  return res.json() as Promise<LinkPreviewData>;
}

function findLinkPreviewPos(editor: import('@tiptap/core').Editor, href: string) {
  let found: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'linkPreview' && node.attrs.href === href) {
      found = pos;
    }
  });
  return found;
}

export async function promptAndInsertLinkPreview(editor: import('@tiptap/core').Editor) {
  const raw = window.prompt('Paste link URL', 'https://');
  if (raw == null || !raw.trim()) return;

  const url = normalizeLinkPreviewUrl(raw);
  if (!url) return;

  const insertPos = editor.state.selection.from;
  const siteName = new URL(url).hostname.replace(/^www\./, '');

  editor
    .chain()
    .focus()
    .insertContentAt(insertPos, {
      type: 'linkPreview',
      attrs: {
        href: url,
        title: siteName,
        description: '',
        image: '',
        siteName,
        loading: true,
      },
    })
    .run();

  // NodeView fetches preview; also update from here as backup
  try {
    const data = await fetchLinkPreview(url);
    const nodePos = findLinkPreviewPos(editor, url);
    if (nodePos == null) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(nodePos, undefined, {
          href: data.url,
          title: data.title,
          description: data.description,
          image: data.image,
          siteName: data.siteName,
          loading: false,
        });
        return true;
      })
      .run();
  } catch {
    const nodePos = findLinkPreviewPos(editor, url);
    if (nodePos == null) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(nodePos, undefined, {
          href: url,
          title: siteName,
          description: 'Preview unavailable',
          image: '',
          siteName,
          loading: false,
        });
        return true;
      })
      .run();
  }
}
