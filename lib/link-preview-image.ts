export function sanitizePreviewImageUrl(raw: string, baseUrl?: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return '';

  try {
    const resolved = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
    if (resolved.protocol !== 'https:') return '';
    return resolved.toString();
  } catch {
    return '';
  }
}
