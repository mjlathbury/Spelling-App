/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, RefreshCw, Home, Sparkles, Check, X, XCircle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { preloadWordAudio, playWordAudio } from '../services/audioService';
import { SpellingList, GameMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useKeyboard } from '../context/KeyboardContext';

// Mutation engine for "Proofreading" mode
const mutateWord = (word: string): string => {
  const letters = word.split('');
  if (letters.length < 2) return word;

  const mutationType = Math.floor(Math.random() * 4);
  
  switch (mutationType) {
    case 0: // Double a letter
      const idx = Math.floor(Math.random() * letters.length);
      letters.splice(idx, 0, letters[idx]);
      break;
    case 1: // Swap adjacent vowels
      const vowels = 'aeiouAEIOU';
      for (let i = 0; i < letters.length - 1; i++) {
        if (vowels.includes(letters[i]) && vowels.includes(letters[i+1]) && letters[i] !== letters[i+1]) {
          [letters[i], letters[i+1]] = [letters[i+1], letters[i]];
          break;
        }
      }
      break;
    case 2: // Remove a letter
      const removeIdx = Math.floor(Math.random() * letters.length);
      letters.splice(removeIdx, 1);
      break;
    case 3: // Swap any two adjacent letters
      const swapIdx = Math.floor(Math.random() * (letters.length - 1));
      [letters[swapIdx], letters[swapIdx+1]] = [letters[swapIdx+1], letters[swapIdx]];
      break;
  }
  
  const mutated = letters.join('');
  return mutated === word ? mutateWord(word) : mutated;
};

