/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Wallet, Trash2, Clock, FlaskConical, Book, Sparkles, Trophy, GraduationCap } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, Voucher } from '../types';
import { motion } from 'motion/react';
import { useAudio } from '../context/AudioContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const { fadeInMusic, fadeOutMusic } = useAudio();

  useEffect(() => {
    setUserName(storageService.getUserName() || 'Hero');
  }, []);

  // Play Epic.mp3 background music on the main screen
  useEffect(() => {
    fadeInMusic('/Epic.mp3', 1500);

    return () => {
      // Don't stop music here, wait for navigation to trigger fade out
    };
  }, [fadeInMusic]);

  // Fade out music then navigate
  const handleNavigation = async (path: string) => {
    await fadeOutMusic(1500);
    navigate(path);
  };

  const handleLogout = () => {
    storageService.clearUserName();
    window.location.href = '/';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden p-2 md:p-4">
      <div className="max-w-4xl w-full flex flex-col h-full justify-center">
        {/* Welcome Section */}
        <header className="text-center mb-4 md:mb-10 relative">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 tracking-tight text-glow whitespace-nowrap">
            SpellQuest <span className="inline-block animate-pulse">🔮</span>
          </h1>
          <p className="text-xs md:text-base text-[var(--theme-color)] font-medium max-w-lg mx-auto opacity-80">
            Greetings, {userName}! Choose your path.
          </p>
        </header>

        {/* Navigation Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4">
          <button
            onClick={() => handleNavigation('/spellbooks')}
            className="glass-card p-4 md:p-8 transition-all text-left group relative overflow-hidden flex flex-col items-start justify-center min-h-[100px] md:min-h-[180px]"
          >
            <div className="bg-[var(--theme-color)]/20 text-[var(--theme-color)] w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Book size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-2xl font-black text-white mb-0.5">Spellbook</h3>
            <p className="text-[10px] md:text-sm text-[var(--theme-color)] font-medium leading-tight opacity-70">Craft incantations & record voice.</p>
            <div className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors">
              <Book size={60} className="md:w-20 md:h-20" />
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/training')}
            className="glass-card p-4 md:p-8 transition-all text-left group relative overflow-hidden border-cyan-500/30 flex flex-col items-start justify-center min-h-[100px] md:min-h-[180px]"
          >
            <div className="bg-cyan-500/10 text-cyan-400 w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <GraduationCap size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-2xl font-black text-white mb-0.5">Training Ground</h3>
            <p className="text-[10px] md:text-sm text-cyan-400 font-medium leading-tight opacity-70">Sharpen your mind with practice.</p>
            <div className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors">
              <GraduationCap size={60} className="md:w-20 md:h-20" />
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/trial')}
            className="glass-card p-4 md:p-8 transition-all text-left group relative overflow-hidden border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)] flex flex-col items-start justify-center min-h-[100px] md:min-h-[180px]"
          >
            <div className="bg-gradient-to-br from-amber-500 to-rose-600 text-white w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Trophy size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-2xl font-black text-white mb-0.5">Begin The Trial</h3>
            <p className="text-[10px] md:text-sm text-rose-400 font-black leading-tight">The ultimate test of power.</p>
            <div className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors">
              <Trophy size={60} className="md:w-20 md:h-20" />
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/rewards')}
            className="glass-card p-4 md:p-8 transition-all text-left group relative overflow-hidden flex flex-col items-start justify-center min-h-[100px] md:min-h-[180px]"
          >
            <div className="bg-emerald-500/20 text-emerald-400 w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FlaskConical size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-2xl font-black text-white mb-0.5">Potions</h3>
            <p className="text-[10px] md:text-sm text-emerald-400 font-medium leading-tight opacity-70">Claim your earned rewards.</p>
            <div className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors">
              <FlaskConical size={60} className="md:w-20 md:h-20" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
