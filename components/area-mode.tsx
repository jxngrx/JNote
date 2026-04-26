'use client';

import { useAreaStore } from '@/lib/area-store';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

const Excalidraw: any = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw as any, {
  ssr: false,
});

function ensureExcalidrawAppState(appState: any) {
  const next = { ...(appState || {}) };
  // Excalidraw expects collaborators to be a Map; we don't persist it.
  next.collaborators = new Map();
  // Default to dark UI theme unless explicitly set.
  next.theme = next.theme || 'dark';
  return next;
}

function sanitizeAppStateForStorage(appState: any) {
  if (!appState) return {};
  // Remove non-serializable fields (notably collaborators Map).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { collaborators, ...rest } = appState as any;
  return rest;
}

export default function AreaMode() {
  const scenes = useAreaStore((state) => state.scenes);
  const activeSceneId = useAreaStore((state) => state.activeSceneId);
  const updateScene = useAreaStore((state) => state.updateScene);
  const [isClient, setIsClient] = useState(false);

  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const excalidrawApiRef = useRef<any>(null);
  const saveTimerRef = useRef<number | null>(null);
  const lastLoadedSceneIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initialData = useMemo(() => {
    if (!activeScene) return { elements: [], appState: {}, files: {} };

    const stored = activeScene.data?.excalidraw;
    if (stored?.elements) {
      return {
        elements: stored.elements,
        appState: ensureExcalidrawAppState(stored.appState),
        files: stored.files || {},
      };
    }

    // Migration: if the old scene has `imageData`, import it as an image element
    const legacyImage = (activeScene.data as any)?.imageData as string | null | undefined;
    if (legacyImage) {
      const fileId = `legacy_${activeScene.id}`;
      const imageElement = {
        id: `img_${activeScene.id}`,
        type: 'image',
        x: 100,
        y: 100,
        width: 800,
        height: 500,
        angle: 0,
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: 1,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        fileId,
        status: 'saved',
        scale: [1, 1],
      };

      const files = {
        [fileId]: {
          id: fileId,
          dataURL: legacyImage,
          mimeType: 'image/png',
          created: Date.now(),
          lastRetrieved: Date.now(),
        },
      };
      return { elements: [imageElement], appState: ensureExcalidrawAppState({}), files };
    }

    return { elements: [], appState: ensureExcalidrawAppState({}), files: {} };
  }, [activeSceneId, activeScene]);

  useEffect(() => {
    if (!excalidrawApiRef.current) return;
    if (!activeScene) return;
    if (lastLoadedSceneIdRef.current === activeScene.id) return;

    const stored = activeScene.data?.excalidraw;
    if (stored?.elements) {
      excalidrawApiRef.current.updateScene({
        elements: stored.elements,
        appState: ensureExcalidrawAppState(stored.appState),
        files: stored.files || {},
      });
    } else {
      excalidrawApiRef.current.updateScene(initialData);
    }
    lastLoadedSceneIdRef.current = activeScene.id;
  }, [activeSceneId, activeScene, initialData]);

  if (!isClient) {
    return (
      <div className="area-mode-empty">
        <div className="empty-content">
          <p className="text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activeScene) {
    return (
      <div className="area-mode-empty">
        <div className="empty-content">
          <p className="text-white/40">No scene selected</p>
          <button
            className="mt-4 settings-btn"
            onClick={() => {
              const createScene = useAreaStore.getState().createScene;
              createScene();
            }}
          >
            Create a new scene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="area-mode-container">
      <div className="area-canvas-wrapper">
        <Excalidraw
          excalidrawAPI={(api: any) => {
            excalidrawApiRef.current = api;
          }}
          theme="dark"
          initialData={initialData as any}
          onChange={(elements: readonly any[], appState: any, files: Record<string, any>) => {
            if (!activeScene) return;
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
            saveTimerRef.current = window.setTimeout(() => {
              updateScene(activeScene.id, {
                data: {
                  excalidraw: {
                    elements: elements as any[],
                    appState: sanitizeAppStateForStorage(appState),
                    files,
                  },
                },
              });
            }, 250);
          }}
        />
      </div>
    </div>
  );
}
