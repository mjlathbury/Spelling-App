/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, RefreshCw, Home, Loader2 } from 'lucide-react';
import { storageService, loadWordList, getCachedWordList } from '../services/storageService';
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
  const [wordList, setWordList] = useState<Set<string> | null>(() => getCachedWordList());
  const [isLoading, setIsLoading] = useState(!getCachedWordList());

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
      navigate('/training');
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

    if (!wordList || wordList.size === 0) {
      loadWordList()
        .then(set => {
          setWordList(set);
          setIsLoading(false);
        })
        .catch(() => {
          setWordList(new Set());
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => { clearKeyStates(); };
  }, [listId, navigate, isTrial, clearKeyStates]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleWin = useCallback((attempts?: number) => {
    const finalAttempts = attempts ?? (guesses.length + 1);
    const starsToAward = Math.max(10, 60 - ((finalAttempts - 1) * 10));
    confetti({ 
      particleCount: 150, 
      spread: 90, 
      origin: { y: 0.5 }, 
      colors: ['#9d50bb', '#ffd700', '#ffffff'] 
    });
    
    if (isTrial) {
      storageService.addStars(starsToAward);
      setStarsEarned(starsToAward);
    }
    setWon(true);
    setGameOver(true);
  }, [isTrial, guesses.length]);

  const handleLoss = useCallback(() => {
    if (isTrial) storageService.lockGame(`masters-grid-${listId}`);
    setWon(false);
    setGameOver(true);
  }, [isTrial, listId]);

  const submitGuess = useCallback(() => {
    // 1. Basic length check (removed !wordList to allow safety net bypass)
    if (currentGuess.length !== targetWord.length) return;

    // 1. Aggressive cleaning to remove any potential hidden characters
    const guessClean = currentGuess.replace(/\s+/g, '').toLowerCase();
    const targetClean = targetWord.replace(/\s+/g, '').toLowerCase();
    
    // 2. Step 1: Validation
    const isDictionaryWord = wordList?.has(guessClean) || false;
    const isSecretWord = guessClean === targetClean;

    // DEBUG LOG
    console.log(`--- RUNE CHECK ---`);
    console.log(`Typed: "${guessClean}" (Length: ${guessClean.length})`);
    console.log(`In Dictionary: ${isDictionaryWord}`);
    console.log(`Is Secret Answer: ${isSecretWord}`);
    console.log(`Dictionary Size: ${wordList?.size || 0}`);

    // The Gatekeeper: If dictionary is missing or doesn't have words of this length, 
    // trust the secret word check.
    const isAccepted = isDictionaryWord || isSecretWord;

    if (isAccepted) {
      
      // Step 2: Color Calculation
      const states: CellState[] = Array(targetWord.length).fill('absent');
      const targetArr = targetWord.toUpperCase().split('');
      const guessArr = currentGuess.toUpperCase().split('');

      const remainingTarget: (string | null)[] = [...targetArr];
      
      // First pass: Greens
      guessArr.forEach((char, i) => {
        if (char === targetArr[i]) {
          states[i] = 'correct';
          remainingTarget[i] = null;
        }
      });

      // Second pass: Yellows
      guessArr.forEach((char, i) => {
        if (states[i] === 'correct') return;
        const ti = remainingTarget.indexOf(char);
        if (ti !== -1) {
          states[i] = 'misplaced';
          remainingTarget[ti] = null;
        }
      });

      // Update Grid and Keyboard
      setGuesses(prev => [...prev, { word: currentGuess.toUpperCase(), states }]);
      guessArr.forEach((char, i) => setKeyState(char, states[i]));

      if (isSecretWord) {
        handleWin(); 
      } else if (guesses.length + 1 >= MAX_ATTEMPTS) {
        handleLoss(); 
      } else {
        setCurrentGuess('');
      }
    } else {
      // REJECTION
      setShakingRow(guesses.length);
      showToast(`${currentGuess.toUpperCase()} is not a valid rune`);
      setTimeout(() => setShakingRow(null), 600);
    }
  }, [currentGuess, guesses, targetWord, wordList, setKeyState, showToast, handleWin, handleLoss]);

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
        <p className="text-white/60 font-black uppercase tracking-[0.3em] text-xs text-center px-12 animate-pulse">
          Consulting the Great Archives...
        </p>
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
    // Explicitly NOT resetting wordList or isLoading to preserve Eternal Memory
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
      <div className="text-center pt-4 pb-2 shrink-0 relative">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">
          Wizard's Grid <span className="text-[var(--theme-color)]">🔮</span>
        </h2>
        <p className="text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice'} • {list.name} • {MAX_ATTEMPTS - guesses.length} attempts left
        </p>
        <div className="absolute top-2 right-4 text-[8px] opacity-30 font-mono pointer-events-none">
          Lexicon: {wordList?.size || 0}
        </div>
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
                  onClick={() => navigate('/training')}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl glass-button font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Home size={18} />
                  Return to Training
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
