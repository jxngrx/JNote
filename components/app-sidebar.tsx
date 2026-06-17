'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';
import type {
  MagneticDockEntry,
  MagneticDockItemData,
} from '@/components/ui/magnetic-dock';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getSidebarEffectiveWidth,
  SIDEBAR_COLLAPSED_WIDTH,
  useNavigationSettingsStore,
  type SidebarAttach,
} from '@/lib/navigation-settings-store';
import './app-sidebar.css';

const MOBILE_BREAKPOINT = 720;

function isSeparator(
  entry: MagneticDockEntry
): entry is { type: 'separator'; id: string } {
  return 'type' in entry && entry.type === 'separator';
}

type AppSidebarProps = {
  items: MagneticDockEntry[];
  variant?: 'overlay' | 'in-flow';
  attach?: SidebarAttach;
};

export default function AppSidebar({
  items,
  variant = 'overlay',
  attach = 'floating',
}: AppSidebarProps) {
  const settings = useNavigationSettingsStore();
  const setSettings = useNavigationSettingsStore((s) => s.setSettings);

  const [isMobile, setIsMobile] = useState(false);
  const [isRevealed, setIsRevealed] = useState(
    settings.sidebarVisibility === 'always' || settings.sidebarAttach === 'fixed'
  );
  const hideTimerRef = useRef<number | null>(null);

  const shouldAutoHide =
    settings.sidebarAttach === 'floating' &&
    settings.sidebarVisibility === 'auto-hide';

  const effectiveWidth = getSidebarEffectiveWidth(settings);
  const isLeft = settings.sidebarPosition === 'left';
  const isInFlow = variant === 'in-flow';

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!shouldAutoHide) {
      setIsRevealed(true);
      return;
    }
    setIsRevealed(false);
  }, [shouldAutoHide]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (!shouldAutoHide) return;
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsRevealed(false);
      hideTimerRef.current = null;
    }, settings.autoHideDelayMs);
  }, [shouldAutoHide, settings.autoHideDelayMs, clearHideTimer]);

  const reveal = useCallback(() => {
    clearHideTimer();
    setIsRevealed(true);
  }, [clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const isHidden = shouldAutoHide && !isRevealed;
  const showBackdrop = isMobile && isRevealed && shouldAutoHide;

  const panelStyle = {
    '--app-sidebar-width': `${settings.sidebarWidth}px`,
    '--app-sidebar-collapsed-width': `${SIDEBAR_COLLAPSED_WIDTH}px`,
    '--app-sidebar-effective-width': `${effectiveWidth}px`,
    '--app-sidebar-radius': `${settings.sidebarRadius}px`,
    '--app-sidebar-offset': `${settings.sidebarOffset}px`,
    '--app-sidebar-icon-size': `${settings.iconSize}px`,
  } as React.CSSProperties;

  const wrapClass = [
    'app-sidebar-wrap',
    isLeft ? 'app-sidebar-wrap--left' : 'app-sidebar-wrap--right',
    isInFlow ? 'app-sidebar-wrap--in-flow' : '',
    isInFlow && attach === 'floating' ? 'app-sidebar-wrap--in-flow-floating' : '',
    isInFlow && attach === 'fixed' ? 'app-sidebar-wrap--in-flow-fixed' : '',
    isHidden ? 'is-hidden' : 'is-visible',
  ]
    .filter(Boolean)
    .join(' ');

  const renderItem = (item: MagneticDockItemData) => (
    <button
      key={item.id}
      type="button"
      className={[
        'app-sidebar-item',
        item.isActive ? 'is-active' : '',
        item.isSub ? 'is-sub' : '',
        settings.sidebarCollapsed ? 'is-collapsed-item' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={item.onClick}
      onContextMenu={item.onContextMenu}
      title={settings.sidebarCollapsed || !settings.showLabels ? item.label : undefined}
      aria-label={item.label}
    >
      <span className="app-sidebar-item-icon">{item.icon}</span>
      {!settings.sidebarCollapsed && (
        <span className="app-sidebar-item-label">{item.label}</span>
      )}
      {item.badge !== undefined && item.badge > 0 && (
        <span className="app-sidebar-item-badge">{item.badge}</span>
      )}
    </button>
  );

  return (
    <>
      {!isInFlow && shouldAutoHide && (
        <div
          className={`app-sidebar-edge-trigger app-sidebar-edge-trigger--${settings.sidebarPosition}`}
          style={{ width: settings.autoHideEdgeSize }}
          onPointerEnter={reveal}
          onPointerLeave={scheduleHide}
          aria-hidden
        />
      )}

      {showBackdrop && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={scheduleHide}
        />
      )}

      <aside
        className={wrapClass}
        style={panelStyle}
        onPointerEnter={shouldAutoHide ? reveal : undefined}
        onPointerLeave={shouldAutoHide ? scheduleHide : undefined}
        aria-label="App navigation"
        data-sidebar-width={effectiveWidth}
      >
        <div
          className={`app-sidebar-panel${settings.sidebarCollapsed ? ' is-collapsed' : ''}`}
        >
          <header className="app-sidebar-header">
            {!settings.sidebarCollapsed && (
              <span className="app-sidebar-brand">Navigation</span>
            )}
            <button
              type="button"
              className="app-sidebar-collapse-btn"
              onClick={() =>
                setSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
              }
              aria-label={
                settings.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
              title={
                settings.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              {settings.sidebarCollapsed ? (
                isLeft ? <PanelRight size={16} /> : <PanelLeft size={16} />
              ) : isLeft ? (
                <ChevronLeft size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </header>

          <ScrollArea className="app-sidebar-nav">
            {items.map((entry) => {
              if (isSeparator(entry)) {
                return (
                  <div
                    key={entry.id}
                    className="app-sidebar-separator"
                    role="separator"
                  />
                );
              }
              return renderItem(entry);
            })}
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
