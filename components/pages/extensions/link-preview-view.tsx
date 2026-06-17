'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Link2, Pencil, Trash2 } from 'lucide-react';
import { sanitizePreviewImageUrl } from '@/lib/link-preview-image';
import {
  fetchLinkPreview,
  normalizeLinkPreviewUrl,
} from '@/lib/link-preview-utils';

function hostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

export function LinkPreviewView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const href = (node.attrs.href as string) ?? '';
  const title = (node.attrs.title as string) ?? '';
  const description = (node.attrs.description as string) ?? '';
  const image = sanitizePreviewImageUrl((node.attrs.image as string) ?? '', href);
  const siteName = (node.attrs.siteName as string) ?? hostname(href);
  const loading = Boolean(node.attrs.loading);
  const fetchedHrefRef = useRef<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const loadPreview = useCallback(
    async (url: string, reset = false) => {
      if (reset) {
        updateAttributes({
          href: url,
          loading: true,
          title: hostname(url),
          description: '',
          image: '',
          siteName: hostname(url),
        });
      }

      try {
        const data = await fetchLinkPreview(url);
        updateAttributes({
          href: data.url,
          title: data.title,
          description: data.description,
          image: sanitizePreviewImageUrl(data.image, data.url),
          siteName: data.siteName,
          loading: false,
        });
      } catch {
        updateAttributes({
          href: url,
          loading: false,
          title: hostname(url),
          description: 'Preview unavailable',
          image: '',
          siteName: hostname(url),
        });
      }
    },
    [updateAttributes]
  );

  useEffect(() => {
    if (!loading || !href) return;
    if (fetchedHrefRef.current === href) return;
    fetchedHrefRef.current = href;
    void loadPreview(href);
  }, [loading, href, loadPreview]);

  const handleEdit = () => {
    const next = window.prompt('Edit link URL', href);
    if (next == null || !next.trim()) return;
    const normalized = normalizeLinkPreviewUrl(next);
    if (!normalized) return;
    fetchedHrefRef.current = null;
    void loadPreview(normalized, true);
  };

  const handleDelete = () => {
    deleteNode();
  };

  const handleOpen = () => {
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <NodeViewWrapper className="page-link-preview-wrap">
      <div
        className="page-link-preview-inner"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <a
          href={href}
          className="page-link-preview-card"
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
          data-type="link-preview"
          onClick={(e) => e.preventDefault()}
        >
          {image ? (
            <div className="page-link-preview-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" loading="lazy" />
            </div>
          ) : (
            <div className="page-link-preview-image page-link-preview-image--placeholder">
              <Link2 size={20} />
            </div>
          )}
          <div className="page-link-preview-body">
            <span className="page-link-preview-site">
              <ExternalLink size={12} />
              {siteName}
            </span>
            <span className="page-link-preview-title">
              {loading ? 'Loading preview…' : title || href}
            </span>
            {description ? (
              <span className="page-link-preview-desc">{description}</span>
            ) : null}
          </div>
        </a>

        <div className={`page-link-preview-actions ${hovered ? 'is-visible' : ''}`}>
          <button type="button" className="page-link-preview-action" onClick={handleOpen} title="Open link">
            <ExternalLink size={14} />
          </button>
          <button type="button" className="page-link-preview-action" onClick={handleEdit} title="Edit link">
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="page-link-preview-action page-link-preview-action--danger"
            onClick={handleDelete}
            title="Remove link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
