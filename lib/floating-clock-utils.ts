export const FLOATING_CLOCK_COLLAPSED_WIDTH = 118;
export const FLOATING_CLOCK_COLLAPSED_HEIGHT = 56;
export const FLOATING_CLOCK_EXPANDED_WIDTH = 188;
export const FLOATING_CLOCK_EXPANDED_HEIGHT = 56;
export const FLOATING_CLOCK_MARGIN = 8;
export const FLOATING_CLOCK_GAP = 10;

export function clampFloatingClockPosition(
  x: number,
  y: number,
  width = FLOATING_CLOCK_COLLAPSED_WIDTH,
  height = FLOATING_CLOCK_COLLAPSED_HEIGHT
) {
  if (typeof window === 'undefined') return { x, y };

  const margin = FLOATING_CLOCK_MARGIN;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);

  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY),
  };
}

export function getFloatingClockCityLabel(clock: {
  zoneLabel?: string;
  countryName: string;
}) {
  return clock.zoneLabel?.trim() || clock.countryName;
}
