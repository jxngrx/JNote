export type FloatingMenuPosition = {
  top: number;
  left: number;
  placement: 'above' | 'below';
};

type PositionFloatingMenuOptions = {
  gap?: number;
  margin?: number;
  preferredWidth?: number;
  preferredHeight?: number;
};

/** Viewport-safe position for fixed menus anchored to a caret/selection rect. */
export function positionFloatingMenu(
  anchorRect: DOMRect,
  menuSize: { width: number; height: number },
  options: PositionFloatingMenuOptions = {}
): FloatingMenuPosition {
  const gap = options.gap ?? 8;
  const margin = options.margin ?? 12;
  const menuW = menuSize.width;
  const menuH = menuSize.height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceBelow = vh - margin - (anchorRect.bottom + gap);
  const spaceAbove = anchorRect.top - gap - margin;

  let placement: 'above' | 'below' = 'below';
  if (spaceBelow < menuH && spaceAbove > spaceBelow) {
    placement = 'above';
  }

  let top =
    placement === 'below'
      ? anchorRect.bottom + gap
      : anchorRect.top - menuH - gap;

  top = Math.max(margin, Math.min(top, vh - menuH - margin));

  let left = anchorRect.left;
  left = Math.max(margin, Math.min(left, vw - menuW - margin));

  return { top, left, placement };
}

export function applyFloatingMenuPosition(
  menuEl: HTMLElement,
  anchorRect: DOMRect,
  options?: PositionFloatingMenuOptions
) {
  const pos = positionFloatingMenu(
    anchorRect,
    { width: menuEl.offsetWidth, height: menuEl.offsetHeight },
    options
  );
  menuEl.style.top = `${pos.top}px`;
  menuEl.style.left = `${pos.left}px`;
  menuEl.dataset.placement = pos.placement;
  return pos;
}
