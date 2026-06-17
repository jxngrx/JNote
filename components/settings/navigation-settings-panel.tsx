'use client';

import { useMemo } from 'react';
import {
  CheckSquare,
  FileText,
  Globe,
  RotateCcw,
  Settings,
  StickyNote,
} from 'lucide-react';
import MagneticDock from '@/components/ui/magnetic-dock';
import {
  DEFAULT_NAVIGATION_SETTINGS,
  NAVIGATION_SETTINGS_LIMITS,
  SIDEBAR_COLLAPSED_WIDTH,
  useNavigationSettingsStore,
  type NavigationChrome,
  type SidebarAttach,
  type SidebarPosition,
  type SidebarVisibility,
} from '@/lib/navigation-settings-store';
import { TodoSettingsSlider } from '@/components/settings/todo-settings-shared';

function NavSettingsToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--toggle">
      <div className="widgets-setting-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button
        type="button"
        className={`widgets-setting-toggle${enabled ? ' is-on' : ''}`}
        onClick={onToggle}
        aria-pressed={enabled}
      >
        <span className="widgets-setting-toggle-thumb" aria-hidden />
      </button>
    </div>
  );
}

function VariantPicker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="widgets-setting-row widgets-setting-row--variant">
      <span className="widgets-setting-label">{label}</span>
      <div className="widgets-variant-picker">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`widgets-variant-picker-btn${
              value === option.id ? ' is-active' : ''
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DockPreview() {
  const iconSize = useNavigationSettingsStore((s) => s.iconSize);
  const maxScale = useNavigationSettingsStore((s) => s.maxScale);
  const magneticDistance = useNavigationSettingsStore((s) => s.magneticDistance);
  const showLabels = useNavigationSettingsStore((s) => s.showLabels);

  const previewItems = useMemo(
    () => [
      { id: 'preview-notes', icon: <StickyNote size={18} />, label: 'Notes' },
      { id: 'preview-pages', icon: <FileText size={18} />, label: 'Pages' },
      {
        id: 'preview-todo',
        icon: <CheckSquare size={18} />,
        label: 'Todo',
        isActive: true,
      },
      { id: 'preview-world', icon: <Globe size={18} />, label: 'World' },
      { type: 'separator' as const, id: 'preview-sep' },
      { id: 'preview-settings', icon: <Settings size={18} />, label: 'Settings' },
    ],
    []
  );

  return (
    <div className="dock-settings-preview" aria-label="Dock preview">
      <p className="dock-settings-preview-hint">
        Hover icons to preview magnification and labels.
      </p>
      <div className="dock-settings-preview-stage">
        <MagneticDock
          items={previewItems}
          iconSize={iconSize}
          maxScale={maxScale}
          magneticDistance={magneticDistance}
          showLabels={showLabels}
        />
      </div>
    </div>
  );
}

function SidebarPreview() {
  const settings = useNavigationSettingsStore();

  const previewItems = useMemo(
    () => [
      { id: 'preview-notes', icon: <StickyNote size={16} />, label: 'Notes' },
      {
        id: 'preview-todo',
        icon: <CheckSquare size={16} />,
        label: 'Todo',
        isActive: true,
      },
      { id: 'preview-world', icon: <Globe size={16} />, label: 'World' },
    ],
    []
  );

  const width = settings.sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : settings.sidebarWidth;

  return (
    <div className="nav-sidebar-settings-preview" aria-label="Sidebar preview">
      <p className="dock-settings-preview-hint">
        Floating panel with rounded corners. Fixed mode pushes content on desktop.
      </p>
      <div
        className={`nav-sidebar-settings-preview-stage nav-sidebar-settings-preview-stage--${settings.sidebarPosition}`}
      >
        <div
          className={`nav-sidebar-settings-preview-panel${settings.sidebarCollapsed ? ' is-collapsed' : ''}`}
          style={{
            width,
            borderRadius:
              settings.sidebarPosition === 'left'
                ? `0 ${settings.sidebarRadius}px ${settings.sidebarRadius}px 0`
                : `${settings.sidebarRadius}px 0 0 ${settings.sidebarRadius}px`,
          }}
        >
          {previewItems.map((item) => (
            <div
              key={item.id}
              className={`nav-sidebar-settings-preview-item${item.isActive ? ' is-active' : ''}`}
            >
              <span className="nav-sidebar-settings-preview-icon">{item.icon}</span>
              {!settings.sidebarCollapsed && (
                <span>{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NavigationSettingsPanel() {
  const settings = useNavigationSettingsStore();
  const setSettings = useNavigationSettingsStore((s) => s.setSettings);
  const resetSettings = useNavigationSettingsStore((s) => s.resetSettings);
  const resetDockSettings = useNavigationSettingsStore((s) => s.resetDockSettings);
  const resetSidebarSettings = useNavigationSettingsStore(
    (s) => s.resetSidebarSettings
  );
  const limits = NAVIGATION_SETTINGS_LIMITS;

  return (
    <div className="widgets-settings">
      <div className="widgets-settings-toolbar">
        <button
          type="button"
          className="widgets-settings-reset"
          onClick={resetSettings}
        >
          <RotateCcw size={14} />
          Reset navigation
        </button>
      </div>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Navigation style</h3>
        <VariantPicker<NavigationChrome>
          label="Chrome"
          value={settings.chrome}
          options={[
            { id: 'dock', label: 'Dock' },
            { id: 'sidebar', label: 'Sidebar' },
          ]}
          onChange={(chrome) => setSettings({ chrome })}
        />
      </section>

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Preview</h3>
        {settings.chrome === 'dock' ? <DockPreview /> : <SidebarPreview />}
      </section>

      {settings.chrome === 'dock' ? (
        <>
          <section className="widgets-settings-block">
            <div className="widgets-settings-toolbar" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="widgets-settings-reset widgets-settings-reset--inline"
                onClick={resetDockSettings}
              >
                <RotateCcw size={13} />
                Reset dock
              </button>
            </div>
            <h3 className="widgets-settings-heading">Icon size</h3>
            <TodoSettingsSlider
              id="nav-dock-icon-size"
              label="Icon size"
              value={settings.iconSize}
              {...limits.iconSize}
              onChange={(iconSize) => setSettings({ iconSize })}
            />
          </section>

          <section className="widgets-settings-block">
            <h3 className="widgets-settings-heading">Magnetic effect</h3>
            <TodoSettingsSlider
              id="nav-dock-max-scale"
              label="Max scale"
              value={settings.maxScale}
              {...limits.maxScale}
              unit="x"
              onChange={(maxScale) => setSettings({ maxScale })}
            />
            <TodoSettingsSlider
              id="nav-dock-magnetic-distance"
              label="Magnetic distance"
              value={settings.magneticDistance}
              {...limits.magneticDistance}
              onChange={(magneticDistance) =>
                setSettings({ magneticDistance })
              }
            />
          </section>

          <section className="widgets-settings-block">
            <h3 className="widgets-settings-heading">Behavior</h3>
            <NavSettingsToggle
              label="Show labels"
              description="Display item names in a tooltip when hovering dock icons."
              enabled={settings.showLabels}
              onToggle={() =>
                setSettings({ showLabels: !settings.showLabels })
              }
            />
          </section>
        </>
      ) : (
        <>
          <section className="widgets-settings-block">
            <div className="widgets-settings-toolbar" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="widgets-settings-reset widgets-settings-reset--inline"
                onClick={resetSidebarSettings}
              >
                <RotateCcw size={13} />
                Reset sidebar
              </button>
            </div>
            <VariantPicker<SidebarPosition>
              label="Position"
              value={settings.sidebarPosition}
              options={[
                { id: 'left', label: 'Left' },
                { id: 'right', label: 'Right' },
              ]}
              onChange={(sidebarPosition) => setSettings({ sidebarPosition })}
            />
            <VariantPicker<SidebarAttach>
              label="Attach"
              value={settings.sidebarAttach}
              options={[
                { id: 'fixed', label: 'Fixed' },
                { id: 'floating', label: 'Floating' },
              ]}
              onChange={(sidebarAttach) => setSettings({ sidebarAttach })}
            />
            {settings.sidebarAttach === 'floating' && (
              <VariantPicker<SidebarVisibility>
                label="Visibility"
                value={settings.sidebarVisibility}
                options={[
                  { id: 'always', label: 'Always' },
                  { id: 'auto-hide', label: 'Auto-hide' },
                ]}
                onChange={(sidebarVisibility) =>
                  setSettings({ sidebarVisibility })
                }
              />
            )}
          </section>

          <section className="widgets-settings-block">
            <h3 className="widgets-settings-heading">Dimensions</h3>
            <TodoSettingsSlider
              id="nav-sidebar-width"
              label="Width"
              value={settings.sidebarWidth}
              {...limits.sidebarWidth}
              onChange={(sidebarWidth) => setSettings({ sidebarWidth })}
            />
            <TodoSettingsSlider
              id="nav-sidebar-radius"
              label="Corner radius"
              value={settings.sidebarRadius}
              {...limits.sidebarRadius}
              onChange={(sidebarRadius) => setSettings({ sidebarRadius })}
            />
            <TodoSettingsSlider
              id="nav-sidebar-offset"
              label="Edge offset"
              value={settings.sidebarOffset}
              {...limits.sidebarOffset}
              onChange={(sidebarOffset) => setSettings({ sidebarOffset })}
            />
            <TodoSettingsSlider
              id="nav-sidebar-icon-size"
              label="Icon size"
              value={settings.iconSize}
              {...limits.iconSize}
              onChange={(iconSize) => setSettings({ iconSize })}
            />
          </section>

          {settings.sidebarAttach === 'floating' &&
            settings.sidebarVisibility === 'auto-hide' && (
              <section className="widgets-settings-block">
                <h3 className="widgets-settings-heading">Auto-hide</h3>
                <TodoSettingsSlider
                  id="nav-auto-hide-edge"
                  label="Edge trigger"
                  value={settings.autoHideEdgeSize}
                  {...limits.autoHideEdgeSize}
                  onChange={(autoHideEdgeSize) =>
                    setSettings({ autoHideEdgeSize })
                  }
                />
                <TodoSettingsSlider
                  id="nav-auto-hide-delay"
                  label="Hide delay"
                  value={settings.autoHideDelayMs}
                  {...limits.autoHideDelayMs}
                  unit="ms"
                  onChange={(autoHideDelayMs) =>
                    setSettings({ autoHideDelayMs })
                  }
                />
              </section>
            )}

          <section className="widgets-settings-block">
            <h3 className="widgets-settings-heading">Behavior</h3>
            <NavSettingsToggle
              label="Collapsed rail"
              description="Show icon-only sidebar instead of full width."
              enabled={settings.sidebarCollapsed}
              onToggle={() =>
                setSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
              }
            />
            <NavSettingsToggle
              label="Show labels"
              description="Display item names beside icons in the sidebar."
              enabled={settings.showLabels}
              onToggle={() =>
                setSettings({ showLabels: !settings.showLabels })
              }
            />
          </section>
        </>
      )}

      <section className="widgets-settings-block">
        <h3 className="widgets-settings-heading">Defaults</h3>
        <p className="widgets-settings-subheading">
          {settings.chrome === 'dock'
            ? `Dock · Icon ${DEFAULT_NAVIGATION_SETTINGS.iconSize}px · Scale ${DEFAULT_NAVIGATION_SETTINGS.maxScale}x`
            : `Sidebar · ${DEFAULT_NAVIGATION_SETTINGS.sidebarWidth}px · ${DEFAULT_NAVIGATION_SETTINGS.sidebarAttach} · ${DEFAULT_NAVIGATION_SETTINGS.sidebarPosition}`}
        </p>
      </section>
    </div>
  );
}
