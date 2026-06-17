'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageEditorCommand } from '@/lib/pages-editor-commands';
import type { SlashMenuState } from '@/components/pages/extensions/slash-command';
import { applyFloatingMenuPosition } from '@/lib/floating-menu-position';

type SlashMenuProps = Pick<
  SlashMenuState,
  'active' | 'items' | 'selectedIndex' | 'query' | 'clientRect' | 'submenuPath'
> & {
  variant?: 'inline' | 'selection';
  onSelect: (item: PageEditorCommand) => void;
  onHover: (index: number) => void;
  onBack?: () => void;
};

export function SlashMenu({
  active,
  items,
  selectedIndex,
  query,
  clientRect,
  submenuPath,
  variant = 'inline',
  onSelect,
  onHover,
  onBack,
}: SlashMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const parent = submenuPath[submenuPath.length - 1];

  useEffect(() => {
    if (!active || !ref.current || !clientRect) return;

    const reposition = () => {
      const menu = ref.current;
      const rect = clientRect();
      if (!menu || !rect) return;
      menu.style.visibility = 'hidden';
      requestAnimationFrame(() => {
        applyFloatingMenuPosition(menu, rect);
        menu.style.visibility = '';
      });
    };

    reposition();

    const scrollEl = document.querySelector('.page-editor-scroll');
    scrollEl?.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition);

    return () => {
      scrollEl?.removeEventListener('scroll', reposition);
      window.removeEventListener('resize', reposition);
    };
  }, [active, clientRect, items, selectedIndex, query, submenuPath]);

  useEffect(() => {
    if (!active || !listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [active, selectedIndex, items]);

  if (!active || items.length === 0) return null;

  return (
    <div ref={ref} className="page-slash-menu" role="listbox" aria-activedescendant={`slash-item-${selectedIndex}`}>
      {variant === 'selection' && !parent ? (
        <div className="page-slash-menu-header page-slash-menu-header--selection">
          <span className="page-slash-menu-selection-label">Format selection</span>
          <span className="page-slash-menu-kbd">⌘/</span>
        </div>
      ) : null}
      {parent ? (
        <div className="page-slash-menu-header">
          <button type="button" className="page-slash-menu-back" onMouseDown={(e) => e.preventDefault()} onClick={onBack}>
            <ChevronLeft size={14} strokeWidth={2} />
            <span>{parent.label}</span>
          </button>
        </div>
      ) : variant === 'inline' ? (
        <div className="page-slash-menu-header page-slash-menu-header--root">
          <span className="page-slash-menu-selection-label">Commands</span>
          {query ? <span className="page-slash-menu-query">/{query}</span> : null}
        </div>
      ) : null}
      <ul ref={listRef} className="page-slash-menu-list">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;
          const hasSubmenu = Boolean(item.getChildren || item.children?.length);
          return (
            <li key={item.id}>
              <button
                id={`slash-item-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                className="page-slash-menu-item"
                onMouseEnter={() => onHover(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(item)}
              >
                <span className="page-slash-menu-icon">
                  {item.swatch ? (
                    <span className="page-slash-menu-swatch" style={{ background: item.swatch }} />
                  ) : (
                    <Icon size={15} strokeWidth={1.75} />
                  )}
                </span>
                <span className="page-slash-menu-text">
                  <span className="page-slash-menu-label-row">
                    <span
                      className="page-slash-menu-label"
                      style={item.fontPreview ? { fontFamily: item.fontPreview } : undefined}
                    >
                      {item.label}
                    </span>
                    {item.shortcut ? (
                      <span className="page-slash-menu-kbd">{item.shortcut}</span>
                    ) : hasSubmenu ? (
                      <ChevronRight size={14} className="page-slash-menu-chevron" aria-hidden />
                    ) : null}
                  </span>
                  <span className="page-slash-menu-desc">{item.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="page-slash-menu-footer">
        <span className="page-slash-menu-footer-hint">
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          navigate
        </span>
        <span className="page-slash-menu-footer-hint">
          <kbd>↵</kbd>
          select
        </span>
        <span className="page-slash-menu-footer-hint">
          <kbd>esc</kbd>
          close
        </span>
      </div>
    </div>
  );
}
