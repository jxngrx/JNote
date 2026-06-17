'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import './todo-celebration-effects.css';

const GLOW_DURATION_MS = 1800;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTodoCelebration() {
  const [glowActive, setGlowActive] = useState(false);
  const [glowKey, setGlowKey] = useState(0);
  const glowTimerRef = useRef<number | null>(null);

  const triggerProgressGlow = useCallback(() => {
    if (prefersReducedMotion()) return;

    if (glowTimerRef.current) {
      window.clearTimeout(glowTimerRef.current);
    }

    setGlowKey((key) => key + 1);
    setGlowActive(true);

    glowTimerRef.current = window.setTimeout(() => {
      setGlowActive(false);
      glowTimerRef.current = null;
    }, GLOW_DURATION_MS);
  }, []);

  const triggerDoneConfetti = useCallback(() => {
    if (prefersReducedMotion()) return;

    const colors = ['#4ade80', '#22c55e', '#86efac', '#ff9800', '#fbbf24', '#ffffff'];
    const duration = 2400;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 62,
        spread: 62,
        origin: { x: 0.02, y: 1 },
        colors,
        ticks: 220,
        gravity: 0.9,
        scalar: 1.15,
        drift: 0.4,
        startVelocity: 52,
      });
      confetti({
        particleCount: 5,
        angle: 118,
        spread: 62,
        origin: { x: 0.98, y: 1 },
        colors,
        ticks: 220,
        gravity: 0.9,
        scalar: 1.15,
        drift: -0.4,
        startVelocity: 52,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    window.setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 110,
        origin: { x: 0.5, y: 0.62 },
        colors,
        scalar: 1.05,
        startVelocity: 38,
      });
    }, 520);
  }, []);

  useEffect(
    () => () => {
      if (glowTimerRef.current) {
        window.clearTimeout(glowTimerRef.current);
      }
    },
    []
  );

  return { glowActive, glowKey, triggerProgressGlow, triggerDoneConfetti };
}

type TodoCelebrationOverlayProps = {
  glowActive: boolean;
  glowKey: number;
};

export default function TodoCelebrationOverlay({
  glowActive,
  glowKey,
}: TodoCelebrationOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {glowActive && (
        <motion.div
          key={glowKey}
          className="todo-edge-glow-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.45, 0] }}
          exit={{ opacity: 0 }}
          transition={{
            duration: GLOW_DURATION_MS / 1000,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.15, 0.45, 1],
          }}
          aria-hidden
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
