import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkPreviewView } from '@/components/pages/extensions/link-preview-view';

export type LinkPreviewOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkPreview: {
      setLinkPreview: (attrs: {
        href: string;
        title?: string;
        description?: string;
        image?: string;
        siteName?: string;
        loading?: boolean;
      }) => ReturnType;
    };
  }
}

export const LinkPreview = Node.create<LinkPreviewOptions>({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      href: { default: '' },
      title: { default: '' },
      description: { default: '' },
      image: { default: '' },
      siteName: { default: '' },
      loading: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-preview"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'link-preview',
        class: 'page-link-preview',
      }),
    ];
  },

  addCommands() {
    return {
      setLinkPreview:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewView);
  },
});
