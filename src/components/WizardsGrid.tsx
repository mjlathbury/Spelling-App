/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, RefreshCw, Home, Loader2 } from 'lucide-react';
import { storageService, loadWordList } from '../services/storageService';
import { useKeyboard } from '../context/KeyboardContext';
import { SpellingList } from '../types';
import confetti from 'canvas-confetti';

const MAX_ATTEMPTS = 6;

type CellState = 'correct' | 'misplaced' | 'absent' | 'empty' | 'active';

interface GuessRow {
  word: string;
  states: CellState[];
}

export default function WizardsGrid() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [targetWord, setTargetWord] = useState('');
  const [wordList, setWordList] = useState<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // Toast & shake state
  const [toast, setToast] = useState<string | null>(null);
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { registerHandler, unregisterHandler, setKeyState, clearKeyStates } = useKeyboard();

  // Load word list and spellbook on mount
  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);

    if (!found) {
      navigate('/portal');
      return;
    }

    setList(found);
    const randomWord = found.words[Math.floor(Math.random() * found.words.length)].text.toUpperCase();
    setTargetWord(randomWord);

    if (isTrial && storageService.isGameLocked(`masters-grid-${listId}`)) {
      setGameOver(true);
      setWon(false);
      setIsLoading(false);
      return;
    }

    loadWordList()
      .then(set => {
        setWordList(set);
        setIsLoading(false);
      })
      .catch(() => {
        // If wordlist fails to load, allow any word
        setWordList(new Set());
        setIsLoading(false);
      });

    return () => { clearKeyStates(); };
  }, [listId, navigate, isTrial, clearKeyStates]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== targetWord.length || !wordList) return;

    const guessLower = currentGuess.toLowerCase();

    // Wordlist validation — only skip if set is non-empty (empty = fallback)
    if (wordList.size > 0 && !wordList.has(guessLower)) {
      setShakingRow(guesses.length);
      showToast('Not in the Lexicon');
      setTimeout(() => setShakingRow(null), 600);
      return;
    }

    // Colour-code the guess
    const states: CellState[] = Array(targetWord.length).fill('absent');
    const targetArr = targetWord.split('');
    const guessArr = currentGuess.split('');

    // First pass: mark greens
    const remainingTarget: (string | null)[] = [...targetArr];
    guessArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        states[i] = 'correct';
        remainingTarget[i] = null;
      }
    });

    // Second pass: mark yellows
    guessArr.forEach((char, i) => {
      if (states[i] === 'correct') return;
      const ti = remainingTarget.indexOf(char);
      if (ti !== -1) {
        states[i] = 'misplaced';
        remainingTarget[ti] = null;
      }
    });

    const newGuess: GuessRow = { word: currentGuess, states };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    // Update keyboard colours
    guessArr.forEach((char, i) => {
      const s = states[i];
      if (s === 'correct') setKeyState(char, 'correct');
      else if (s === 'misplaced') setKeyState(char, 'misplaced');
      else setKeyState(char, 'disabled');
    });

    if (currentGuess === targetWord) {
      const starsToAward = Math.max(10, 60 - (guesses.length * 10));
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ['#9d50bb', '#ffd700', '#ffffff'] });
      if (isTrial) {
        storageService.addStars(starsToAward);
        setStarsEarned(starsToAward);
      }
      setWon(true);
      setGameOver(true);
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      if (isTrial) storageService.lockGame(`masters-grid-${listId}`);
      setWon(false);
      setGameOver(true);
    } else {
      setCurrentGuess('');
    }
  }, [currentGuess, guesses, targetWord, wordList, isTrial, listId, setKeyState, showToast]);

  const onKeyPress = useCallback((key: string) => {
    if (gameOver || isLoading) return;
    const normalizedKey = key.toUpperCase();
    if (normalizedKey === 'ENTER') {
      submitGuess();
    } else if (normalizedKey === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < targetWord.length && /^[A-Z]$/.test(normalizedKey)) {
      setCurrentGuess(prev => prev + normalizedKey);
    }
  }, [gameOver, isLoading, currentGuess, submitGuess]);

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

  const getCellStyle = (state: CellState) => {
    switch (state) {
      case 'correct':  return 'bg-emerald-500 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.6)] text-white';
      case 'misplaced': return 'bg-amber-500 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)] text-white';
      case 'absent':   return 'bg-zinc-800 border-zinc-700 text-white/60';
      default:         return 'bg-white/5 border-white/15 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-[var(--theme-color)] animate-spin" />
        <p className="text-white/60 font-bold uppercase tracking-widest text-sm">Loading the Ancient Lexicon…</p>
      </div>
    );
  }

  if (!list) return null;

  const handleRetry = () => {
    clearKeyStates();
    const newWord = list.words[Math.floor(Math.random() * list.words.length)].text.toUpperCase();
    setTargetWord(newWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setStarsEarned(0);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-sm uppercase tracking-widest shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center pt-4 pb-2 shrink-0">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">
          Wizard's Grid <span className="text-[var(--theme-color)]">🔮</span>
        </h2>
        <p className="text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice'} • {list.name} • {MAX_ATTEMPTS - guesses.length} attempts left
        </p>
      </div>

      {/* N×6 Grid — centered in stage, cells shrink for long words */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-2">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
          const submittedGuess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          const isShaking = shakingRow === rowIndex;

          return (
            <div
              key={rowIndex}
              className={`flex gap-1.5 ${isShaking ? 'animate-shake' : ''}`}
            >
              {Array.from({ length: targetWord.length }).map((_, colIndex) => {
                let letter = '';
                let state: CellState = 'empty';

                if (submittedGuess) {
                  letter = submittedGuess.word[colIndex] || '';
                  state = submittedGuess.states[colIndex];
                } else if (isCurrentRow) {
                  letter = currentGuess[colIndex] || '';
                  state = 'active';
                }

                const isActiveCursor = isCurrentRow && colIndex === currentGuess.length && !gameOver;

                return (
                  <motion.div
                    key={colIndex}
                    initial={false}
                    animate={submittedGuess ? { rotateX: [0, 90, 0], transition: { duration: 0.5, delay: colIndex * 0.1 } } : {}}
                  className={`
                      ${ targetWord.length <= 5 ? 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl' 
                        : targetWord.length <= 7 ? 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl'
                        : 'w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg' }
                      rounded-xl border-2 flex items-center justify-center
                      font-black text-white transition-colors duration-200
                      ${submittedGuess ? getCellStyle(state) : ''}
                      ${!submittedGuess && letter ? 'bg-white/10 border-white/30' : ''}
                      ${!submittedGuess && !letter ? 'bg-white/5 border-white/10' : ''}
                      ${isActiveCursor ? 'border-[var(--theme-color)] shadow-[0_0_10px_var(--theme-glow)]' : ''}
                    `}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
          >
            <div className="glass-card p-8 text-center space-y-5 max-w-xs w-full border-[var(--theme-color)]/30 shadow-[0_0_40px_var(--theme-glow)]">
              <div className="text-6xl">{won ? '✨' : '🌑'}</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                  {won ? 'Vision Cleared!' : 'The Rune Escapes…'}
                </h3>
                <p className="text-[var(--theme-color)] text-sm font-bold">
                  {won
                    ? `Deciphered in ${guesses.length} ${guesses.length === 1 ? 'attempt' : 'attempts'}!${isTrial ? ` +${starsEarned} ✨` : ''}`
                    : `The secret rune was: ${targetWord}`}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {!won && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[var(--theme-color)] text-white font-black uppercase tracking-widest shadow-[0_0_20px_var(--theme-glow)] active:scale-95 transition-all"
                  >
                    <RefreshCw size={18} />
                    Recharge Mana
                  </button>
                )}
                <button
                  onClick={() => navigate('/portal')}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl glass-button font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Home size={18} />
                  Return to Portal
                </button>
                {won && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl glass-button font-black text-sm uppercase tracking-wider active:scale-95 transition-all"
                  >
                    <Sparkles size={16} />
                    Cast Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
