const STORAGE_KEY = 'page-bubble-pinned-colors-v1';

export type PinnedBubbleColors = {
  text: string[];
  highlight: string[];
};

const DEFAULT: PinnedBubbleColors = { text: [], highlight: [] };

export function loadPinnedBubbleColors(): PinnedBubbleColors {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as PinnedBubbleColors;
    return {
      text: Array.isArray(parsed.text) ? parsed.text.filter(isHex) : [],
      highlight: Array.isArray(parsed.highlight) ? parsed.highlight.filter(isHex) : [],
    };
  } catch {
    return DEFAULT;
  }
}

export function savePinnedBubbleColors(colors: PinnedBubbleColors) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

function isHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function pinBubbleColor(type: 'text' | 'highlight', color: string) {
  if (!isHex(color)) return loadPinnedBubbleColors();
  const current = loadPinnedBubbleColors();
  const list = current[type].filter((c) => c !== color);
  const next = [color, ...list].slice(0, 4);
  const updated = { ...current, [type]: next };
  savePinnedBubbleColors(updated);
  return updated;
}

export function unpinBubbleColor(type: 'text' | 'highlight', color: string) {
  const current = loadPinnedBubbleColors();
  const updated = {
    ...current,
    [type]: current[type].filter((c) => c !== color),
  };
  savePinnedBubbleColors(updated);
  return updated;
}
