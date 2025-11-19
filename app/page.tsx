'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/lib/store';
import Canvas from '@/components/canvas';
import Toolbar from '@/components/toolbar';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const loadFromStorage = useCanvasStore((state) => state.loadFromStorage);

  useEffect(() => {
    setIsClient(true);
    loadFromStorage();
  }, [loadFromStorage]);

  if (!isClient) {
    return null; // Prevents hydration mismatch
  }

  return (
    <main className="canvas-container">
      <Canvas />
      <Toolbar />
    </main>
  );
}
