/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';

export default function Settings() {
  const navigate = useNavigate();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      storageService.clearAll();
      window.location.href = '/';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[100] bg-[#020208] flex flex-col p-6"
    >
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black text-white text-glow uppercase tracking-tighter">Mystic Settings</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 max-w-md mx-auto w-full space-y-8 overflow-y-auto pb-20 scrollable-content">
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <AlertCircle size={24} />
            <h2 className="text-xl font-bold text-white">Danger Zone</h2>
          </div>

          <p className="text-sm text-white/60 leading-relaxed">
            Resetting your quest will erase all spellbooks, stars, and earned rewards. This action is permanent.
          </p>

          <button
            onClick={handleReset}
            className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-sm tracking-widest uppercase hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Reset All Progress
          </button>
        </section>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-[var(--theme-color)]/50 uppercase tracking-widest">
          Enchanted Academy v2.0
        </p>
      </div>
    </motion.div>
  );
}
