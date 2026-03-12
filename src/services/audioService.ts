/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Word } from '../types';
import { storageService } from './storageService';

/**
 * Play a Base64 audio data URL. Silent no-op if invalid or missing.
 */
export function playBase64Audio(base64: string): void {
  if (storageService.getMuted()) return;
  try {
    const audio = new Audio(base64);
    audio.play().catch(() => {}); // Ignore autoplay policy errors silently
  } catch {
    // Ignore any construction errors
  }
}

/**
 * Pre-build an Audio object map for only the words in the current game session.
 * Fetches audio from IndexedDB — audio is NOT stored on the word object itself.
 * Call once at game start. Returns a Map of wordId → HTMLAudioElement.
 */
export async function preloadWordAudio(words: Word[]): Promise<Map<string, HTMLAudioElement>> {
  const map = new Map<string, HTMLAudioElement>();
  const { getManyAudio } = await import('./audioDb');
  const audioData = await getManyAudio(words.map(w => w.id));
  audioData.forEach((base64, wordId) => {
    try { map.set(wordId, new Audio(base64)); } catch {}
  });
  return map;
}

/**
 * Play audio for a specific word from a preloaded map.
 * No-op if the word has no audio.
 */
export function playWordAudio(audioMap: Map<string, HTMLAudioElement>, wordId: string): void {
  if (storageService.getMuted()) return;
  const audio = audioMap.get(wordId);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

/**
 * Dark hollow chime for Witch's Noose — pitch descends with each mistake
 * (mistake 1 = highest, mistake 13 = lowest/darkest).
 */
export function playWitchChime(mistakeNumber: number): void {
  if (storageService.getMuted()) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Start at 440Hz and drop ~20Hz per mistake, getting darker
    const baseFreq = 440 - (mistakeNumber - 1) * 22;
    const duration = 1.4;

    // Main tone (hollow bell-like)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    // Overtone (adds hollow/bell character)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.76, ctx.currentTime);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.6);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + duration * 0.6);

    osc.onended = () => ctx.close();
  } catch {}
}
