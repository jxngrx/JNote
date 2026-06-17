'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ensurePageFontLoaded, getPageFontCss, normalizePageFontId } from '@/lib/page-fonts';

export type PagePdfExportOptions = {
  watermark?: boolean;
};

type ExportPagePdfInput = {
  title: string;
  html: string;
  fontFamily?: string | null;
  watermark?: boolean;
};

const PDF_SITE_URL = 'https://jxngrx.com';
const PDF_SITE_LABEL = 'JNote.jxngrx.com';

const PDF_THEME = {
  text: '#1a1a1a',
  textSecondary: '#6b6965',
  border: '#d8d6d2',
  surface2: '#edecea',
  blue: '#2c6edb',
};

const PDF_LAYOUT = {
  marginTop: 52,
  marginRight: 44,
  marginBottom: 56,
  marginLeft: 44,
  headerBand: 22,
  footerBand: 26,
};

const FALLBACK_FONT = "'DM Sans', sans-serif";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizePageFilename(title: string) {
  const base = (title.trim() || 'untitled')
    .toLowerCase()
    .replace(/[^\w\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'untitled';
}

function resolveFontFamily(fontFamily: string) {
  const css = getPageFontCss(fontFamily);
  if (!css.startsWith('var(')) return css;

  const probe = document.createElement('span');
  probe.style.fontFamily = css;
  probe.style.position = 'fixed';
  probe.style.opacity = '0';
  probe.textContent = 'A';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily || FALLBACK_FONT;
  document.body.removeChild(probe);
  return resolved;
}

function buildPdfStyles(fontFamily: string) {
  const fontCss = resolveFontFamily(fontFamily);

  return `
    * { box-sizing: border-box; }
    .pdf-export {
      font-family: ${fontCss};
      color: ${PDF_THEME.text};
      font-size: 14px;
      line-height: 1.65;
      background: #ffffff;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .pdf-export-title {
      margin: 0 0 24px;
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content > * + * { margin-top: 0.5em; }
    .pdf-export-content h1 {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-top: 1.1em;
      line-height: 1.2;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content h2 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-top: 1em;
      line-height: 1.25;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content h3 {
      font-size: 17px;
      font-weight: 600;
      margin-top: 0.85em;
      line-height: 1.3;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content p {
      margin: 0.35em 0;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content blockquote {
      border-left: 3px solid ${PDF_THEME.border};
      padding-left: 14px;
      color: ${PDF_THEME.textSecondary};
      margin: 0.8em 0;
    }
    .pdf-export-content ul,
    .pdf-export-content ol {
      margin: 0.35em 0;
      padding-left: 1.4em;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content li { margin: 0.15em 0; }
    .pdf-export-content hr {
      border: none;
      border-top: 1px solid ${PDF_THEME.border};
      margin: 1.2em 0;
    }
    .pdf-export-content code {
      font-family: 'DM Mono', ui-monospace, monospace;
      font-size: 0.9em;
      background: ${PDF_THEME.surface2};
      color: ${PDF_THEME.text};
      padding: 2px 6px;
      border-radius: 6px;
    }
    .pdf-export-content pre {
      background: ${PDF_THEME.surface2};
      border: 1px solid ${PDF_THEME.border};
      border-radius: 10px;
      padding: 14px;
      overflow-x: auto;
      font-family: 'DM Mono', ui-monospace, monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content pre code {
      background: none;
      padding: 0;
    }
    .pdf-export-content a {
      color: ${PDF_THEME.blue};
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .pdf-export-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 0.6em 0;
      display: block;
    }
    .pdf-export-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0;
      font-size: 13px;
      table-layout: fixed;
    }
    .pdf-export-content th,
    .pdf-export-content td {
      border: 1px solid ${PDF_THEME.border};
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
      color: ${PDF_THEME.text};
      word-break: break-word;
    }
    .pdf-export-content th {
      background: ${PDF_THEME.surface2};
      font-weight: 600;
    }
    .pdf-export-content ul[data-type='taskList'] {
      list-style: none;
      padding-left: 0;
    }
    .pdf-export-content ul[data-type='taskList'] li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .pdf-export-content .page-link-preview-wrap {
      margin: 0.75em 0;
    }
    .pdf-export-content .page-link-preview-inner {
      display: block;
    }
    .pdf-export-content .page-link-preview-card {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0;
      overflow: hidden;
      border: 1px solid ${PDF_THEME.border};
      border-radius: 12px;
      background: #ffffff;
      text-decoration: none;
      color: inherit;
      min-width: 0;
    }
    .pdf-export-content .page-link-preview-image {
      min-height: 96px;
      background: ${PDF_THEME.surface2};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .pdf-export-content .page-link-preview-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      min-height: 96px;
      margin: 0;
      border: none;
      border-radius: 0;
    }
    .pdf-export-content .page-link-preview-image--placeholder {
      color: ${PDF_THEME.textSecondary};
    }
    .pdf-export-content .page-link-preview-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 14px;
      min-width: 0;
    }
    .pdf-export-content .page-link-preview-site {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${PDF_THEME.textSecondary};
    }
    .pdf-export-content .page-link-preview-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      color: ${PDF_THEME.text};
    }
    .pdf-export-content .page-link-preview-desc {
      font-size: 12px;
      line-height: 1.45;
      color: ${PDF_THEME.textSecondary};
    }
  `;
}

async function waitForFonts() {
  if (typeof document === 'undefined' || !document.fonts?.ready) return;
  await document.fonts.ready.catch(() => undefined);
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function inlineRemoteImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;

      try {
        const dataUrl = await loadImageAsDataUrl(src);
        img.setAttribute('src', dataUrl);
      } catch {
        // Keep original src; html2canvas may still render if CORS allows.
        img.crossOrigin = 'anonymous';
      }
    })
  );
}

