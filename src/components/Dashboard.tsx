/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Wallet, Trash2, Clock, Trophy, Book, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, Voucher } from '../types';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    setUserName(storageService.getUserName() || 'Hero');
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
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
            <div className="bg-gold/20 text-gold w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg md:text-2xl font-black text-white mb-1">Treasure Chest</h3>
            <p className="text-[10px] md:text-sm text-[var(--theme-color)] font-medium leading-tight">Behold your earned vouchers and rewards.</p>
            <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors">
              <Trophy size={80} />
            </div>
          </button>
        </div>

        {/* Footer Actions */}
        <footer className="text-center space-y-4">
          <button
            onClick={handleLogout}
            className="text-[10px] font-black text-white/30 hover:text-rose-400 uppercase tracking-[0.2em] transition-colors flex items-center gap-2 mx-auto"
          >
            Assume New Identity
          </button>
        </footer>
      </div>
    </div>
  );
}
