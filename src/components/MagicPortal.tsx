/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Type, Eye, Zap, ShieldAlert, CheckCircle2, BookOpen, Grid3X3, Ghost, Search, FlaskConical, Plus } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, GameMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ScrollsOfInitiation from './ScrollsOfInitiation';

export default function MagicPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lists, setLists] = useState<SpellingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isEclipse, setIsEclipse] = useState(false);
  
  // Scroll State
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isScrollOpen, setIsScrollOpen] = useState(false);

  useEffect(() => {
    const allLists = storageService.getLists();
    setLists(allLists);
    setIsEclipse(storageService.isEclipse());
    
    // Check if a list ID was passed via navigation state
    const state = location.state as { selectedListId?: string };
    if (state?.selectedListId) {
      setSelectedListId(state.selectedListId);
    } else if (allLists.length > 0) {
      setSelectedListId(allLists[0].id);
    }
  }, [location.state]);

  const handleModeSelect = (mode: GameMode) => {
    if (isEclipse) return;
    if (!selectedListId) {
      alert('Please select a spellbook first!');
      return;
    }

    // Check if locked
    if (storageService.isGameLocked(`${mode}-${selectedListId}`)) {
      return;
    }

    setSelectedMode(mode);
    setIsScrollOpen(true);
  };

  const handleStartGame = (isTrial: boolean) => {
    if (!selectedMode || !selectedListId) return;
    
    setIsScrollOpen(false);
    
    const pathMap: Partial<Record<GameMode, string>> = {
      'masters-grid': `/masters-grid/${selectedListId}`,
      'witchs-noose': `/witchs-noose/${selectedListId}`,
      'seers-wordsearch': `/seers-wordsearch/${selectedListId}`,
      'lexicon-leak': `/lexicon-leak/${selectedListId}`,
    };

    const path = pathMap[selectedMode] || `/practice/${selectedListId}`;
    navigate(path, { state: { mode: selectedMode, isTrial } });
  };

  const modes = [
    { id: 'classic', name: 'Classic', icon: <Type size={24} />, desc: 'Listen and type.' },
    { id: 'flash', name: 'Flash', icon: <Eye size={24} />, desc: 'See it, then spell it!' },
    { id: 'blanks', name: 'Blanks', icon: <Zap size={24} />, desc: 'Complete the word.' },
    { id: 'sudden-death', name: 'Sudden Death', icon: <ShieldAlert size={24} />, desc: 'One mistake = Over!' },
    { id: 'proofread', name: 'Proofreader', icon: <CheckCircle2 size={24} />, desc: 'Is it correct?' },
    { id: 'masters-grid', name: "Wizard's Grid", icon: <Grid3X3 size={24} />, desc: 'Decipher the hidden rune.' },
    { id: 'witchs-noose', name: "Witch's Noose", icon: <Ghost size={24} />, desc: '13 chimes of fate.' },
    { id: 'seers-wordsearch', name: "Seer's Wordsearch", icon: <Search size={24} />, desc: 'Reveal hidden runes.' },
    { id: 'lexicon-leak', name: 'Lexicon Leak', icon: <FlaskConical size={24} />, desc: 'Translate floating words.' },
  ];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Scrolls of Initiation Popup */}
      {selectedMode && (
        <ScrollsOfInitiation
          mode={selectedMode}
          isOpen={isScrollOpen}
          onStart={handleStartGame}
          onClose={() => setIsScrollOpen(false)}
        />
      )}

      {/* Eclipse Overlay */}
      <AnimatePresence>
        {isEclipse && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center"
          >
            <div className="glass-card p-8 border-gold/30 max-w-sm space-y-4">
              <div className="text-6xl animate-pulse">🌑</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">The Eclipse Falls</h3>
              <p className="text-[var(--theme-color)] font-bold text-sm leading-relaxed">
                The stars have aligned and the Magic Well is full! Your daily spin awaits in the Treasury.
              </p>
              <button 
                onClick={() => navigate('/rewards')}
                className="w-full py-4 bg-gold text-black font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.4)]"
              >
                Go to Treasury
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto scrollable-content px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="text-center space-y-2">
            <h2 className="text-4xl md:text-6xl font-black text-white text-glow uppercase tracking-tighter">
              Magic Portal 🔮
            </h2>
            <p className="text-sm md:text-lg text-[var(--theme-color)] font-bold tracking-widest uppercase opacity-60">
              Choose your tome and enter the practice realms
            </p>
          </header>

          {/* Spellbook Selection - Large & Centered */}
          <section className="max-w-2xl mx-auto">
            <div className="glass-card p-4 border-[var(--theme-color)]/30 shadow-[0_0_40px_var(--theme-glow)] relative group">
              <label className="block text-xs font-black text-[var(--theme-color)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <BookOpen size={16} />
                Active Spellbook
              </label>
              <div className="relative">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  disabled={isEclipse}
                  className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 text-white font-black text-base outline-none focus:border-[var(--theme-color)] transition-all appearance-none cursor-pointer disabled:opacity-50 shadow-inner"
                >
                  {lists.length === 0 ? (
                    <option value="">No Spellbooks Found</option>
                  ) : (
                    lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-color)]">
                  <Sparkles size={24} />
                </div>
              </div>
              {lists.length === 0 && (
                <button
                  onClick={() => navigate('/builder')}
                  className="mt-6 w-full py-5 rounded-2xl bg-[var(--theme-color)] text-white font-black text-lg shadow-[0_0_20px_var(--theme-glow)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Plus size={24} />
                  Craft Your First Tome
                </button>
              )}
            </div>
          </section>

          {/* Game Modes Grid - Large Cards */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modes.map((m) => {
                const isLocked = storageService.isGameLocked(`${m.id}-${selectedListId}`);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id as GameMode)}
                    disabled={isEclipse || isLocked}
                    className={`
                      glass-card p-8 transition-all text-left group flex flex-col items-start relative overflow-hidden min-h-[220px]
                      ${isEclipse || isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:border-[var(--theme-color)] hover:shadow-[0_0_30px_var(--theme-glow)] hover:-translate-y-1'}
                    `}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-widest rotate-12 border-4 border-rose-400 px-4 py-2 bg-black/80">Backfire</span>
                      </div>
                    )}
                    <div className={`
                      bg-[var(--theme-nebula)] text-[var(--theme-color)] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform 
                      ${!isEclipse && !isLocked && 'group-hover:scale-110 shadow-[0_0_15px_var(--theme-glow)]'}
                    `}>
                      {React.cloneElement(m.icon as React.ReactElement, { size: 32 })}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{m.name}</h3>
                    <p className="text-sm text-[var(--theme-color)] font-bold leading-tight opacity-70 uppercase tracking-wide">{m.desc}</p>
                    
                    {/* Decorative Background Icon */}
                    <div className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors">
                      {React.cloneElement(m.icon as React.ReactElement, { size: 120 })}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
