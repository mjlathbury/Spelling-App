/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Wallet, Trash2, Clock, FlaskConical, Book, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, Voucher } from '../types';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setUserName(storageService.getUserName() || 'Hero');
  }, []);

  // Play Epic.mp3 background music on the main screen
  useEffect(() => {
    let fadeInInterval: ReturnType<typeof setInterval>;
    // Delay start to allow splash screen music to finish fading out
    const startDelay = setTimeout(() => {
      const audio = new Audio('/Epic.mp3');
      audio.volume = 0;
      audio.loop = true;
      audioRef.current = audio;

      const play = () => {
        audio.play().then(() => {
          // Fade in volume over ~2 seconds
          let vol = 0;
          fadeInInterval = setInterval(() => {
            vol = Math.min(vol + 0.04, 0.4);
            audio.volume = vol;
            if (vol >= 0.4) clearInterval(fadeInInterval);
          }, 100);
        }).catch(() => {});
      };

      play();

      // Fallback: play on first user interaction if autoplay is blocked
      const onInteract = () => play();
      document.addEventListener('click', onInteract, { once: true });
      document.addEventListener('keydown', onInteract, { once: true });

      return () => {
        document.removeEventListener('click', onInteract);
        document.removeEventListener('keydown', onInteract);
      };
    }, 800);

    return () => {
      clearTimeout(startDelay);
      clearInterval(fadeInInterval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Fade out music then navigate
  const handleNavigation = (path: string) => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          audio.volume = 0;
          audio.pause();
          audio.src = '';
          audioRef.current = null;
          clearInterval(fadeOut);
          navigate(path);
        }
      }, 60);
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    storageService.clearUserName();
    window.location.href = '/';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      <div className="max-w-4xl w-full flex flex-col h-full justify-center p-4 md:p-8">
        {/* Welcome Section */}
        <header className="text-center mb-6 md:mb-10 relative">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight text-glow">
            Magical Spelling Quest <span className="inline-block animate-pulse">🔮</span>
          </h1>
          <p className="text-xs md:text-base text-[var(--theme-color)] font-medium max-w-lg mx-auto">
            Greetings, {userName}! The portal is open.
          </p>
        </header>

        {/* Navigation Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <button
            onClick={() => handleNavigation('/spellbooks')}
            className="glass-card p-5 md:p-8 transition-all text-left group relative overflow-hidden flex flex-col items-start justify-center min-h-[140px] md:min-h-[200px]"
          >
            <div className="bg-[var(--theme-color)]/20 text-[var(--theme-color)] w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Book size={24} />
            </div>
            <h3 className="text-lg md:text-2xl font-black text-white mb-1">Spellbook</h3>
            <p className="text-[10px] md:text-sm text-[var(--theme-color)] font-medium leading-tight">Craft new incantations and record your voice.</p>
            <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors">
              <Book size={80} />
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/portal')}
            className="glass-card p-5 md:p-8 transition-all text-left group relative overflow-hidden border-[var(--theme-color)]/50 shadow-[0_0_30px_var(--theme-glow)] flex flex-col items-start justify-center min-h-[140px] md:min-h-[200px]"
          >
            <div className="bg-[var(--theme-color)] text-white w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_var(--theme-glow)]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg md:text-2xl font-black text-white mb-1">Magic Portal</h3>
            <p className="text-[10px] md:text-sm text-[var(--theme-color)] font-medium leading-tight">Enter the practice realms and test your power.</p>
            <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors">
              <Sparkles size={80} />
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/rewards')}
            className="glass-card p-5 md:p-8 transition-all text-left group relative overflow-hidden flex flex-col items-start justify-center min-h-[140px] md:min-h-[200px]"
          >
            <div className="bg-emerald-500/20 text-emerald-400 w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FlaskConical size={24} />
            </div>
            <h3 className="text-lg md:text-2xl font-black text-white mb-1">Potions</h3>
            <p className="text-[10px] md:text-sm text-[var(--theme-color)] font-medium leading-tight">Brew your earned vouchers and claim rewards.</p>
            <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors">
              <FlaskConical size={80} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
