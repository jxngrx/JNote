'use client';

import ThemeProvider from '@/components/theme-provider';
import TypographyProvider from '@/components/typography-provider';
import WallpaperContrastSync from '@/components/wallpaper-contrast-sync';
import '@/components/app-wallpaper-contrast.css';

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <TypographyProvider>
        <WallpaperContrastSync />
        {children}
      </TypographyProvider>
    </ThemeProvider>
  );
}
