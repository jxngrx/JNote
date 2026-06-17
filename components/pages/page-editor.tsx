'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { Page, PageContentJson, PageViewMode } from '@/lib/types';
import { normalizePageFontId, getPageFontCss } from '@/lib/page-fonts';
import { usePageFontLoader } from '@/hooks/use-page-font-loader';
import { getPageEditorExtensions } from '@/lib/pages-editor-extensions';
import { createSlashSuggestionRender, setSlashMenuSelectedIndex, type SlashMenuState } from '@/components/pages/extensions/slash-command';
import { SlashMenu } from '@/components/pages/slash-menu';
import { PageBubbleMenu } from '@/components/pages/bubble-menu';
import { BlockHandle } from '@/components/pages/block-handle';
import { BlockContextMenu } from '@/components/pages/block-context-menu';
import { LineNumbersGutter } from '@/components/pages/line-numbers-gutter';
import {
  bumpPageFontSize,
  PAGE_FONT_SIZE_DEFAULT,
  PAGE_FONT_SIZE_STEP,
} from '@/lib/page-font-size';
import {
  createSelectionSlashNavigator,
  getSelectionClientRect,
} from '@/lib/slash-menu-navigator';

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
];

type SlashState = SlashMenuState;

const INITIAL_SLASH: SlashState = {
  active: false,
  query: '',
  range: null,
  items: [],
  selectedIndex: 0,
  clientRect: null,
  command: () => {},
  submenuPath: [],
  onBack: undefined,
};

type PageEditorProps = {
  page: Page;
  variant?: PageViewMode;
  onUpdate: (contentJson: PageContentJson) => void;
  onFocusChange?: (focused: boolean) => void;
  onEditorReady?: (editor: Editor | null) => void;
  onPageFontSizeChange?: (px: number) => void;
  className?: string;
};

function handleEditorKeyDown(
  view: Editor['view'],
  event: KeyboardEvent,
  editor: Editor,
  pageDefaultFontSize: number,
  onPageFontSizeChange?: (px: number) => void
) {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return false;

  if (event.key === 'b') {
    event.preventDefault();
    editor.chain().focus().toggleBold().run();
    return true;
  }
  if (event.key === 'i') {
    event.preventDefault();
    editor.chain().focus().toggleItalic().run();
    return true;
  }
  if (event.key === 'u') {
    event.preventDefault();
    editor.chain().focus().toggleUnderline().run();
    return true;
  }
  if (event.shiftKey && event.key === 'S') {
    event.preventDefault();
    editor.chain().focus().toggleStrike().run();
    return true;
  }
  if (event.key === 'e') {
    event.preventDefault();
    editor.chain().focus().toggleCode().run();
    return true;
  }
  if (event.key === 'k') {
    event.preventDefault();
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return true;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    return true;
  }
  if (event.shiftKey && event.key === '1') {
    event.preventDefault();
    editor.chain().focus().toggleHeading({ level: 1 }).run();
    return true;
  }
  if (event.shiftKey && event.key === '2') {
    event.preventDefault();
    editor.chain().focus().toggleHeading({ level: 2 }).run();
    return true;
  }
  if (event.shiftKey && event.key === '3') {
    event.preventDefault();
    editor.chain().focus().toggleHeading({ level: 3 }).run();
    return true;
  }
  if (event.shiftKey && event.key === '4') {
    event.preventDefault();
    editor.chain().focus().toggleTaskList().run();
    return true;
  }
  if (event.shiftKey && event.key === '8') {
    event.preventDefault();
    editor.chain().focus().toggleBulletList().run();
    return true;
  }
  if (event.shiftKey && event.key === '9') {
    event.preventDefault();
    editor.chain().focus().toggleOrderedList().run();
    return true;
  }
  if (
    event.shiftKey &&
    (event.key === '.' || event.key === '>' || event.code === 'Period')
  ) {
    event.preventDefault();
    bumpPageFontSize(editor, PAGE_FONT_SIZE_STEP, pageDefaultFontSize, (px) =>
      onPageFontSizeChange?.(px)
    );
    return true;
  }
  if (
    event.shiftKey &&
    (event.key === ',' || event.key === '<' || event.code === 'Comma')
  ) {
    event.preventDefault();
    bumpPageFontSize(editor, -PAGE_FONT_SIZE_STEP, pageDefaultFontSize, (px) =>
      onPageFontSizeChange?.(px)
    );
    return true;
  }
  if (event.key === 'Tab') {
    if (editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem')) {
      event.preventDefault();
      editor.chain().focus().sinkListItem('listItem').sinkListItem('taskItem').run();
      return true;
    }
  }
  if (event.shiftKey && event.key === 'Tab') {
    if (editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem')) {
      event.preventDefault();
      editor.chain().focus().liftListItem('listItem').liftListItem('taskItem').run();
      return true;
    }
  }
  return false;
}

