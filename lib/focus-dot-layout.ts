export type FocusDotLayout = {
  size: number;
  gap: number;
  columns: number;
  rows: number;
};

export function computeFocusDotLayout(
  columns: number,
  dotCount: number,
  width: number,
  height: number
): FocusDotLayout {
  const rows = Math.ceil(dotCount / columns);
  const minSize = 6;
  const maxSize = 34;

  if (width <= 0 || height <= 0 || columns <= 0 || rows <= 0) {
    return { size: 12, gap: 4, columns, rows };
  }

  let bestSize = minSize;
  let bestGap = 4;

  for (let size = maxSize; size >= minSize; size -= 0.5) {
    const gap = Math.max(2, Math.min(10, Math.round(size * 0.3)));
    const gridW = columns * size + (columns - 1) * gap;
    const gridH = rows * size + (rows - 1) * gap;

    if (gridW <= width && gridH <= height) {
      bestSize = size;
      bestGap = gap;
      break;
    }
  }

  return {
    size: Math.round(bestSize * 2) / 2,
    gap: bestGap,
    columns,
    rows,
  };
}
