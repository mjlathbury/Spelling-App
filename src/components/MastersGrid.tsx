/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { useKeyboard } from '../context/KeyboardContext';
import { SpellingList } from '../types';

export default function MastersGrid() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;
  
  const [list, setList] = useState<SpellingList | null>(null);
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [starsEarned, setStarsEarned] = useState(0);
  
  const { registerHandler, unregisterHandler, setKeyState, clearKeyStates } = useKeyboard();

  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);
    if (found && found.words.length > 0) {
      setList(found);
      const randomWord = found.words[Math.floor(Math.random() * found.words.length)].text.toUpperCase();
      setTargetWord(randomWord);
      setMaxGuesses(Math.max(6, Math.min(8, randomWord.length + 1)));
      
      if (isTrial && storageService.isGameLocked(`masters-grid-${listId}`)) {
        setGameOver(true);
        setWon(false);
      }
    } else {
      navigate('/training');
    }

    return () => {
      clearKeyStates();
    };
  }, [listId, navigate, isTrial, clearKeyStates]);

  const onKeyPress = useCallback((key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length === targetWord.length) {
        submitGuess();
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < targetWord.length && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameOver, currentGuess, targetWord]);

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

  const submitGuess = () => {
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    
    // Update keyboard states
    currentGuess.split('').forEach((char, i) => {
      if (targetWord[i] === char) {
        setKeyState(char, 'correct');
      } else if (targetWord.includes(char)) {
        setKeyState(char, 'misplaced');
      } else {
        setKeyState(char, 'disabled');
      }
    });

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
      if (isTrial) {
        storageService.addStars(50);
        setStarsEarned(50);
      }
    } else if (newGuesses.length >= maxGuesses) {
      setWon(false);
      setGameOver(true);
      if (isTrial) {
        storageService.lockGame(`masters-grid-${listId}`);
      }
    } else {
      setCurrentGuess('');
    }
  };

  const getCellColor = (guess: string, index: number) => {
    const char = guess[index];
    if (targetWord[index] === char) return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400'; // Glowing Ember
    if (targetWord.includes(char)) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-400'; // Swirling Mist
    return 'bg-zinc-800 border-zinc-700 opacity-50'; // Fade to Shadow
  };

  if (!list) return null;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Game Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">The Master's Grid</h2>
        <p className="text-[var(--theme-color)] text-xs font-bold uppercase tracking-widest opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice Mode'} • {list.name}
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-start gap-2 overflow-y-auto pb-12 scrollable-content">
        {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
          const isSubmitted = rowIndex < guesses.length;

          return (
            <div key={rowIndex} className="flex gap-2">
              {Array.from({ length: targetWord.length }).map((_, colIndex) => (
                <motion.div
                  key={colIndex}
                  initial={false}
                  animate={isSubmitted ? { rotateX: 360 } : {}}
                  transition={{ duration: 0.5, delay: colIndex * 0.1 }}
                  className={`
                    w-12 h-12 xs:w-14 xs:h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black text-white transition-all
                    ${isSubmitted ? getCellColor(guesses[rowIndex], colIndex) : 'bg-white/5 border-white/10'}
                    ${rowIndex === guesses.length && colIndex === currentGuess.length ? 'border-[var(--theme-color)] shadow-[0_0_10px_var(--theme-glow)]' : ''}
                  `}
                >
                  {guess[colIndex] || ''}
                </motion.div>
              ))}
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
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <div className="glass-card p-8 text-center space-y-6 max-w-xs w-full">
              <div className="text-6xl">{won ? '🏆' : '🌑'}</div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                  {won ? 'Mastery Achieved!' : 'The Eclipse Falls'}
                </h3>
                <p className="text-[var(--theme-color)] text-sm font-bold mt-2">
                  {won ? `You earned ${starsEarned} stars!` : `The word was: ${targetWord}. This book is locked until tomorrow.`}
                </p>
              </div>
              <button
                  onClick={() => navigate('/training')}
                  className="w-full py-4 bg-[var(--theme-color)] text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_var(--theme-glow)]"
                >
                  Return to Training
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
