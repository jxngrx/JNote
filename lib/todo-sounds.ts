'use client';

import {
  playTodoCustomSound,
  type TodoCustomSoundSlot,
} from '@/lib/todo-custom-sounds-db';
import type { TodoSoundSettings } from '@/lib/todo-settings-store';

export type TodoCompleteSoundPreset = 'chime' | 'pop' | 'success' | 'none';
export type TodoMoveSoundPreset = 'whoosh' | 'slide' | 'tap' | 'none';

const BUILTIN_GAIN = 0.2;
const CUSTOM_VOLUME = 0.92;

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
  gain = BUILTIN_GAIN
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

export function playBuiltInCompleteSound(preset: TodoCompleteSoundPreset) {
  const ctx = getAudioContext();
  if (!ctx || preset === 'none') return;
  const t = ctx.currentTime;

  if (preset === 'chime') {
    playTone(523.25, t, 0.18, 'sine', 0.18);
    playTone(659.25, t + 0.08, 0.22, 'sine', 0.16);
    playTone(783.99, t + 0.16, 0.28, 'sine', 0.14);
    return;
  }

  if (preset === 'pop') {
    playTone(880, t, 0.08, 'triangle', 0.22);
    playTone(1320, t + 0.04, 0.06, 'sine', 0.16);
    return;
  }

  playTone(392, t, 0.12, 'sine', 0.18);
  playTone(523.25, t + 0.1, 0.14, 'sine', 0.16);
  playTone(659.25, t + 0.2, 0.22, 'triangle', 0.14);
}

export function playBuiltInMoveSound(preset: TodoMoveSoundPreset) {
  const ctx = getAudioContext();
  if (!ctx || preset === 'none') return;
  const t = ctx.currentTime;

  if (preset === 'whoosh') {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(420, t);
    oscillator.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.16);
    return;
  }

  if (preset === 'slide') {
    playTone(280, t, 0.1, 'triangle', 0.14);
    playTone(360, t + 0.06, 0.08, 'triangle', 0.12);
    return;
  }

  playTone(640, t, 0.05, 'square', 0.12);
}

function usesCustomComplete(settings: TodoSoundSettings) {
  return Boolean(settings.completeSoundCustomName);
}

function usesCustomMove(settings: TodoSoundSettings) {
  return Boolean(settings.moveSoundCustomName);
}

export function playTodoCompleteSound(settings: TodoSoundSettings) {
  if (!settings.soundsEnabled) return;

  if (usesCustomComplete(settings)) {
    void playTodoCustomSound('complete', CUSTOM_VOLUME);
    return;
  }

  playBuiltInCompleteSound(settings.completeSound);
}

export function playTodoMoveSound(settings: TodoSoundSettings) {
  if (!settings.soundsEnabled) return;

  if (usesCustomMove(settings)) {
    void playTodoCustomSound('move', CUSTOM_VOLUME);
    return;
  }

  playBuiltInMoveSound(settings.moveSound);
}

export function previewTodoCompleteSound(settings: TodoSoundSettings) {
  playTodoCompleteSound({ ...settings, soundsEnabled: true });
}

export function previewTodoMoveSound(settings: TodoSoundSettings) {
  playTodoMoveSound({ ...settings, soundsEnabled: true });
}

export function previewBuiltInCompleteSound(preset: TodoCompleteSoundPreset) {
  playBuiltInCompleteSound(preset);
}

export function previewBuiltInMoveSound(preset: TodoMoveSoundPreset) {
  playBuiltInMoveSound(preset);
}

export async function previewTodoCustomSound(slot: TodoCustomSoundSlot) {
  await playTodoCustomSound(slot, CUSTOM_VOLUME);
}
