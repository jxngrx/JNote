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
      href: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-href') ?? '',
        renderHTML: (attributes) =>
          attributes.href ? { 'data-href': attributes.href } : {},
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') ?? '',
        renderHTML: (attributes) =>
          attributes.title ? { 'data-title': attributes.title } : {},
      },
      description: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-description') ?? '',
        renderHTML: (attributes) =>
          attributes.description ? { 'data-description': attributes.description } : {},
      },
      image: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-image') ?? '',
        renderHTML: (attributes) =>
          attributes.image ? { 'data-image': attributes.image } : {},
      },
      siteName: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-site-name') ?? '',
        renderHTML: (attributes) =>
          attributes.siteName ? { 'data-site-name': attributes.siteName } : {},
      },
      loading: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-preview"]',
        getAttrs: (element) => ({
          href: element.getAttribute('data-href') ?? '',
          title: element.getAttribute('data-title') ?? '',
          description: element.getAttribute('data-description') ?? '',
          image: element.getAttribute('data-image') ?? '',
          siteName: element.getAttribute('data-site-name') ?? '',
          loading: false,
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const href = (node.attrs.href as string) ?? '';
    const title = (node.attrs.title as string) ?? '';
    const description = (node.attrs.description as string) ?? '';
    const image = (node.attrs.image as string) ?? '';
    const siteName = (node.attrs.siteName as string) ?? '';

    const imageBlock = image
      ? ['div', { class: 'page-link-preview-image' }, ['img', { src: image, alt: '' }]]
      : ['div', { class: 'page-link-preview-image page-link-preview-image--placeholder' }];

    const bodyChildren: unknown[] = [
      ['span', { class: 'page-link-preview-site' }, siteName || 'Link'],
      ['span', { class: 'page-link-preview-title' }, title || href || 'Link preview'],
    ];

    if (description) {
      bodyChildren.push(['span', { class: 'page-link-preview-desc' }, description]);
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'link-preview',
        class: 'page-link-preview-wrap',
      }),
      [
        'div',
        { class: 'page-link-preview-inner' },
        [
          'a',
          {
            class: 'page-link-preview-card',
            href: href || '#',
            rel: 'noopener noreferrer',
          },
          imageBlock,
          ['div', { class: 'page-link-preview-body' }, ...bodyChildren],
        ],
      ],
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
