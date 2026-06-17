import type { LinkPreviewData } from '@/lib/link-preview-utils';

type NoembedResponse = {
  title?: string;
  author_name?: string;
  provider_name?: string;
  thumbnail_url?: string;
  error?: string;
};

const EMBED_HOSTS = [
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'twitch.tv',
  'clips.twitch.tv',
  'twitter.com',
  'x.com',
  'mobile.twitter.com',
  'vimeo.com',
];

export function isEmbedProviderUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  return EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function extractYouTubeId(url: URL) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
  if (host.includes('youtube.com')) {
    if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] ?? null;
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] ?? null;
  }
  return null;
}

async function fetchYouTubePreview(url: string): Promise<LinkPreviewData | null> {
  const parsed = new URL(url);
  const videoId = extractYouTubeId(parsed);
  if (!videoId) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    return {
      url,
      title: data.title ?? 'YouTube video',
      description: data.author_name ? `by ${data.author_name}` : 'YouTube',
      image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
    };
  } catch {
    return {
      url,
      title: 'YouTube video',
      description: url,
      image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
    };
  }
}

async function fetchTwitterPreview(url: string): Promise<LinkPreviewData | null> {
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      author_name?: string;
      url?: string;
      html?: string;
      provider_name?: string;
    };
    const text = data.html?.replace(/<[^>]+>/g, '').trim() ?? '';
    return {
      url,
      title: data.author_name ? `@${data.author_name.replace(/^@/, '')}` : 'Post on X',
      description: text.slice(0, 180) || 'View post on X',
      image: '',
      siteName: 'X',
    };
  } catch {
    return null;
  }
}

async function fetchNoembedPreview(url: string): Promise<LinkPreviewData | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as NoembedResponse;
    if (data.error) return null;
    const parsed = new URL(url);
    return {
      url,
      title: data.title ?? parsed.hostname.replace(/^www\./, ''),
      description: data.author_name ?? data.provider_name ?? '',
      image: data.thumbnail_url ?? '',
      siteName: data.provider_name ?? parsed.hostname.replace(/^www\./, ''),
    };
  } catch {
    return null;
  }
}

export async function fetchEmbedProviderPreview(url: string): Promise<LinkPreviewData | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!isEmbedProviderUrl(parsed)) return null;

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host.includes('youtube.com') || host === 'youtu.be') {
    const yt = await fetchYouTubePreview(url);
    if (yt) return yt;
  }

  if (host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com') {
    const tw = await fetchTwitterPreview(url);
    if (tw) return tw;
  }

  const noembed = await fetchNoembedPreview(url);
  if (noembed) return noembed;

  return null;
}
