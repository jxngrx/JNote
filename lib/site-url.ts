/**
 * Canonical public site URL for metadata (Open Graph, metadataBase).
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_SITE_URL — explicit override (custom domain, local dev)
 * 2. VERCEL_PROJECT_PRODUCTION_URL — Vercel production domain
 * 3. VERCEL_URL — Vercel preview / deployment hostname
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`;
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}/`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}/`;
  }

  throw new Error(
    'NEXT_PUBLIC_SITE_URL is required when not deploying on Vercel. Copy .env.example to .env.local and set your public site URL.'
  );
}
