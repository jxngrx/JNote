export type WallpaperTone = 'light' | 'dark';

function parseImageUrl(imageCss: string): string | null {
  if (!imageCss || imageCss === 'none') return null;
  const match = imageCss.match(/url\((['"]?)(.*?)\1\)/i);
  return match?.[2] ?? null;
}

function averageLuminance(imageData: ImageData): number {
  const { data } = imageData;
  let sum = 0;
  const pixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return sum / pixels;
}

export async function detectWallpaperTone(
  imageCss: string
): Promise<WallpaperTone> {
  const src = parseImageUrl(imageCss);
  if (!src) return 'light';

  return new Promise((resolve) => {
    const img = new Image();
    const isDataUrl = src.startsWith('data:');
    if (!isDataUrl) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve('dark');
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const luminance = averageLuminance(ctx.getImageData(0, 0, size, size));
        resolve(luminance > 0.56 ? 'light' : 'dark');
      } catch {
        resolve('light');
      }
    };

    img.onerror = () => resolve('light');
    img.src = src;
  });
}
