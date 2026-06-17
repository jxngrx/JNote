'use client';

import { useEffect } from 'react';
import { ensurePageFontLoaded, type PageFontId } from '@/lib/page-fonts';

export function usePageFontLoader(fontId: PageFontId | string) {
  useEffect(() => {
    ensurePageFontLoaded(fontId);
  }, [fontId]);
}
