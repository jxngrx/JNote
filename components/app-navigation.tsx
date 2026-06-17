'use client';

import { type ReactNode } from 'react';
import AppDock from '@/components/app-dock';
import AppSidebar from '@/components/app-sidebar';
import AppSettingsModal from '@/components/app-settings-modal';
import TodoDockContextMenu from '@/components/todo-dock-context-menu';
import { useAppNavigationItems } from '@/hooks/use-app-navigation-items';
import { useNavigationInsets } from '@/hooks/use-navigation-insets';
import { useNavigationSettingsStore } from '@/lib/navigation-settings-store';
import { useSettingsUiStore } from '@/lib/settings-ui-store';

type AppNavigationProps = {
  children: ReactNode;
};

export default function AppNavigation({ children }: AppNavigationProps) {
  const chrome = useNavigationSettingsStore((s) => s.chrome);
  const sidebarAttach = useNavigationSettingsStore((s) => s.sidebarAttach);
  const sidebarPosition = useNavigationSettingsStore((s) => s.sidebarPosition);
  const sidebarVisibility = useNavigationSettingsStore((s) => s.sidebarVisibility);
  const { items, onReorder, todoListMenu, setTodoListMenu } =
    useAppNavigationItems();
  const showSettings = useSettingsUiStore((s) => s.open);
  const settingsSection = useSettingsUiStore((s) => s.section);
  const closeSettings = useSettingsUiStore((s) => s.closeSettings);

  useNavigationInsets();

  const isAutoHideFloating =
    chrome === 'sidebar' &&
    sidebarAttach === 'floating' &&
    sidebarVisibility === 'auto-hide';

  // Always-visible sidebar participates in layout (desktop). Only auto-hide floats over content.
  const isInFlowSidebar = chrome === 'sidebar' && !isAutoHideFloating;

  const layoutClass = [
    'app-layout',
    isInFlowSidebar && 'app-layout--with-sidebar',
    isInFlowSidebar && `app-layout--sidebar-${sidebarPosition}`,
    isInFlowSidebar &&
      sidebarAttach === 'floating' &&
      'app-layout--sidebar-floating',
  ]
    .filter(Boolean)
    .join(' ');

  const inFlowSidebar = isInFlowSidebar ? (
    <AppSidebar
      items={items}
      variant="in-flow"
      attach={sidebarAttach}
    />
  ) : null;

  const overlaySidebar = isAutoHideFloating ? (
    <AppSidebar items={items} variant="overlay" attach={sidebarAttach} />
  ) : null;

  const dock =
    chrome === 'dock' ? (
      <AppDock items={items} onReorder={onReorder} />
    ) : null;

  return (
    <>
      <div className={layoutClass}>
        {isInFlowSidebar && sidebarPosition === 'left' && inFlowSidebar}
        {children}
        {isInFlowSidebar && sidebarPosition === 'right' && inFlowSidebar}
      </div>

      {overlaySidebar}
      {dock}

      <AppSettingsModal
        open={showSettings}
        onClose={closeSettings}
        initialSection={settingsSection}
      />

      {todoListMenu && (
        <TodoDockContextMenu
          listId={todoListMenu.listId}
          listTitle={todoListMenu.listTitle}
          x={todoListMenu.x}
          y={todoListMenu.y}
          onClose={() => setTodoListMenu(null)}
        />
      )}
    </>
  );
}
