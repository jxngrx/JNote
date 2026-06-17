import { Extension } from '@tiptap/core';
import { textblockTypeInputRule, wrappingInputRule } from '@tiptap/core';

export const MarkdownInputRules = Extension.create({
  name: 'markdownInputRules',

  addInputRules() {
    const { bulletList, orderedList, taskList, blockquote, heading, codeBlock, horizontalRule } =
      this.editor.schema.nodes;

    return [
      textblockTypeInputRule({
        find: /^#\s$/,
        type: heading,
        getAttributes: () => ({ level: 1 }),
      }),
      textblockTypeInputRule({
        find: /^##\s$/,
        type: heading,
        getAttributes: () => ({ level: 2 }),
      }),
      textblockTypeInputRule({
        find: /^###\s$/,
        type: heading,
        getAttributes: () => ({ level: 3 }),
      }),
      wrappingInputRule({
        find: /^>\s$/,
        type: blockquote,
      }),
      wrappingInputRule({
        find: /^[-*+]\s$/,
        type: bulletList,
      }),
      wrappingInputRule({
        find: /^\.\s$/,
        type: bulletList,
      }),
      wrappingInputRule({
        find: /^\d+\.\s$/,
        type: orderedList,
      }),
      wrappingInputRule({
        find: /^\d+\)\s$/,
        type: orderedList,
      }),
      wrappingInputRule({
        find: /^\[\]\s$/,
        type: taskList,
      }),
      wrappingInputRule({
        find: /^\[ \]\s$/,
        type: taskList,
      }),
      wrappingInputRule({
        find: /^\[[xX]\]\s$/,
        type: taskList,
      }),
      textblockTypeInputRule({
        find: /^```$/,
        type: codeBlock,
        getAttributes: () => ({ language: 'javascript' }),
      }),
      textblockTypeInputRule({
        find: /^---$/,
        type: horizontalRule,
      }),
    ];
  },
});