function createExportRoot(title: string, html: string, fontId: string) {
  const shell = document.createElement('div');
  shell.setAttribute('data-pdf-export-root', 'true');
  shell.style.position = 'fixed';
  shell.style.left = '-10000px';
  shell.style.top = '0';
  shell.style.width = '706px';
  shell.style.padding = '0';
  shell.style.margin = '0';
  shell.style.zIndex = '1';
  shell.style.opacity = '1';
  shell.style.visibility = 'visible';
  shell.style.pointerEvents = 'none';
  shell.style.background = '#ffffff';

  shell.innerHTML = `
    <style>${buildPdfStyles(fontId)}</style>
    <article class="pdf-export" style="padding: 32px 28px; background: #ffffff;">
      <h1 class="pdf-export-title">${escapeHtml(title.trim() || 'Untitled')}</h1>
      <div class="pdf-export-content">${html}</div>
    </article>
  `;

  document.body.appendChild(shell);
  return shell.querySelector('article.pdf-export') as HTMLElement;
}

function drawPdfHeader(
  pdf: jsPDF,
  title: string,
  pageNumber: number,
  totalPages: number
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const { marginLeft, marginRight, marginTop, headerBand } = PDF_LAYOUT;
  const ruleY = marginTop + headerBand - 6;

  pdf.setDrawColor(216, 214, 210);
  pdf.setLineWidth(0.6);
  pdf.line(marginLeft, ruleY, pageWidth - marginRight, ruleY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 105, 101);

  const headerTitle = (title.trim() || 'Untitled').slice(0, 72);
  pdf.text(headerTitle, marginLeft, marginTop + 12);
  pdf.text(`${pageNumber} / ${totalPages}`, pageWidth - marginRight, marginTop + 12, {
    align: 'right',
  });
}

function drawPdfFooter(pdf: jsPDF, withWatermark: boolean) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { marginLeft, marginRight, marginBottom } = PDF_LAYOUT;
  const ruleY = pageHeight - marginBottom - 8;
  const textY = pageHeight - marginBottom + 10;

  pdf.setDrawColor(216, 214, 210);
  pdf.setLineWidth(0.6);
  pdf.line(marginLeft, ruleY, pageWidth - marginRight, ruleY);

  if (!withWatermark) return;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(107, 105, 101);

  const prefix = 'Created by ';
  pdf.text(prefix, marginLeft, textY);

  const prefixWidth = pdf.getTextWidth(prefix);
  pdf.setTextColor(44, 110, 219);
  pdf.textWithLink(PDF_SITE_LABEL, marginLeft + prefixWidth, textY, {
    url: PDF_SITE_URL,
  });
}

