import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const listMarkerPluginKey = new PluginKey('listMarkerSync');

function syncListMarkers(root: HTMLElement) {
  root.querySelectorAll('ul:not([data-type="taskList"]) > li, ol > li').forEach((li) => {
    if (!(li instanceof HTMLElement)) return;
    const content =
      li.querySelector<HTMLElement>('p span[style*="font-size"], p span[style*="color"]') ??
      li.querySelector<HTMLElement>('p span') ??
      li.querySelector<HTMLElement>('p') ??
      li;

    const style = window.getComputedStyle(content);
    li.style.setProperty('--list-marker-color', style.color);
    li.style.setProperty('--list-marker-size', style.fontSize);
    li.style.setProperty('--list-marker-font', style.fontFamily);
    li.style.setProperty('--list-marker-lh', style.lineHeight);
  });
}

export const ListMarkerSync = Extension.create({
  name: 'listMarkerSync',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: listMarkerPluginKey,
        view(view) {
          const run = () => syncListMarkers(view.dom);
          run();
          return {
            update() {
              requestAnimationFrame(run);
            },
          };
        },
      }),
    ];
  },
});
