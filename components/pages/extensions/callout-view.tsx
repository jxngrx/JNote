'use client';

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const EMOJI_OPTIONS = ['💡', '⚠️', '✅', '❌', '📝', '🎯', '🔥', '💬'];

export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const emoji = (node.attrs.emoji as string) ?? '💡';

  return (
    <NodeViewWrapper className="page-callout-wrap">
      <div className="page-callout" data-type="callout">
        <div className="page-callout-emoji-wrap">
          <select
            className="page-callout-emoji"
            value={emoji}
            onChange={(e) => updateAttributes({ emoji: e.target.value })}
            aria-label="Callout icon"
            contentEditable={false}
          >
            {EMOJI_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <NodeViewContent className="page-callout-content" />
      </div>
    </NodeViewWrapper>
  );
}
