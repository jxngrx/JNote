export function normalizeBookmarkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getBookmarkHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getBookmarkFaviconUrl(url: string): string {
  const host = getBookmarkHostname(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

export function getDefaultBookmarkTitle(url: string): string {
  const host = getBookmarkHostname(url);
  const base = host.split('.')[0] ?? host;
  if (!base) return 'Bookmark';
  return base.charAt(0).toUpperCase() + base.slice(1);
}
