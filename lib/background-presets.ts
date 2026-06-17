export type BackgroundKind = 'theme' | 'photo' | 'gradient';

export type BackgroundPresetId =
  | 'none'
  | 'warm-sand'
  | 'misty-forest'
  | 'ocean-dawn'
  | 'night-city'
  | 'soft-stone'
  | 'aurora'
  | 'custom';

export type GradientPresetId =
  | 'blue-mosaic'
  | 'deep-ocean'
  | 'sunset-warm'
  | 'forest-mist'
  | 'custom';

export type BackgroundPreset = {
  id: BackgroundPresetId;
  name: string;
  background: string;
  thumbnail: string;
};

export type GradientPreset = {
  id: GradientPresetId;
  name: string;
  colors: string[];
  angle: number;
  thumbnail: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'none',
    name: 'Theme default',
    background: 'none',
    thumbnail: 'linear-gradient(135deg, #1a1a1a 0%, #242422 100%)',
  },
  {
    id: 'warm-sand',
    name: 'Warm sand',
    background:
      'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=60)',
  },
  {
    id: 'misty-forest',
    name: 'Misty forest',
    background:
      'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=60)',
  },
  {
    id: 'ocean-dawn',
    name: 'Ocean dawn',
    background:
      'url(https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=400&q=60)',
  },
  {
    id: 'night-city',
    name: 'Night city',
    background:
      'url(https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=60)',
  },
  {
    id: 'soft-stone',
    name: 'Soft stone',
    background:
      'url(https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=400&q=60)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    background:
      'url(https://images.unsplash.com/photo-1531366937767-da79ca677927?auto=format&fit=crop&w=1920&q=80)',
    thumbnail:
      'url(https://images.unsplash.com/photo-1531366937767-da79ca677927?auto=format&fit=crop&w=400&q=60)',
  },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'blue-mosaic',
    name: 'Blue mosaic',
    colors: ['#0a1628', '#12325a', '#2c6edb', '#5b9fd4', '#a8d4f5'],
    angle: 145,
    thumbnail: 'linear-gradient(145deg, #0a1628, #2c6edb, #a8d4f5)',
  },
  {
    id: 'deep-ocean',
    name: 'Deep ocean',
    colors: ['#020810', '#0c2340', '#1a4a6e'],
    angle: 160,
    thumbnail: 'linear-gradient(160deg, #020810, #1a4a6e)',
  },
  {
    id: 'sunset-warm',
    name: 'Sunset warm',
    colors: ['#1a0a08', '#6b2d1a', '#c45a3a', '#e8a87c'],
    angle: 135,
    thumbnail: 'linear-gradient(135deg, #1a0a08, #c45a3a, #e8a87c)',
  },
  {
    id: 'forest-mist',
    name: 'Forest mist',
    colors: ['#0d1a12', '#1e3d2a', '#4a7c59', '#8fb996'],
    angle: 150,
    thumbnail: 'linear-gradient(150deg, #0d1a12, #4a7c59, #8fb996)',
  },
];

export function buildGradientCss(colors: string[], angle: number): string {
  const stops = colors.filter(Boolean);
  if (stops.length < 2) return 'none';
  const spread = stops.map((color, i) => {
    const pct = (i / (stops.length - 1)) * 100;
    return `${color} ${pct}%`;
  });
  return `linear-gradient(${angle}deg, ${spread.join(', ')})`;
}

export function resolvePhotoBackground(
  presetId: BackgroundPresetId,
  customImageUrl: string | null
): string {
  if (presetId === 'custom' && customImageUrl) {
    return `url(${customImageUrl})`;
  }
  const preset = BACKGROUND_PRESETS.find((p) => p.id === presetId);
  if (!preset || preset.id === 'none') return 'none';
  return preset.background;
}
