'use client';

import confetti from 'canvas-confetti';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.16
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export function playPomodoroCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(523.25, t, 0.2, 'sine', 0.18);
  playTone(659.25, t + 0.1, 0.24, 'sine', 0.16);
  playTone(783.99, t + 0.2, 0.28, 'triangle', 0.14);
  playTone(1046.5, t + 0.32, 0.36, 'sine', 0.12);
}

export function triggerPomodoroCelebration() {
  if (prefersReducedMotion()) {
    playPomodoroCompleteSound();
    return;
  }

  playPomodoroCompleteSound();

  const colors = ['#d97757', '#f3f0ea', '#2c6edb', '#e8a87c', '#ffffff'];
  const duration = 2600;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 58,
      origin: { x: 0.08, y: 0.75 },
      colors,
      ticks: 200,
      gravity: 0.85,
      scalar: 1.1,
      startVelocity: 48,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 58,
      origin: { x: 0.92, y: 0.75 },
      colors,
      ticks: 200,
      gravity: 0.85,
      scalar: 1.1,
      startVelocity: 48,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();

  window.setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.55 },
      colors,
      scalar: 1.05,
      startVelocity: 36,
    });
  }, 480);
}
