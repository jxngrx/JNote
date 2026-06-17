import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/api-rate-limit';
import { fetchEmbedProviderPreview } from '@/lib/link-preview-providers';
import { sanitizePreviewImageUrl } from '@/lib/link-preview-image';
import {
  extractLinkPreviewFromHtml,
  normalizeLinkPreviewUrl,
} from '@/lib/link-preview-utils';
import { SAFE_FETCH_TIMEOUT_MS, safeFetch } from '@/lib/safe-fetch';

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function sanitizePreview<T extends { image?: string; url: string }>(preview: T): T {
  return {
    ...preview,
    image: sanitizePreviewImageUrl(preview.image ?? '', preview.url),
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`link-preview:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSec);
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  const url = normalizeLinkPreviewUrl(rawUrl);
  if (!url) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const embedPreview = await fetchEmbedProviderPreview(url);
    if (embedPreview) {
      return NextResponse.json(sanitizePreview(embedPreview));
    }

    const response = await safeFetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; JNoteLinkPreview/1.0; +https://github.com/jxngrx/notes_apps)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeoutMs: SAFE_FETCH_TIMEOUT_MS,
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      const siteName = new URL(url).hostname.replace(/^www\./, '');
      return NextResponse.json({
        url,
        title: siteName,
        description: url,
        image: '',
        siteName,
      });
    }

    const html = await response.text();
    const preview = sanitizePreview(extractLinkPreviewFromHtml(html.slice(0, 160_000), url));
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fetch failed';
    const blocked =
      message.includes('Blocked') ||
      message.includes('Unsupported URL') ||
      message.includes('Too many redirects');

    if (blocked) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
    }

    const fallback = await fetchEmbedProviderPreview(url);
    if (fallback) return NextResponse.json(sanitizePreview(fallback));

    const siteName = new URL(url).hostname.replace(/^www\./, '');
    return NextResponse.json({
      url,
      title: siteName,
      description: url,
      image: '',
      siteName,
    });
  }
}
