import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const SAFE_FETCH_MAX_REDIRECTS = 5;
export const SAFE_FETCH_TIMEOUT_MS = 5000;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

function parseIpv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums as [number, number, number, number];
}

export function isBlockedIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const parts = parseIpv4(address);
    if (!parts) return true;
    const [a, b] = parts;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    return false;
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe80:')) return true;
    return false;
  }

  return true;
}

export async function assertUrlSafeToFetch(urlString: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Unsupported URL scheme');
  }

  const hostname = url.hostname.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error('Blocked hostname');
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error('Blocked IP address');
    return url;
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0) {
    throw new Error('Hostname did not resolve');
  }

  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error('Hostname resolves to blocked IP');
    }
  }

  return url;
}

export type SafeFetchInit = Omit<RequestInit, 'redirect' | 'signal'> & {
  timeoutMs?: number;
  maxRedirects?: number;
};

export async function safeFetch(
  inputUrl: string,
  init: SafeFetchInit = {}
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? SAFE_FETCH_TIMEOUT_MS;
  const maxRedirects = init.maxRedirects ?? SAFE_FETCH_MAX_REDIRECTS;
  let currentUrl = inputUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await assertUrlSafeToFetch(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { timeoutMs: _t, maxRedirects: _m, ...fetchInit } = init;
      const response = await fetch(currentUrl, {
        ...fetchInit,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        if (hop >= maxRedirects) {
          throw new Error('Too many redirects');
        }

        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect missing location header');
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Too many redirects');
}