export default function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;
  const [list, setList] = useState<SpellingList | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [starsEarnedInSession, setStarsEarnedInSession] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [isBackfire, setIsBackfire] = useState(false);
  
  const [flashVisible, setFlashVisible] = useState(false);
  const [blanksData, setBlanksData] = useState<{ char: string, isBlank: boolean }[]>([]);
  const [blanksInput, setBlanksInput] = useState<string[]>([]);
  const [proofreadWord, setProofreadWord] = useState<{ text: string, isCorrect: boolean } | null>(null);

  const { registerHandler, unregisterHandler, isShift } = useKeyboard();
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());


  useEffect(() => {
    if (id) {
      const lists = storageService.getLists();
      const found = lists.find(l => l.id === id);
      if (found) {
        setList(found);
        // Async: fetch audio from IDB for this session's words only
        preloadWordAudio(found.words).then(map => {
          audioMapRef.current = map;
        }).catch(() => {});
      } else {
        navigate('/');
      }
    }
    
    const state = location.state as { mode?: GameMode };
    if (state?.mode) {
      setMode(state.mode);
    } else {
      navigate('/training');
    }

    setUserName(storageService.getUserName() || 'Hero');
  }, [id, navigate, location.state]);

  useEffect(() => {
    if (!list || !mode || isFinished) return;
    
    const currentWord = list.words[currentIndex];

    // Play custom audio incantation for modes that need it (handled in components)
    
    if (mode === 'flash') {
      setFlashVisible(true);
      const timer = setTimeout(() => setFlashVisible(false), 2000);
      return () => clearTimeout(timer);
    }
    
    if (mode === 'blanks') {
      const letters = currentWord.text.split('');
      const blankIndices = new Set<number>();
      const numBlanks = Math.min(3, Math.max(1, Math.floor(letters.length / 3)));
      while (blankIndices.size < numBlanks) {
        blankIndices.add(Math.floor(Math.random() * letters.length));
      }
      
      const data = letters.map((char, i) => ({
        char,
        isBlank: blankIndices.has(i)
      }));
      setBlanksData(data);
      setBlanksInput(letters.map((char, i) => blankIndices.has(i) ? '' : char));
    }
    
    if (mode === 'proofread') {
      const isCorrect = Math.random() > 0.5;
      setProofreadWord({
        text: isCorrect ? currentWord.text : mutateWord(currentWord.text),
        isCorrect
      });
    }
  }, [currentIndex, mode, list, isFinished]);

  const triggerSuccess = () => {
    setFeedback('correct');
    
    if (isTrial && starsEarnedInSession < 50) {
      storageService.addStars(5);
      setStarsEarnedInSession(prev => prev + 5);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9d50bb', '#ffd700', '#ffffff']
    });
  };

  const triggerFailure = () => {
    setFeedback('incorrect');

    if (isTrial) {
      setIsBackfire(true);
      storageService.lockGame(`${mode}-${id}`);
      setTimeout(() => {
        setIsFinished(true);
      }, 1500);
    }
  };

  const awardVoucher = () => {
    if (list) {
      const newVoucher = {
        id: crypto.randomUUID(),
        name: 'Magic Time',
        minutes: 15,
        earnedAt: Date.now(),
        listName: list.name
      };
      storageService.saveVoucher(newVoucher);
      setShowVoucher(true);
    }
  };

  const handleNext = () => {
    if (!list) return;
    
    if (currentIndex < list.words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setFeedback(null);
    } else {
      setIsFinished(true);
      awardVoucher();
    }
  };

  const handleSubmit = useCallback(() => {
    if (!list || feedback) return;

    const currentWord = list.words[currentIndex];
    let isCorrect = false;

    if (mode === 'blanks') {
      isCorrect = blanksInput.join('').toLowerCase() === currentWord.text.toLowerCase();
    } else {
      isCorrect = userInput.trim().toLowerCase() === currentWord.text.toLowerCase();
    }

    if (isCorrect) {
      triggerSuccess();
      setScore(s => s + 1);
      setTimeout(handleNext, 1500);
    } else {
      triggerFailure();
      if (mode === 'sudden-death') {
        setTimeout(() => {
          setCurrentIndex(0);
          setUserInput('');
          setFeedback(null);
          setScore(0);
          setStarsEarnedInSession(0);
        }, 1500);
      } else {
        setTimeout(() => {
          setFeedback(null);
          if (mode !== 'blanks') setUserInput('');
        }, 1500);
      }
    }
  }, [list, feedback, currentIndex, mode, blanksInput, userInput]);

  const onKeyPress = useCallback((key: string) => {
    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'BACKSPACE') {
      if (mode === 'blanks') {
        const lastBlankIdx = [...blanksInput].reverse().findIndex((val, i) => {
          const originalIdx = blanksInput.length - 1 - i;
          return blanksData[originalIdx].isBlank && val !== '';
        });
        if (lastBlankIdx !== -1) {
          const originalIdx = blanksInput.length - 1 - lastBlankIdx;
          const newBlanks = [...blanksInput];
          newBlanks[originalIdx] = '';
          setBlanksInput(newBlanks);
        }
      } else {
        setUserInput(prev => prev.slice(0, -1));
      }
    } else if (key.length === 1) {
      const char = key; // keyboard already emits the correct case
      if (mode === 'blanks') {
        const nextBlankIdx = blanksInput.findIndex((val, i) => blanksData[i].isBlank && val === '');
        if (nextBlankIdx !== -1) {
          const newBlanks = [...blanksInput];
          newBlanks[nextBlankIdx] = char;
          setBlanksInput(newBlanks);
          
          // Auto-submit if last blank filled
          const remainingBlanks = newBlanks.filter((val, i) => blanksData[i].isBlank && val === '').length;
          if (remainingBlanks === 0) {
            setTimeout(handleSubmit, 300);
          }
        }
      } else {
        setUserInput(prev => prev + char);
      }
    }
  }, [handleSubmit, mode, blanksInput, blanksData]);

  useEffect(() => {
    if (isFinished || feedback) {
      unregisterHandler();
      return;
    }

    registerHandler(onKeyPress);

    return () => unregisterHandler();
  }, [isFinished, feedback, registerHandler, unregisterHandler, onKeyPress]);

  const handleProofread = (choice: boolean) => {
    if (!proofreadWord || feedback) return;
    
    const isCorrect = choice === proofreadWord.isCorrect;
    if (isCorrect) {
      triggerSuccess();
      setScore(s => s + 1);
      setTimeout(handleNext, 1500);
    } else {
      triggerFailure();
      setTimeout(() => {
        setFeedback(null);
        const currentWord = list!.words[currentIndex];
        const nextIsCorrect = Math.random() > 0.5;
        setProofreadWord({
          text: nextIsCorrect ? currentWord.text : mutateWord(currentWord.text),
          isCorrect: nextIsCorrect
        });
      }, 1500);
    }
  };

  if (!list || !mode) return null;

  if (isFinished) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-6 text-center max-w-md w-full relative overflow-hidden"
        >
          <AnimatePresence>
            {showVoucher && (
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-0 bg-[var(--theme-color)] flex flex-col items-center justify-center text-white p-8 z-10"
              >
                <Sparkles size={60} className="mb-4 text-gold animate-pulse" />
                <h2 className="text-2xl font-black mb-2 text-glow uppercase">TREASURE FOUND!</h2>
                <p className="text-sm font-bold mb-8 text-white/80">A new voucher has appeared in your chest!</p>
                <button 
                  onClick={() => setShowVoucher(false)}
                  className="bg-white text-[var(--theme-color)] px-8 py-3 rounded-full font-bold shadow-lg"
                >
                  Behold!
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-[var(--theme-nebula)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gold shadow-[0_0_20px_var(--theme-glow)]">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 text-glow">Quest Complete!</h2>
          <p className="text-base text-[var(--theme-color)] font-bold mb-6">
            Score: {score} in {mode.replace('-', ' ')} mode!
            <br />
            Stars Earned: {starsEarnedInSession} ✨
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-[var(--theme-color)] text-white p-3 rounded-xl font-bold transition-all shadow-md hover:scale-[1.02]"
            >
              <RefreshCw size={20} />
              Re-enter Training
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 glass-button text-white p-3 rounded-xl font-bold transition-all"
            >
              <Home size={20} />
              Return to Sanctuary
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentWord = list.words[currentIndex];

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {isBackfire && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <div className="glass-card p-8 text-center space-y-4 max-w-xs w-full">
              <div className="text-6xl">🐸</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Spell Backfire!</h3>
              <p className="text-[var(--theme-color)] text-sm font-bold">
                The magic has twisted! This book is locked until the midnight reset.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 scrollable-content">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className="bg-[var(--theme-nebula)] border border-white/10 px-2 py-0.5 rounded-full text-[var(--theme-color)] font-bold text-[10px] uppercase tracking-widest">
                {mode}
              </div>
              <div className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white font-bold text-[10px]">
                {currentIndex + 1} / {list.words.length}
              </div>
            </div>
            <div className="text-gold font-black text-lg text-glow flex items-center gap-1">
              {score} <span className="text-sm">✨</span>
              <span className="text-xs text-[var(--theme-color)]/50 ml-1">({starsEarnedInSession}/50)</span>
            </div>
          </header>

          <div className="glass-card p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <motion.div 
                className="h-full bg-[var(--theme-color)] shadow-[0_0_10px_var(--theme-glow)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex) / list.words.length) * 100}%` }}
              />
            </div>

            <div className="text-center mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg mb-4 bg-white/5 text-white/10">
                <Sparkles size={24} />
              </div>
              
              {mode === 'flash' && flashVisible && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-3xl md:text-5xl font-black text-white tracking-widest text-glow"
                >
                  {currentWord.text}
                </motion.div>
              )}

              {mode === 'blanks' && (
                <div className="blanks-container mb-4">
                  {blanksData.map((data, i) => (
                    <div key={i} className="relative">
                      {data.isBlank ? (
                        <div
                          className={`
                            letter-box active text-center flex items-center justify-center text-2xl font-black
                            ${feedback === 'correct' ? 'correct' : feedback === 'incorrect' ? 'incorrect' : ''}
                            ${blanksInput[i] === '' ? 'border-[var(--theme-color)]/50' : 'border-[var(--theme-color)] shadow-[0_0_10px_var(--theme-glow)]'}
                          `}
                        >
                          {blanksInput[i]}
                        </div>
                      ) : (
                        <div className="letter-box disabled text-white/40">
                          {data.char}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mode === 'proofread' && proofreadWord && (
                <div className="text-3xl md:text-5xl font-black text-white tracking-widest text-glow">
                  {proofreadWord.text}
                </div>
              )}
            </div>

            {mode === 'proofread' ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleProofread(true)}
                  disabled={!!feedback}
                  className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl glass-button text-white font-black text-lg hover:border-[var(--theme-color)] active:scale-95 transition-all"
                >
                  <Check size={24} strokeWidth={4} />
                  TRUE
                </button>
                <button
                  onClick={() => handleProofread(false)}
                  disabled={!!feedback}
                  className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl glass-button text-white font-black text-lg hover:border-rose-500 active:scale-95 transition-all"
                >
                  <X size={24} strokeWidth={4} />
                  FALSE
                </button>
              </div>
            ) : mode !== 'blanks' ? (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    className={`
                      w-full text-xl md:text-2xl p-3 md:p-4 rounded-xl border-2 text-center transition-all font-bold min-h-[64px] flex items-center justify-center
                      ${feedback === 'correct' ? 'border-[var(--theme-color)] shadow-[0_0_20px_var(--theme-glow)] bg-[var(--theme-nebula)]' : 
                        feedback === 'incorrect' ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-rose-500/10' : 
                        'border-white/10 bg-white/5'}
                    `}
                  >
                    {userInput || (mode === 'flash' && flashVisible ? 'Memorizing...' : 'Cast spell...')}
                  </div>
                  
                  <AnimatePresence>
                    {feedback && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -right-2 -top-2"
                      >
                        {feedback === 'correct' ? (
                          <div className="bg-[var(--theme-color)] text-white p-1 rounded-full shadow-lg">
                            <Sparkles size={20} className="text-gold" />
                          </div>
                        ) : (
                          <div className="bg-rose-500 text-white p-1 rounded-full shadow-lg">
                            <XCircle size={20} />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}

            {feedback === 'incorrect' && (
              <div className="flex flex-col items-center mt-4">
                <motion.div className="frog-animation mb-1">
                  <div className="text-3xl">🐸</div>
                </motion.div>
                <motion.p 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center text-rose-400 font-bold text-xs"
                >
                  {mode === 'proofread' ? 'The spell was flawed!' : `The true incantation: ${currentWord.text}`}
                </motion.p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
