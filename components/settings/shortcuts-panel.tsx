'use client';

const SHORTCUTS = [
  { keys: '⌘⇧S', label: 'Switch to Sticky Notes' },
  { keys: '⌘⇧P', label: 'Switch to Pages' },
  { keys: '⌘⇧A', label: 'Switch to Area' },
  { keys: '⌘⇧T', label: 'Switch to Todo' },
] as const;

export default function ShortcutsPanel() {
  return (
    <section className="app-settings-section">
      <h3 className="app-settings-section-title">Keyboard shortcuts</h3>
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.keys} className="app-settings-shortcut-row">
          <span className="app-settings-kbd">{shortcut.keys}</span>
          <span>{shortcut.label}</span>
        </div>
      ))}
    </section>
  );
}
