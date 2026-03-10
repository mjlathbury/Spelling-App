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
  'classic': {
    name: 'Classic Spelling',
    story: 'The Echo of Ancients. Listen closely as the spirits whisper the sacred scripts of old.',
    rules: 'Listen to the audio and spell the word correctly to earn stars.'
  },
  'flash': {
    name: 'Flash Insight',
    story: 'The Glimmering Insight. A brief vision of the truth is granted; hold it tight before it fades into the mist.',
    rules: 'The word appears briefly. Memorize it and spell it from memory.'
  },
  'blanks': {
    name: 'Fractured Runes',
    story: 'The spell is broken, its core missing. Restore the missing symbols to mend the magic.',
    rules: 'Fill in the missing letters to complete the word.'
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
  'n-in-a-row': {
    name: 'Rhythmic Chant',
    story: 'Power is built through repetition. Recite the spell perfectly to anchor its strength.',
    rules: 'Spell each word multiple times in a row to master it.'
  },
  'masters-grid': {
    name: "Master's Grid",
    story: 'The Alchemist\'s Secret. A hidden formula lies within the grid. Narrow down the possibilities to reveal the gold.',
    rules: 'Guess the word in 6-8 tries. Colors hint at correct letters and positions.'
  },
  'witchs-noose': {
    name: "The Witch's Noose",
    story: 'A spirit is bound by a failing spell. Guess the letters to break the noose before the 13th chime.',
    rules: 'Guess letters to reveal the word. You have 13 mistakes before the spell backfires.'
  },
  'seers-wordsearch': {
    name: "The Seer's Wordsearch",
    story: 'The Constellation Map. The stars hide the words of power in plain sight. Trace the connections to reveal them.',
    rules: 'Find and highlight all words hidden in the grid of runes.'
  },
  'lexicon-leak': {
    name: 'The Lexicon Leak',
    story: 'Words have escaped their jars and are floating in chaos. Translate them back before they boil over.',
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
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            className="relative w-full max-w-lg origin-top"
          >
            {/* Scroll Background */}
            <div className="bg-[#f4e4bc] p-8 md:p-12 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-x-[12px] border-[#d4c49c] relative overflow-hidden">
              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
              
              {/* Scroll Content */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <Scroll className="text-[#8b4513] mb-2" size={48} />
                
                <h2 className="text-3xl font-serif font-black text-[#5d2e0a] uppercase tracking-tighter border-b-2 border-[#8b4513]/30 pb-2">
                  {lore.name}
                </h2>
                
                <div className="space-y-4 italic text-[#5d2e0a] font-medium leading-relaxed">
                  <p className="text-lg">"{lore.story}"</p>
                </div>

                <div className="w-full h-px bg-[#8b4513]/20" />

                <div className="space-y-4 w-full">
                  <h3 className="text-xs font-black text-[#8b4513] uppercase tracking-widest">The Ritual Rules</h3>
                  <p className="text-sm text-[#5d2e0a]/80 font-bold">{lore.rules}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button
                    onClick={() => onStart(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#d4c49c]/50 border border-[#8b4513]/20 hover:bg-[#d4c49c] transition-all group"
                  >
                    <Zap size={20} className="text-[#8b4513]" />
                    <span className="text-xs font-black text-[#5d2e0a] uppercase">Practice</span>
                    <span className="text-[10px] text-[#5d2e0a]/60">Safe learning</span>
                  </button>
                  
                  <button
                    onClick={() => onStart(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#8b4513] text-[#f4e4bc] hover:bg-[#5d2e0a] transition-all shadow-lg group"
                  >
                    <ShieldCheck size={20} className="text-gold" />
                    <span className="text-xs font-black uppercase">Trial</span>
                    <span className="text-[10px] opacity-70">Earn Stars & Glory</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="text-[#8b4513]/60 text-xs font-bold hover:text-[#8b4513] transition-colors pt-4"
                >
                  Return to Portal
                </button>
              </div>

              {/* Decorative Scroll Ends */}
              <div className="absolute -top-4 left-0 right-0 h-8 bg-[#c4b48c] rounded-full shadow-inner" />
              <div className="absolute -bottom-4 left-0 right-0 h-8 bg-[#c4b48c] rounded-full shadow-inner" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
