import type { WallpaperTone } from '@/lib/wallpaper-luminance';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

export function colorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.3;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function gradientAverageTone(colors: string[]): WallpaperTone {
  const valid = colors.filter(Boolean);
  if (valid.length === 0) return 'dark';
  const avg =
    valid.reduce((sum, color) => sum + colorLuminance(color), 0) / valid.length;
  return avg > 0.56 ? 'light' : 'dark';
}
