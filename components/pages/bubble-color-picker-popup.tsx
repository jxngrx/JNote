'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { applyFloatingMenuPosition } from '@/lib/floating-menu-position';

type BubbleColorPickerPopupProps = {
  open: boolean;
  type: 'text' | 'highlight';
  initialColor: string;
  anchorEl: HTMLElement | null;
  pinnedColors?: string[];
  onClose: () => void;
  onUse: (color: string) => void;
  onSaveAndUse: (color: string) => void;
  onUnpin?: (color: string) => void;
};

function normalizeHex(value: string) {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
  return null;
}

export function BubbleColorPickerPopup({
  open,
  type,
  initialColor,
  anchorEl,
  pinnedColors = [],
  onClose,
  onUse,
  onSaveAndUse,
  onUnpin,
}: BubbleColorPickerPopupProps) {
  const [color, setColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setColor(initialColor);
    setHexInput(initialColor);
  }, [open, initialColor]);

  useEffect(() => {
    if (!open || !anchorEl || !popoverRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const popover = popoverRef.current;
    popover.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      applyFloatingMenuPosition(popover, rect);
      popover.style.visibility = '';
    });
  }, [open, anchorEl, pinnedColors.length]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorEl]);

  if (!open || typeof document === 'undefined') return null;

  const label = type === 'text' ? 'Text color' : 'Highlight color';
  const valid = normalizeHex(hexInput) ?? normalizeHex(color);

  return createPortal(
    <div
      ref={popoverRef}
      className="page-bubble-color-popup"
      role="dialog"
      aria-label={label}
    >
      <p className="page-bubble-color-popup-label">{label}</p>

      {pinnedColors.length > 0 ? (
        <div className="page-bubble-color-popup-pinned">
          <p className="page-bubble-color-popup-pinned-label">Saved colors</p>
          <div className="page-bubble-color-popup-pinned-strip">
            {pinnedColors.map((pinned) => (
              <div key={pinned} className="page-bubble-color-popup-pinned-item">
                <button
                  type="button"
                  className="page-bubble-color-popup-pinned-swatch"
                  style={{ background: pinned }}
                  onClick={() => {
                    onUse(pinned);
                    onClose();
                  }}
                  title={`Use ${pinned}`}
                />
                {onUnpin ? (
                  <button
                    type="button"
                    className="page-bubble-color-popup-pinned-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(pinned);
                    }}
                    aria-label={`Remove ${pinned}`}
                  >
                    <X size={10} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="page-bubble-color-popup-preview">
        <input
          type="color"
          className="page-bubble-color-popup-native"
          value={valid ?? '#FFFFFF'}
          onChange={(e) => {
            setColor(e.target.value);
            setHexInput(e.target.value);
          }}
        />
        <input
          type="text"
          className="page-bubble-color-popup-hex"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value.toUpperCase())}
          placeholder="#FFFFFF"
          spellCheck={false}
        />
      </div>
      <div className="page-bubble-color-popup-actions">
        <button type="button" className="page-bubble-color-popup-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="page-bubble-color-popup-btn page-bubble-color-popup-btn--primary"
          disabled={!valid}
          onClick={() => {
            if (!valid) return;
            onUse(valid);
            onClose();
          }}
        >
          Use
        </button>
        <button
          type="button"
          className="page-bubble-color-popup-btn page-bubble-color-popup-btn--save"
          disabled={!valid}
          onClick={() => {
            if (!valid) return;
            onSaveAndUse(valid);
            onClose();
          }}
        >
          Save & use
        </button>
      </div>
    </div>,
    document.body
  );
}
