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

export default function WitchsNoose() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [targetWord, setTargetWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  const { registerHandler, unregisterHandler, setKeyState, clearKeyStates } = useKeyboard();

  const MAX_MISTAKES = 13;

  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);
    if (found && found.words.length > 0) {
      setList(found);
      const randomWord = found.words[Math.floor(Math.random() * found.words.length)].text.toUpperCase();
      setTargetWord(randomWord);
      
      if (isTrial && storageService.isGameLocked(`witchs-noose-${listId}`)) {
        setGameOver(true);
        setWon(false);
      }
    } else {
      navigate('/portal');
    }

    return () => {
      clearKeyStates();
    };
  }, [listId, navigate, isTrial, clearKeyStates]);

  const onKeyPress = useCallback((key: string) => {
    if (gameOver || guessedLetters.includes(key) || !/^[A-Z]$/.test(key)) return;

    const newGuessed = [...guessedLetters, key];
    setGuessedLetters(newGuessed);

    if (!targetWord.includes(key)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setKeyState(key, 'disabled');

      if (newMistakes >= MAX_MISTAKES) {
        setGameOver(true);
        setWon(false);
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]); // Heavy shudder
        }
        if (isTrial) {
          storageService.lockGame(`witchs-noose-${listId}`);
        }
      }
    } else {
      setKeyState(key, 'correct');
      // Check win
      const isWon = targetWord.split('').every(char => newGuessed.includes(char));
      if (isWon) {
        setWon(true);
        setGameOver(true);
        if (isTrial) {
          storageService.addStars(50);
          setStarsEarned(50);
        }
      }
    }
  }, [gameOver, guessedLetters, targetWord, mistakes, isTrial, listId, setKeyState]);

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

  const renderWitchPart = (part: number) => {
    const opacity = mistakes >= part ? 1 : 0.1;
    const stroke = mistakes >= part ? 'var(--theme-color)' : 'rgba(255,255,255,0.1)';
    
    switch (part) {
      case 1: return <line x1="20" y1="230" x2="180" y2="230" stroke={stroke} strokeWidth="4" />; // Base
      case 2: return <line x1="50" y1="230" x2="50" y2="20" stroke={stroke} strokeWidth="4" />; // Main strut
      case 3: return <line x1="50" y1="190" x2="80" y2="230" stroke={stroke} strokeWidth="4" />; // Left support
      case 4: return <line x1="50" y1="190" x2="20" y2="230" stroke={stroke} strokeWidth="4" />; // Right support
      case 5: return <line x1="50" y1="20" x2="150" y2="20" stroke={stroke} strokeWidth="4" />; // Crossbeam
      case 6: return <line x1="50" y1="60" x2="90" y2="20" stroke={stroke} strokeWidth="4" />; // Crossbeam support
      case 7: return <line x1="150" y1="20" x2="150" y2="50" stroke={stroke} strokeWidth="2" strokeDasharray="4 2" />; // Rope
      case 8: return <circle cx="150" cy="70" r="20" fill="none" stroke={stroke} strokeWidth="3" />; // Head
      case 9: return <line x1="150" y1="90" x2="150" y2="150" stroke={stroke} strokeWidth="3" />; // Body
      case 10: return <line x1="150" y1="110" x2="120" y2="140" stroke={stroke} strokeWidth="3" />; // Left arm
      case 11: return <line x1="150" y1="110" x2="180" y2="140" stroke={stroke} strokeWidth="3" />; // Right arm
      case 12: return <line x1="150" y1="150" x2="120" y2="200" stroke={stroke} strokeWidth="3" />; // Left leg
      case 13: return <line x1="150" y1="150" x2="180" y2="200" stroke={stroke} strokeWidth="3" />; // Right leg
      default: return null;
    }
  };

  if (!list) return null;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">The Witch's Noose</h2>
        <p className="text-[var(--theme-color)] text-xs font-bold uppercase tracking-widest opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice Mode'} • {list.name}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-12 scrollable-content">
        {/* Gallows SVG */}
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-[0_0_15px_var(--theme-glow)]">
            {Array.from({ length: 13 }).map((_, i) => (
              <React.Fragment key={i + 1}>
                {renderWitchPart(i + 1)}
              </React.Fragment>
            ))}
          </svg>
          
          <div className="absolute top-2 right-2 glass-card px-3 py-1 border-[var(--theme-color)]/30">
            <span className="text-xs font-black text-white">{MAX_MISTAKES - mistakes} CHIMES LEFT</span>
          </div>
        </div>

        {/* Word Display */}
        <div className="flex flex-wrap justify-center gap-2">
          {targetWord.split('').map((char, i) => (
            <div 
              key={i}
              className={`
                w-8 h-10 md:w-10 md:h-12 border-b-4 flex items-center justify-center text-2xl font-black transition-all
                ${guessedLetters.includes(char) ? 'text-white border-[var(--theme-color)]' : 'text-transparent border-white/20'}
              `}
            >
              {char}
            </div>
          ))}
        </div>
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
              <div className="text-6xl">{won ? '✨' : '🐸'}</div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                  {won ? 'Curse Broken!' : 'Spell Backfire!'}
                </h3>
                <p className="text-[var(--theme-color)] text-sm font-bold mt-2 leading-relaxed">
                  {won 
                    ? `The spirit is free! You earned ${starsEarned} stars.` 
                    : `The 13th chime has struck. The word was: ${targetWord}. This book is locked.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/portal')}
                className="w-full py-4 bg-[var(--theme-color)] text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_var(--theme-glow)]"
              >
                Return to Portal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
