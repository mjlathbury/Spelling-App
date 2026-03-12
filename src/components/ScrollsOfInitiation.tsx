/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scroll, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { GameMode } from '../types';

interface LoreInfo {
  name: string;
  story: string;
  rules: string;
}

const GAME_LORE: Record<GameMode, LoreInfo> = {
  'classic-test': {
    name: 'The Grand Trial',
    story: 'The Final Ascent. All your preparation leads to this. No whispers, no echoes, no mercy. Only your mind against the ancient runes.',
    rules: 'The ultimate test! Use the Cast Spell button to submit. Available in 3 difficulty levels.'
  },
  'flash': {
    name: 'Flash Insight',
    story: 'The Glimmering Insight. A brief vision of the truth is granted to help you memorize the shape of power.',
    rules: 'The word appears briefly. Memorize its form and spell it to gain knowledge.'
  },
  'blanks': {
    name: 'Fractured Runes',
    story: 'The stones are cracked, their meanings obscured. Piece the fragments together to learn the word.',
    rules: 'A training exercise. Fill in the missing letters to complete the word and strengthen your focus.'
  },
  'sudden-death': {
    name: "Guardian's Trial",
    story: 'One slip of the tongue, and the portal collapses. Only the perfect may pass.',
    rules: 'One mistake ends the session. How long can you survive?'
  },
  'proofread': {
    name: "Scholar's Eye",
    story: 'Deceptive shadows have twisted the scrolls. Discern the true from the false.',
    rules: 'Decide if the displayed word is spelled correctly or incorrectly.'
  },
  'masters-grid': {
    name: "Wizard's Grid",
    story: "The Archmage has hidden a secret rune. You have 6 attempts to decipher it.",
    rules: 'Guess the 5-letter word. Only real words from the ancient lexicon are accepted.'
  },
  'witchs-noose': {
    name: "The Witch's Noose",
    story: 'A spirit is bound by a failing spell. Intercept the Base64 Echoes and guess the letters to break the noose before the 13th chime.',
    rules: 'Guess letters to reveal the word. You have 13 mistakes before the spell backfires.'
  },
  'seers-wordsearch': {
    name: "The Seer's Wordsearch",
    story: 'The Constellation Map. The stars hide the words of power in plain sight. Trace the cosmic connections to reveal them.',
    rules: 'Find and highlight all words hidden in the grid of runes.'
  },
  'lexicon-leak': {
    name: 'The Lexicon Leak',
    story: 'Words of power have escaped their jars and are floating in chaos. Unscramble them back into reality before they boil over.',
    rules: 'Unscramble the floating letters to reveal the original word.'
  }
};

interface ScrollsOfInitiationProps {
  mode: GameMode;
  isOpen: boolean;
  onStart: (isTrial: boolean) => void;
  onClose: () => void;
}

export default function ScrollsOfInitiation({ mode, isOpen, onStart, onClose }: ScrollsOfInitiationProps) {
  const lore = GAME_LORE[mode];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg"
          >
            {/* Glass Background */}
            <div className="bg-black/60 p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-[var(--theme-color)]/30 backdrop-blur-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
              
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-[var(--theme-color)] opacity-20 blur-[60px] pointer-events-none rounded-full" />
              
              <div className="p-4 rounded-full bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/20 shadow-[0_0_30px_var(--theme-glow)] relative z-10">
                <Sparkles className="text-[var(--theme-color)]" size={32} />
              </div>
              
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_15px_var(--theme-glow)] relative z-10">
                {lore.name}
              </h2>
              
              <div className="space-y-4 italic text-white/80 font-medium leading-relaxed max-w-sm relative z-10">
                <p className="text-lg">"{lore.story}"</p>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--theme-color)]/50 to-transparent relative z-10" />

              <div className="space-y-4 w-full relative z-10">
                <h3 className="text-xs font-black text-[var(--theme-color)] uppercase tracking-widest drop-shadow-[0_0_8px_var(--theme-glow)]">The Ritual Rules</h3>
                <p className="text-sm text-white/90 font-bold">{lore.rules}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full pt-4 relative z-10">
                {/* Practice Orb */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => onStart(false)}
                  className="relative flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)]/20 shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_var(--theme-glow)] overflow-hidden group transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Zap size={28} className="text-cyan-400 group-hover:text-[var(--theme-color)] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-colors" />
                  <span className="text-sm font-black text-white uppercase tracking-widest relative z-10">Practice</span>
                  <span className="text-[10px] text-white/50 relative z-10 uppercase tracking-widest font-bold">Safe learning</span>
                </motion.button>
                
                {/* Trial Orb */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => onStart(true)}
                  className="relative flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/50 hover:bg-[var(--theme-color)]/40 shadow-[0_0_30px_var(--theme-glow)] overflow-hidden group transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                  <ShieldCheck size={28} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <span className="text-sm font-black text-white uppercase tracking-widest relative z-10">Trial</span>
                  <span className="text-[10px] text-white/80 relative z-10 uppercase tracking-widest font-bold">Earn Stars</span>
                </motion.button>
              </div>

              <button
                onClick={onClose}
                className="text-white/40 text-xs font-bold hover:text-white uppercase tracking-widest transition-colors pt-4 relative z-10"
              >
                Return to Portal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
