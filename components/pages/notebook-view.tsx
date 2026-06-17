'use client';

import type { NotebookSettings } from '@/lib/types';
import { normalizePageFontId, getPageFontCss } from '@/lib/page-fonts';

const DEFAULT_NOTEBOOK: Required<
  Pick<
    NotebookSettings,
    | 'paperBg'
    | 'ruledStyle'
    | 'lineColor'
    | 'lineGap'
    | 'marginEnabled'
    | 'marginColor'
    | 'pageSize'
    | 'fontSize'
  >
> = {
  paperBg: 'off-white',
  ruledStyle: 'lined',
  lineColor: '#C8D6E5',
  lineGap: 28,
  marginEnabled: true,
  marginColor: '#E8432D',
  pageSize: 'a4',
  fontSize: 16,
};

const PAPER_COLORS: Record<string, string> = {
  'off-white': '#FAFAF8',
  white: '#FFFFFF',
  cream: '#F5F0E6',
  kraft: '#C4A574',
  dark: '#1C1C1A',
};

const PAGE_RATIOS: Record<string, string> = {
  a4: '210 / 297',
  letter: '8.5 / 11',
  a5: '148 / 210',
};

function mergeSettings(settings?: NotebookSettings) {
  return { ...DEFAULT_NOTEBOOK, ...settings };
}

type NotebookViewProps = {
  settings?: NotebookSettings;
  notebookFontId?: string;
  children: React.ReactNode;
};

export function NotebookView({ settings, notebookFontId, children }: NotebookViewProps) {
  const cfg = mergeSettings(settings);
  const paperColor =
    cfg.paperBg === 'custom' && settings?.customPaperColor
      ? settings.customPaperColor
      : (PAPER_COLORS[cfg.paperBg] ?? PAPER_COLORS['off-white']);

  const fontId = normalizePageFontId(notebookFontId ?? settings?.notebookFont ?? 'fira-code');
  const fontCss = getPageFontCss(fontId);
  const aspect = PAGE_RATIOS[cfg.pageSize] ?? PAGE_RATIOS.a4;

  const lineBg =
    cfg.ruledStyle === 'blank'
      ? 'none'
      : cfg.ruledStyle === 'grid'
        ? `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent ${cfg.lineGap - 1}px,
            ${cfg.lineColor} ${cfg.lineGap - 1}px,
            ${cfg.lineColor} ${cfg.lineGap}px
          ),
          repeating-linear-gradient(
            to right,
            transparent,
            transparent ${cfg.lineGap - 1}px,
            ${cfg.lineColor} ${cfg.lineGap - 1}px,
            ${cfg.lineColor} ${cfg.lineGap}px
          )`
        : cfg.ruledStyle === 'dot'
          ? `radial-gradient(circle at 1px 1px, ${cfg.lineColor} 1px, transparent 0)`
          : `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent ${cfg.lineGap - 1}px,
              ${cfg.lineColor} ${cfg.lineGap - 1}px,
              ${cfg.lineColor} ${cfg.lineGap}px
            )`;

  const dotSize = cfg.ruledStyle === 'dot' ? `${cfg.lineGap}px ${cfg.lineGap}px` : undefined;

  return (
    <div className="notebook-desk">
      <div
        className={`notebook-paper notebook-paper--${cfg.ruledStyle} notebook-paper--${cfg.pageSize}`}
        style={{
          aspectRatio: aspect,
          backgroundColor: paperColor,
          ['--notebook-line-gap' as string]: `${cfg.lineGap}px`,
          ['--notebook-font-size' as string]: `${cfg.fontSize}px`,
          ['--notebook-font' as string]: fontCss,
          ['--notebook-margin-color' as string]: cfg.marginColor,
        }}
      >
        {cfg.marginEnabled ? <div className="notebook-margin-line" aria-hidden /> : null}
        <div
          className="notebook-lines"
          style={{
            backgroundImage: lineBg,
            backgroundSize: dotSize,
          }}
          aria-hidden
        />
        <div className="notebook-content">{children}</div>
        <div className="notebook-page-curl" aria-hidden />
      </div>
    </div>
  );
}
