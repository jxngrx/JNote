'use client';

import { useAreaStore } from '@/lib/area-store';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, Upload, Trash2, X, Eraser, Pen } from 'lucide-react';

export default function AreaMode() {
  const scenes = useAreaStore((state) => state.scenes);
  const activeSceneId = useAreaStore((state) => state.activeSceneId);
  const updateScene = useAreaStore((state) => state.updateScene);
  const deleteScene = useAreaStore((state) => state.deleteScene);
  const setActiveScene = useAreaStore((state) => state.setActiveScene);
  const [isClient, setIsClient] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [color, setColor] = useState('#FFFFFF');
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-create scene if none exist
  useEffect(() => {
    if (scenes.length === 0 && isClient) {
      const createScene = useAreaStore.getState().createScene;
      createScene();
    }
  }, [scenes.length, isClient]);

  // Initialize main canvas with high DPI support
  useEffect(() => {
    if (!canvasRef.current || !activeScene || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        requestAnimationFrame(resizeCanvas);
        return;
      }

      // Get device pixel ratio for high DPI displays
      const dpr = window.devicePixelRatio || 1;

      // Calculate display size and internal size
      const displayWidth = width;
      const displayHeight = height;
      const internalWidth = width * dpr;
      const internalHeight = height * dpr;

      // Only resize if dimensions changed
      if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
        const hadContent = canvas.width > 0 && canvas.height > 0;
        let savedImage: ImageData | null = null;

        if (hadContent) {
          try {
            const oldCtx = canvas.getContext('2d');
            if (oldCtx) {
              savedImage = oldCtx.getImageData(0, 0, canvas.width, canvas.height);
            }
          } catch (e) {
            console.warn('Could not save canvas:', e);
          }
        }

        // Set CSS size (display size)
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Set internal size (high DPI)
        canvas.width = internalWidth;
        canvas.height = internalHeight;

        // Get fresh context after resize
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        contextRef.current = ctx;

        // Scale context to match device pixel ratio
        ctx.scale(dpr, dpr);

        // Set background
        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Restore saved image or load from scene
        if (savedImage) {
          try {
            // Scale saved image if needed
            const oldDpr = savedImage.width / displayWidth;
            if (oldDpr !== dpr) {
              // Need to scale the image
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = savedImage.width;
              tempCanvas.height = savedImage.height;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.putImageData(savedImage, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);
              }
            } else {
              ctx.putImageData(savedImage, 0, 0);
            }
          } catch (e) {
            console.warn('Could not restore canvas:', e);
          }
        } else {
          const imageData = activeScene.data.imageData;
          if (imageData) {
            const img = new Image();
            img.onload = () => {
              if (contextRef.current && canvasRef.current) {
                const ctx = contextRef.current;
                ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
              }
            };
            img.onerror = () => {
              console.warn('Could not load image');
            };
            img.src = imageData;
          }
        }
      } else {
        // Canvas size hasn't changed, just ensure context ref is set
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.scale(dpr, dpr);
          contextRef.current = ctx;
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [activeScene?.id]);

  // Initialize cursor canvas - must match drawing canvas size exactly with high DPI
  useEffect(() => {
    if (!cursorCanvasRef.current || !canvasRef.current || !containerRef.current) return;

    const cursorCanvas = cursorCanvasRef.current;
    const drawingCanvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = cursorCanvas.getContext('2d');
    if (!ctx) return;

    cursorContextRef.current = ctx;

    const resizeCursor = () => {
      // Match the drawing canvas dimensions exactly
      const drawingRect = drawingCanvas.getBoundingClientRect();
      const displayWidth = drawingRect.width;
      const displayHeight = drawingRect.height;

      if (displayWidth === 0 || displayHeight === 0) {
        requestAnimationFrame(resizeCursor);
        return;
      }

      // Get device pixel ratio for high DPI
      const dpr = window.devicePixelRatio || 1;
      const internalWidth = displayWidth * dpr;
      const internalHeight = displayHeight * dpr;

      // Set CSS size (display size)
      cursorCanvas.style.width = `${displayWidth}px`;
      cursorCanvas.style.height = `${displayHeight}px`;

      // Set internal size (high DPI)
      cursorCanvas.width = internalWidth;
      cursorCanvas.height = internalHeight;

      // Scale context to match device pixel ratio
      ctx.scale(dpr, dpr);
    };

    resizeCursor();
    window.addEventListener('resize', resizeCursor);

    return () => {
      window.removeEventListener('resize', resizeCursor);
    };
  }, []);

  // Update cursor indicator
  useEffect(() => {
    if (!cursorContextRef.current || !cursorCanvasRef.current) return;

    const ctx = cursorContextRef.current;
    const canvas = cursorCanvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!cursorPos) return;

    const size = tool === 'eraser' ? eraserWidth : lineWidth;

    // Draw outer circle with border
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(255, 50, 50, 1)' : 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, size / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(255, 150, 150, 0.8)' : 'rgba(200, 200, 200, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw center crosshair
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(255, 100, 100, 1)' : 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorPos.x - 8, cursorPos.y);
    ctx.lineTo(cursorPos.x + 8, cursorPos.y);
    ctx.moveTo(cursorPos.x, cursorPos.y - 8);
    ctx.lineTo(cursorPos.x, cursorPos.y + 8);
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? 'rgba(255, 50, 50, 1)' : 'rgba(255, 255, 255, 1)';
    ctx.fill();
  }, [cursorPos, tool, lineWidth, eraserWidth]);

  // Save canvas
  const saveCanvas = useCallback(() => {
    if (!canvasRef.current || !activeScene) return;
    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      updateScene(activeScene.id, {
        data: {
          ...activeScene.data,
          imageData,
        },
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  }, [activeScene, updateScene]);

  // Get canvas coordinates from mouse/touch event (accounting for high DPI)
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate position relative to canvas (in display pixels)
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Context is already scaled by devicePixelRatio, so we use display coordinates
    // The context.scale() handles the high DPI conversion
    return {
      x: x,
      y: y,
    };
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    e.preventDefault();
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Update context ref
    contextRef.current = ctx;

    const { x, y } = getCanvasCoordinates(e);

    // Set drawing style - ensure these are set every time
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = eraserWidth;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Start new path
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Update context ref
    contextRef.current = ctx;

    const { x, y } = getCanvasCoordinates(e);

    // Set styles before continuing path (must be set before lineTo)
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = eraserWidth;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Continue drawing - lineTo continues the current path
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvas();
    }
  }, [isDrawing, saveCanvas]);

  // Handle mouse move for cursor - use same coordinate calculation as drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Use the same coordinate calculation as getCanvasCoordinates
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate position in screen coordinates (for cursor canvas)
    // This should match the display size, not the internal canvas size
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set cursor position in screen coordinates (cursor canvas uses display size)
    setCursorPos({
      x: x,
      y: y,
    });

    if (isDrawing) {
      draw(e);
    }
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${activeScene?.title || 'drawing'}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvasRef.current || !contextRef.current) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (contextRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            contextRef.current.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveCanvas();
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDelete = () => {
    if (!activeScene || scenes.length <= 1) return;
    if (window.confirm(`Are you sure you want to delete "${activeScene.title}"?`)) {
      deleteScene(activeScene.id);
    }
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current || !contextRef.current || !activeScene) return;

    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      ctx.fillStyle = '#0c0c0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      updateScene(activeScene.id, {
        data: {
          ...activeScene.data,
          imageData: null,
        },
      });
    }
  };

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
        </div>
      </div>
    );
  }

  return (
    <div className="area-mode-container">
      {/* Toolbar */}
      <div className="area-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => setTool('pen')}
            className={`toolbar-btn ${tool === 'pen' ? 'active' : ''}`}
            title="Pen"
          >
            <Pen size={16} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`toolbar-btn ${tool === 'eraser' ? 'active' : ''}`}
            title="Eraser"
          >
            <Eraser size={16} />
          </button>
          <div className="toolbar-divider" />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="toolbar-color"
            title="Color"
            disabled={tool === 'eraser'}
          />
          {tool === 'pen' ? (
            <>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="toolbar-slider"
                title="Pen Size"
              />
              <span className="toolbar-size-label">{lineWidth}px</span>
            </>
          ) : (
            <>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserWidth}
                onChange={(e) => setEraserWidth(Number(e.target.value))}
                className="toolbar-slider"
                title="Eraser Size"
              />
              <span className="toolbar-size-label">{eraserWidth}px</span>
            </>
          )}
          <div className="toolbar-divider" />
          <button
            onClick={handleClearCanvas}
            className="toolbar-btn hover:text-red-400"
            title="Clear Canvas"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleExport}
            className="toolbar-btn"
            title="Export"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleImport}
            className="toolbar-btn"
            title="Import"
          >
            <Upload size={16} />
          </button>
          {scenes.length > 1 && (
            <button
              onClick={handleDelete}
              className="toolbar-btn hover:text-red-400"
              title="Delete Scene"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        className="area-canvas-wrapper"
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={() => {
            stopDrawing();
            setCursorPos(null);
          }}
          onTouchStart={startDrawing}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={stopDrawing}
        />
        <canvas
          ref={cursorCanvasRef}
          className="cursor-canvas"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
}