function CodeBlockLanguageBar({ editor }: { editor: Editor }) {
  const isCodeBlock = editor.isActive('codeBlock');
  if (!isCodeBlock) return null;
  const language = (editor.getAttributes('codeBlock').language as string) || 'javascript';

  return (
    <div className="page-code-lang-bar">
      <select
        className="page-code-lang-select"
        value={language}
        onChange={(e) =>
          editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()
        }
        contentEditable={false}
      >
        {CODE_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function BlockTypeIndicator({ editor }: { editor: Editor }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    editor.on('selectionUpdate', bump);
    editor.on('focus', bump);
    editor.on('blur', bump);
    editor.on('transaction', bump);
    return () => {
      editor.off('selectionUpdate', bump);
      editor.off('focus', bump);
      editor.off('blur', bump);
      editor.off('transaction', bump);
    };
  }, [editor]);

  let label: string | null = null;
  if (editor.isActive('heading', { level: 1 })) label = 'Heading 1';
  else if (editor.isActive('heading', { level: 2 })) label = 'Heading 2';
  else if (editor.isActive('heading', { level: 3 })) label = 'Heading 3';
  else if (editor.isActive('blockquote')) label = 'Quote';
  else if (editor.isActive('codeBlock')) label = 'Code';
  else if (editor.isActive('taskList')) label = 'To-do list';
  else if (editor.isActive('bulletList')) label = 'Bullet list';
  else if (editor.isActive('orderedList')) label = 'Numbered list';
  else if (editor.isActive('callout')) label = 'Callout';

  if (!label || !editor.isFocused) return null;
  return <div className="page-block-type-indicator">{label}</div>;
}

export function PageEditor({
  page,
  variant = 'editor',
  onUpdate,
  onFocusChange,
  onEditorReady,
  onPageFontSizeChange,
  className,
}: PageEditorProps) {
  const [slashState, setSlashState] = useState<SlashState>(INITIAL_SLASH);
  const [selectionSlashState, setSelectionSlashState] = useState<SlashState>(INITIAL_SLASH);
  const pageIdRef = useRef(page.id);
  const loadedPageIdRef = useRef<string | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const selectionSlashNavRef = useRef<ReturnType<typeof createSelectionSlashNavigator> | null>(null);
  const selectionClientRectRef = useRef<(() => DOMRect | null) | null>(null);
  const fontId = normalizePageFontId(page.fontFamily);
  const pageDefaultFontSize = page.editorFontSize ?? PAGE_FONT_SIZE_DEFAULT;
  usePageFontLoader(fontId);
  const fontCss = getPageFontCss(fontId);
  const notebookFontSize = page.notebookSettings?.fontSize ?? 16;
  const onPageFontSizeChangeRef = useRef(onPageFontSizeChange);
  const pageDefaultFontSizeRef = useRef(pageDefaultFontSize);
  onPageFontSizeChangeRef.current = onPageFontSizeChange;
  pageDefaultFontSizeRef.current = pageDefaultFontSize;

  const slashSuggestion = useMemo(
    () =>
      createSlashSuggestionRender((state) => {
        setSlashState(state);
      }),
    []
  );

  const extensions = useMemo(() => getPageEditorExtensions(slashSuggestion), [slashSuggestion]);

  useEffect(() => {
    const nav = createSelectionSlashNavigator((item) => {
      const ed = editorRef.current;
      if (!ed || !item.run) return;
      item.run(ed);
    });
    nav.bind((navState) => {
      if (!navState) {
        setSelectionSlashState(INITIAL_SLASH);
        return;
      }
      setSelectionSlashState({
        active: true,
        query: navState.query,
        range: null,
        items: navState.items,
        selectedIndex: navState.selectedIndex,
        submenuPath: navState.submenuPath,
        clientRect: selectionClientRectRef.current,
        command: (item) => nav.selectItem(item),
        onBack: () => nav.goBack(),
      });
    });
    selectionSlashNavRef.current = nav;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: page.contentJson ?? undefined,
    editorProps: {
      attributes: {
        class: 'page-prosemirror',
        spellcheck: 'true',
      },
      handleKeyDown: (_view, event) => {
        const ed = editorRef.current;
        const nav = selectionSlashNavRef.current;
        if (!ed) return false;

        if (nav?.isActive()) {
          if (nav.handleKeyDown(event)) return true;
        }

        const mod = event.metaKey || event.ctrlKey;
        if (mod && event.key === '/') {
          const { empty, from, to } = ed.state.selection;
          if (!empty && to > from) {
            event.preventDefault();
            selectionClientRectRef.current = getSelectionClientRect(ed);
            nav?.open();
            return true;
          }
        }

        return handleEditorKeyDown(
          _view,
          event,
          ed,
          pageDefaultFontSizeRef.current,
          (px) => onPageFontSizeChangeRef.current?.(px)
        );
      },
    },
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getJSON() as PageContentJson);
    },
    onFocus: () => onFocusChange?.(true),
    onBlur: () => onFocusChange?.(false),
  });

  useEffect(() => {
    editorRef.current = editor ?? null;
    onEditorReady?.(editor ?? null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    if (loadedPageIdRef.current === page.id) return;
    loadedPageIdRef.current = page.id;
    pageIdRef.current = page.id;

    const applyContent = (json: PageContentJson) => {
      editor.commands.setContent(json);
    };

    if (page.contentJson && page.contentJson.type === 'doc') {
      applyContent(page.contentJson);
      return;
    }

    if (page.content?.trim()) {
      void import('@/lib/pages-migrate-client').then(({ migrateHtmlToJson, jsonToHtml }) => {
        const json = migrateHtmlToJson(page.content);
        applyContent(json);
        onUpdate(json);
      });
      return;
    }

    applyContent({ type: 'doc', content: [{ type: 'paragraph' }] });
  }, [editor, page.id, page.contentJson, page.content, onUpdate]);

  useEffect(() => {
    if (!editor) return;
    requestAnimationFrame(() => {
      editor.commands.focus('end');
    });
  }, [editor, page.id]);

  useEffect(() => {
    if (!editor) return;
    const syncSelectionMenu = () => {
      const nav = selectionSlashNavRef.current;
      if (!nav?.isActive()) return;
      const { empty } = editor.state.selection;
      if (empty) {
        nav.close();
        return;
      }
      selectionClientRectRef.current = getSelectionClientRect(editor);
      setSelectionSlashState((prev) =>
        prev.active ? { ...prev, clientRect: selectionClientRectRef.current } : prev
      );
    };
    editor.on('selectionUpdate', syncSelectionMenu);
    return () => {
      editor.off('selectionUpdate', syncSelectionMenu);
    };
  }, [editor]);

  useEffect(() => {
    if (!selectionSlashState.active) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.page-slash-menu')) return;
      selectionSlashNavRef.current?.close();
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [selectionSlashState.active]);

  const handleSlashHover = useCallback((index: number) => {
    setSlashMenuSelectedIndex(index);
    setSlashState((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  const handleSelectionSlashHover = useCallback((index: number) => {
    selectionSlashNavRef.current?.setSelectedIndex(index);
  }, []);

  if (!editor) return null;

  const activeSlashMenu = selectionSlashState.active ? selectionSlashState : slashState;
  const slashMenuVariant = selectionSlashState.active ? 'selection' : 'inline';
  const slashHoverHandler = selectionSlashState.active
    ? handleSelectionSlashHover
    : handleSlashHover;

  const showLineNumbers = page.showLineNumbers ?? false;

  return (
    <BlockContextMenu editor={editor}>
      <div
        className={[
          'page-editor-root',
          variant === 'notebook' ? 'page-editor-root--notebook' : '',
          showLineNumbers ? 'page-editor-root--line-numbers' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ['--page-editor-font' as string]: fontCss,
          ['--page-editor-font-size' as string]: `${pageDefaultFontSize}px`,
          ['--notebook-editor-font-size' as string]: `${notebookFontSize}px`,
        }}
      >
        <BlockTypeIndicator editor={editor} />
        <CodeBlockLanguageBar editor={editor} />
        <LineNumbersGutter editor={editor} enabled={showLineNumbers} />
        <BlockHandle editor={editor} />
        <EditorContent editor={editor} />
        <PageBubbleMenu editor={editor} />
        <SlashMenu
          active={activeSlashMenu.active}
          items={activeSlashMenu.items}
          selectedIndex={activeSlashMenu.selectedIndex}
          query={activeSlashMenu.query}
          clientRect={activeSlashMenu.clientRect}
          submenuPath={activeSlashMenu.submenuPath}
          variant={slashMenuVariant}
          onSelect={activeSlashMenu.command}
          onHover={slashHoverHandler}
          onBack={activeSlashMenu.onBack}
        />
      </div>
    </BlockContextMenu>
  );
}
