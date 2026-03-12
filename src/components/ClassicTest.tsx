/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Home, Sparkles, Heart, Play, Volume2, Sparkle, RefreshCw } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, Word } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useKeyboard } from '../context/KeyboardContext';
import { useAudio } from '../context/AudioContext';

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: { attempts: 3, stars: 5, label: 'Level 1 (Easy)' },
  normal: { attempts: 2, stars: 10, label: 'Level 2 (Normal)' },
  hard: { attempts: 1, stars: 20, label: 'Level 3 (Hard)' }
};

export default function ClassicTest() {
  const { listId: initialListId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]); // Array of letters for the blanks
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [mistakesLeft, setMistakesLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [revealingAnswer, setRevealingAnswer] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [allLists, setAllLists] = useState<SpellingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId || null);

  const { registerHandler, unregisterHandler, setShowKeyboard } = useKeyboard();
  const { isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const lists = storageService.getLists();
    setAllLists(lists);
    
    if (selectedListId) {
      const found = lists.find(l => l.id === selectedListId);
      if (found) {
        setList(found);
        const shuffled = [...found.words].sort(() => Math.random() - 0.5);
        setGameWords(shuffled.slice(0, 10));
      }
    }
  }, [selectedListId, navigate]);

  const handleStart = (diff: Difficulty) => {
    if (!list) return;
    setDifficulty(diff);
    setMistakesLeft(DIFFICULTY_CONFIG[diff].attempts);
    setUserInput(new Array(gameWords[0]?.text.length || 0).fill(''));
    setHasStarted(true);
  };

  const playAudio = async () => {
    if (isMuted || isPlayingAudio) return;
    const currentWord = gameWords[currentIndex];
    if (currentWord) {
      setIsPlayingAudio(true);
      try {
        await storageService.playAudio(currentWord.id);
      } catch (err) {
        console.error("Audio playback failed or not found for:", currentWord.text, err);
      } finally {
        setIsPlayingAudio(false);
      }
    }
  };

  const triggerSuccess = () => {
    setFeedback('correct');
    const starsToAward = DIFFICULTY_CONFIG[difficulty!].stars;
    
    if (isTrial) {
      storageService.addStars(starsToAward);
      setStarsEarned(prev => prev + starsToAward);
    }

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#e879f9', '#ffd700', '#ffffff', '#22d3ee']
    });

    setTimeout(handleNext, 1500);
  };

  const triggerFailure = () => {
    const newMistakes = mistakesLeft - 1;
    setMistakesLeft(newMistakes);
    setFeedback('incorrect');

    if (newMistakes <= 0) {
      setRevealingAnswer(true);
      setTimeout(() => {
        setRevealingAnswer(false);
        handleNext();
      }, 1500);
    } else {
      setTimeout(() => {
        setFeedback(null);
        setUserInput(new Array(gameWords[currentIndex].text.length).fill(''));
      }, 1500);
    }
  };

  const handleNext = () => {
    if (currentIndex < gameWords.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setUserInput(new Array(gameWords[nextIdx].text.length).fill(''));
      setFeedback(null);
      setMistakesLeft(DIFFICULTY_CONFIG[difficulty!].attempts);
    } else {
      setIsFinished(true);
      if (score > 4) { // Only award voucher if done well
        const newVoucher = {
          id: crypto.randomUUID(),
          name: 'Classic Master',
          minutes: 15,
          earnedAt: Date.now(),
          listName: list!.name
        };
        storageService.saveVoucher(newVoucher);
        setShowVoucher(true);
      }
    }
  };

  const handleSubmit = useCallback(() => {
    if (!difficulty || feedback || isFinished || revealingAnswer) return;

    const currentWord = gameWords[currentIndex];
    const isCorrect = userInput.join('').trim().toLowerCase() === currentWord.text.toLowerCase();

    if (isCorrect) {
      setScore(s => s + 1);
      triggerSuccess();
    } else {
      triggerFailure();
    }
  }, [difficulty, feedback, isFinished, gameWords, currentIndex, userInput, revealingAnswer]);

  const onKeyPress = useCallback((key: string) => {
    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'BACKSPACE') {
      setUserInput(prev => {
        const next = [...prev];
        const lastCharIdx = [...next].reverse().findIndex(c => c !== '');
        if (lastCharIdx !== -1) {
          next[next.length - 1 - lastCharIdx] = '';
        }
        return next;
      });
    } else if (key.length === 1) {
      setUserInput(prev => {
        const next = [...prev];
        const firstEmptyIdx = next.findIndex(c => c === '');
        if (firstEmptyIdx !== -1) {
          next[firstEmptyIdx] = key.toUpperCase();
        }
        return next;
      });
    }
  }, [handleSubmit]);

  useEffect(() => {
    if (hasStarted && difficulty && !isFinished && !feedback && !revealingAnswer) {
      registerHandler(onKeyPress);
      setShowKeyboard(true);
      return () => {
        unregisterHandler();
        setShowKeyboard(false);
      };
    } else {
      setShowKeyboard(false);
    }
  }, [hasStarted, difficulty, isFinished, feedback, revealingAnswer, registerHandler, unregisterHandler, onKeyPress, setShowKeyboard]);

  if (!list || gameWords.length === 0) return null;

  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl overflow-hidden touch-none px-6 py-4 text-center">
        {/* Center: Vision Orbs */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 md:space-y-12">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter text-glow">Grand Trials</h2>
            <p className="text-[var(--theme-color)] font-bold text-[10px] md:text-sm uppercase tracking-widest opacity-80">Tap an orb to begin</p>
          </div>

          <div className="flex flex-col gap-3 md:gap-6 w-full max-w-sm">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff, i) => (
              <motion.button
                key={diff}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 1.1 }}
                onClick={() => handleStart(diff)}
                className="group relative flex items-center justify-between p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/5 border-2 border-white/10 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)]/20 shadow-xl transition-all overflow-hidden min-h-[60px] md:min-h-[80px]"
              >
                <div className="text-left relative z-10">
                  <span className="block text-lg md:text-2xl font-black text-white uppercase tracking-tight">{DIFFICULTY_CONFIG[diff].label}</span>
                  <span className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest">
                    {DIFFICULTY_CONFIG[diff].attempts} Lives • {DIFFICULTY_CONFIG[diff].stars} Stars
                  </span>
                </div>
                <div className="p-2 md:p-4 rounded-full bg-white/5 border border-white/10 text-white/20 group-hover:text-[var(--theme-color)] transition-all">
                  <Sparkles size={18} className="md:w-6 md:h-6" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bottom: Return */}
        <div className="mt-2">
          <button
            onClick={() => navigate('/trial')}
            className="w-full text-white/30 text-[9px] md:text-[10px] font-black hover:text-white uppercase tracking-[0.3em] transition-colors text-center py-1"
          >
            ← Return to Sanctuary
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-2xl overflow-hidden touch-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center max-w-md w-full relative overflow-hidden border-2 border-[var(--theme-color)]"
        >
          <AnimatePresence>
            {showVoucher && (
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)] to-[var(--theme-nebula)] flex flex-col items-center justify-center text-white p-8 z-10"
              >
                <Trophy size={80} className="mb-6 text-gold animate-bounce" />
                <h2 className="text-3xl font-black mb-2 text-glow uppercase tracking-tighter">MASTER SPELLER!</h2>
                <p className="text-base font-bold mb-10 text-white/90">The ancient spirits have gifted you a voucher.</p>
                <button 
                  onClick={() => setShowVoucher(false)}
                  className="bg-white text-[var(--theme-color)] px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-110 transition-transform"
                >
                  Behold!
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="scale-125 mb-10">
            <div className="bg-[var(--theme-color)]/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-gold shadow-[0_0_40px_var(--theme-glow)] border-2 border-[var(--theme-color)]">
              <Sparkles size={48} />
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-white mb-2 text-glow uppercase tracking-tighter">Test Results</h2>
          <div className="space-y-1 mb-10">
            <p className="text-2xl text-[var(--theme-color)] font-black uppercase tracking-widest">
              {score} / {gameWords.length} Words
            </p>
            <p className="text-gold font-black text-xl flex items-center justify-center gap-2">
              {starsEarned} <span className="text-sm">STARS EARNED</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-3 bg-[var(--theme-color)] text-white p-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-[0_0_30px_var(--theme-glow)]"
            >
              <RefreshCw className="w-5 h-5" />
              Reset Trial
            </button>
            <button
              onClick={() => navigate('/trial')}
              className="flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 text-white p-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-white/10"
            >
              <Home className="w-5 h-5" />
              Return to Academy
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentWord = gameWords[currentIndex];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black/20 touch-none">
      {/* 70% Top Stage */}
      <div className="flex-[7] flex flex-col p-6 space-y-8 relative">
        
        {/* Header: Lives & Progress */}
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-2 md:gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: DIFFICULTY_CONFIG[difficulty].attempts }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: i < mistakesLeft ? 1 : 0.8,
                    opacity: i < mistakesLeft ? 1 : 0.1,
                    color: i < mistakesLeft ? 'var(--theme-color)' : '#fff'
                  }}
                >
                  <Heart 
                    size={20} 
                    fill={i < mistakesLeft ? "currentColor" : "none"} 
                    className={i < mistakesLeft ? "drop-shadow-[0_0_10px_var(--theme-glow)]" : ""}
                    strokeWidth={2.5}
                  />
                </motion.div>
              ))}
            </div>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <div className="text-white/40 font-black text-[10px] md:text-sm uppercase tracking-widest flex flex-col justify-center">
              {currentIndex + 1} / {gameWords.length}
            </div>
          </div>
          <div className="text-gold font-black text-xl md:text-2xl text-glow flex items-center gap-1.5">
            {starsEarned} <Sparkle size={16} fill="currentColor" />
          </div>
        </div>

        {/* Center Stage: Play Button & Blanks */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 md:space-y-12">
          
          {/* Speaker Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={playAudio}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 border-2 border-[var(--theme-color)] flex items-center justify-center text-[var(--theme-color)] shadow-[0_0_40px_var(--theme-glow)] backdrop-blur-xl group transition-all relative overflow-hidden"
          >
            <Volume2 size={40} md:size={56} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <AnimatePresence>
              {isPlayingAudio && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-[var(--theme-color)]"
                />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Letter Blanks */}
          <div className="flex flex-nowrap justify-center gap-1 md:gap-3 w-full px-2 overflow-hidden">
            {userInput.map((letter, i) => (
              <motion.div
                key={`${currentIndex}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  w-9 h-12 md:w-16 md:h-20 rounded-xl md:rounded-2xl border-2 flex items-center justify-center text-xl md:text-3xl font-black transition-all flex-shrink-0
                  ${revealingAnswer ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                    letter ? 'border-[var(--theme-color)] bg-[var(--theme-color)]/10 text-white shadow-[0_0_20px_var(--theme-glow)]' : 
                    'border-white/10 bg-white/5 text-transparent'}
                `}
              >
                {revealingAnswer ? currentWord.text[i].toUpperCase() : letter}
              </motion.div>
            ))}
          </div>

          {/* Visual Feedback Overlays */}
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-500/20 pointer-events-none border-[10px] border-emerald-500/50 shadow-[inset_0_0_100px_rgba(16,185,129,0.5)] z-0"
              />
            )}
            {feedback === 'incorrect' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-rose-500/20 pointer-events-none border-[10px] border-rose-500/50 shadow-[inset_0_0_100px_rgba(244,63,94,0.5)] z-0 animate-pulse"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Cast Button */}
        <div className="pb-2">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={feedback !== null || revealingAnswer}
            className={`
              w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl uppercase tracking-[0.4em] transition-all relative overflow-hidden backdrop-blur-2xl
              ${feedback ? 'opacity-50 cursor-not-allowed' : 'bg-[var(--theme-color)]/20 border-2 border-[var(--theme-color)] text-white shadow-[0_0_40px_var(--theme-glow)] hover:bg-[var(--theme-color)]/30'}
            `}
          >
            <span className="relative z-10">Cast Spell</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </motion.button>
        </div>
      </div>

      <div className="flex-[3] pointer-events-none pb-6">
        {/* Transparent spacer for keyboard */}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
