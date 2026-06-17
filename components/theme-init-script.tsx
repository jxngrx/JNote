import { THEME_STORAGE_KEY } from '@/lib/theme-store';

/** Inline script to apply persisted theme before first paint (prevents flash). */
export default function ThemeInitScript() {
  const script = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var state = parsed && parsed.state ? parsed.state : parsed;
    if (!state || !state.colors || !state.mode) return;

    var mode = state.mode;
    var colors = state.colors;
    var channel = mode === 'light' ? '0, 0, 0' : '255, 255, 255';
    var muted = mode === 'light' ? '14%' : '18%';
    var shadows = mode === 'light'
      ? {
          sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          md: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
          lg: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
        }
      : {
          sm: '0 1px 3px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.12)',
          md: '0 4px 16px rgba(0, 0, 0, 0.24), 0 1px 4px rgba(0, 0, 0, 0.12)',
          lg: '0 8px 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.18)'
        };

    var root = document.documentElement;
    var vars = {
      '--bg': colors.bg,
      '--surface': colors.surface,
      '--surface-2': colors.surface2,
      '--border': 'rgba(' + channel + ', ' + (colors.borderOpacity || 0.06) + ')',
      '--border-strong': 'rgba(' + channel + ', ' + (colors.borderStrongOpacity || 0.1) + ')',
      '--text-primary': colors.textPrimary,
      '--text-secondary': colors.textSecondary,
      '--text-tertiary': colors.textTertiary,
      '--accent': colors.accent,
      '--orange': colors.accent,
      '--orange-muted': 'color-mix(in srgb, ' + colors.accent + ' ' + muted + ', transparent)',
      '--red': colors.red,
      '--green': colors.green,
      '--amber': colors.amber,
      '--blue': colors.blue,
      '--shadow-sm': shadows.sm,
      '--shadow-md': shadows.md,
      '--shadow-lg': shadows.lg
    };

    Object.keys(vars).forEach(function (key) {
      root.style.setProperty(key, vars[key]);
    });

    root.dataset.themeMode = mode;
    root.dataset.themePreset = state.presetId || 'custom';
    root.dataset.themeActive = 'true';
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = mode;
  } catch (e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