function sliceCanvasPage(
  source: HTMLCanvasElement,
  offsetPt: number,
  sliceHeightPt: number,
  ptPerPixel: number
) {
  const startPx = Math.max(0, Math.floor(offsetPt / ptPerPixel));
  const sliceHeightPx = Math.min(
    Math.ceil(sliceHeightPt / ptPerPixel),
    source.height - startPx
  );

  if (sliceHeightPx <= 0) {
    return { dataUrl: '', heightPt: 0 };
  }

  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = sliceHeightPx;

  const ctx = slice.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', heightPt: 0 };
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, slice.width, slice.height);
  ctx.drawImage(
    source,
    0,
    startPx,
    source.width,
    sliceHeightPx,
    0,
    0,
    source.width,
    sliceHeightPx
  );

  return {
    dataUrl: slice.toDataURL('image/png'),
    heightPt: sliceHeightPx * ptPerPixel,
  };
}

function paintPageMargins(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { marginTop, marginBottom, headerBand, footerBand } = PDF_LAYOUT;
  const contentTop = marginTop + headerBand;
  const footerTop = pageHeight - marginBottom - footerBand;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, contentTop, 'F');
  pdf.rect(0, footerTop, pageWidth, pageHeight - footerTop, 'F');
}

function canvasToPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
  withWatermark: boolean
) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { marginLeft, marginRight, marginTop, marginBottom, headerBand, footerBand } =
    PDF_LAYOUT;

  const contentTop = marginTop + headerBand;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight =
    pageHeight - marginTop - marginBottom - headerBand - footerBand;

  const ptPerPixel = contentWidth / canvas.width;
  const imgHeight = canvas.height * ptPerPixel;
  const totalPages = Math.max(1, Math.ceil(imgHeight / contentHeight));

  let offsetPt = 0;
  let pageIndex = 0;

  while (offsetPt < imgHeight && pageIndex < totalPages) {
    if (pageIndex > 0) pdf.addPage();

    paintPageMargins(pdf);
    drawPdfHeader(pdf, title, pageIndex + 1, totalPages);

    const remainingPt = imgHeight - offsetPt;
    const sliceHeightPt = Math.min(contentHeight, remainingPt);
    const slice = sliceCanvasPage(canvas, offsetPt, sliceHeightPt, ptPerPixel);

    if (slice.dataUrl && slice.heightPt > 0) {
      pdf.addImage(
        slice.dataUrl,
        'PNG',
        marginLeft,
        contentTop,
        contentWidth,
        slice.heightPt
      );
    }

    drawPdfFooter(pdf, withWatermark);

    offsetPt += contentHeight;
    pageIndex += 1;
  }

  pdf.save(filename);
}

export async function exportPageToPdf({
  title,
  html,
  fontFamily,
  watermark = true,
}: ExportPagePdfInput): Promise<void> {
  const trimmedHtml = html.trim();
  if (!trimmedHtml) {
    throw new Error('Page is empty.');
  }

  const fontId = normalizePageFontId(fontFamily);
  ensurePageFontLoaded(fontId);
  await waitForFonts();

  const article = createExportRoot(title, trimmedHtml, fontId);
  const shell = article.parentElement as HTMLElement;

  try {
    await inlineRemoteImages(article);
    await waitForImages(article);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const canvas = await html2canvas(article, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: article.scrollWidth,
      height: article.scrollHeight,
      windowWidth: article.scrollWidth,
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('PDF render produced empty canvas.');
    }

    const baseName = sanitizePageFilename(title);
    const filename = watermark ? `${baseName}.pdf` : `${baseName}-no-watermark.pdf`;
    canvasToPdf(canvas, filename, title, watermark);
  } finally {
    shell.remove();
  }
}
