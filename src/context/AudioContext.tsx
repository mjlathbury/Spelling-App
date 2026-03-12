/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { storageService } from '../services/storageService';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playMusic: (src: string, loop?: boolean) => void;
  stopMusic: () => void;
  fadeOutMusic: (duration?: number) => Promise<void>;
  fadeInMusic: (src: string, duration?: number) => Promise<void>;
  playEffect: (src: string | HTMLAudioElement) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => storageService.getMuted());
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      storageService.setMuted(next);
      if (musicRef.current) {
        musicRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = '';
      musicRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
  }, []);

  const playMusic = useCallback((src: string, loop = true) => {
    if (musicRef.current?.src.includes(src)) return;

    stopMusic();
    const audio = new Audio(src);
    audio.loop = loop;
    audio.muted = isMuted;
    audio.volume = 0.4;
    musicRef.current = audio;
    audio.play().catch(() => {
      // Autoplay workaround: wait for interaction
      const playOnInteract = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
    });
  }, [isMuted, stopMusic]);

  const fadeOutMusic = useCallback((duration = 1500) => {
    return new Promise<void>((resolve) => {
      const audio = musicRef.current;
      if (!audio || audio.paused) {
        resolve();
        return;
      }

      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      const steps = 20;
      const intervalTime = duration / steps;
      const stepValue = audio.volume / steps;

      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume > stepValue) {
          audio.volume -= stepValue;
        } else {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeIntervalRef.current!);
          resolve();
        }
      }, intervalTime);
    });
  }, []);

  const fadeInMusic = useCallback((src: string, duration = 1500) => {
    return new Promise<void>((resolve) => {
      if (musicRef.current?.src.includes(src) && !musicRef.current.paused) {
        resolve();
        return;
      }

      stopMusic();
      const audio = new Audio(src);
      audio.loop = true;
      audio.muted = isMuted;
      audio.volume = 0;
      musicRef.current = audio;

      const play = () => {
        audio.play().then(() => {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          
          const targetVol = 0.4;
          const steps = 20;
          const intervalTime = duration / steps;
          const stepValue = targetVol / steps;

          fadeIntervalRef.current = setInterval(() => {
            if (audio.volume < targetVol - stepValue) {
              audio.volume += stepValue;
            } else {
              audio.volume = targetVol;
              clearInterval(fadeIntervalRef.current!);
              resolve();
            }
          }, intervalTime);
        }).catch(() => {
          // If autoplay fails, we can't fade in yet
          const playOnInteract = () => {
            play();
            document.removeEventListener('click', playOnInteract);
          };
          document.addEventListener('click', playOnInteract);
          resolve();
        });
      };

      play();
    });
  }, [isMuted, stopMusic]);

  const playEffect = useCallback((src: string | HTMLAudioElement) => {
    if (isMuted) return;
    try {
      const audio = typeof src === 'string' ? new Audio(src) : src;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Audio effect playback failed', e);
    }
  }, [isMuted]);

  return (
    <AudioContext.Provider value={{
      isMuted,
      toggleMute,
      playMusic,
      stopMusic,
      fadeOutMusic,
      fadeInMusic,
      playEffect
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
