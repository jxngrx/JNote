'use client';

import { useEffect, useRef } from 'react';

const EMOJI_OPTIONS = [
  '📄', '📝', '💡', '🎯', '📌', '⭐', '🔥', '✅', '📚', '🗂️',
  '🧠', '💬', '🚀', '🎨', '📊', '🔖', '🏷️', '❤️', '🌟', '📎',
];

type PageIconPickerProps = {
  open: boolean;
  value: string | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
};

export function PageIconPicker({
  open,
  value,
  onSelect,
  onClose,
  anchorRef,
}: PageIconPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div ref={ref} className="page-icon-picker" role="dialog" aria-label="Choose page icon">
      <div className="page-icon-picker-grid">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`page-icon-picker-item ${value === emoji ? 'is-selected' : ''}`}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="page-icon-picker-clear"
        onClick={() => {
          onSelect('');
          onClose();
        }}
      >
        Remove icon
      </button>
    </div>
  );
}
