/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, BookOpen, Sparkles, Trophy } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, GameMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function TrialSanctuary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lists, setLists] = useState<SpellingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  
  useEffect(() => {
    const allLists = storageService.getLists();
    setLists(allLists);
    
    const state = location.state as { selectedListId?: string };
    if (state?.selectedListId) {
      setSelectedListId(state.selectedListId);
    } else if (allLists.length > 0) {
      setSelectedListId(allLists[0].id);
    }
  }, [location.state]);

  const handleStartGame = (isTrial: boolean) => {
    if (!selectedListId) return;
    navigate(`/classic-test/${selectedListId}`, { state: { mode: 'classic-test', isTrial } });
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-black/20 touch-none">

      <div className="flex-1 flex flex-col justify-center px-6 py-4 md:py-12 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-16 w-full">
          <header className="text-center space-y-2 md:space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block p-3 md:p-4 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 mb-2 md:mb-4 shadow-[0_0_50px_rgba(244,63,94,0.2)]"
            >
              <ShieldAlert size={32} className="md:w-12 md:h-12" strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-3xl md:text-7xl font-black text-white text-glow uppercase tracking-tighter">
              The Trial Sanctuary
            </h2>
            <p className="text-[10px] md:text-xl text-rose-400 font-black tracking-[0.3em] uppercase opacity-80">
              Where Champions are Forged
            </p>
          </header>

          <section className="max-w-2xl mx-auto space-y-4 md:space-y-8 w-full">
            <div className="glass-card p-5 md:p-8 border-rose-500/30 shadow-[0_0_60px_rgba(244,63,94,0.15)] relative group overflow-hidden bg-black/40">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              
              <label className="block text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4 md:mb-6 flex items-center gap-2">
                <BookOpen size={14} />
                The Sacred Tome
              </label>
              
              <div className="relative mb-6 md:mb-10">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full p-4 md:p-5 rounded-2xl md:rounded-3xl bg-black/60 border-2 border-white/10 text-white font-black text-lg md:text-xl outline-none focus:border-rose-500 transition-all appearance-none cursor-pointer shadow-inner pr-14"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-rose-400">
                  <Sparkles size={24} />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartGame(true)}
                disabled={!selectedListId}
                className="w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-xl md:text-2xl uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(244,63,94,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-3 md:gap-4 border-2 border-white/20"
              >
                <Trophy size={28} className="md:w-8 md:h-8" />
                Begin The Trial
              </motion.button>
            </div>

            <div className="text-center px-4 md:px-8 hidden md:block">
              <p className="text-white/40 text-sm font-bold leading-relaxed italic">
                "In the silence of the Trial, only the true Master of Runes shall prevail. Three levels of intensity await those brave enough to cast their soul into the spellbook."
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
