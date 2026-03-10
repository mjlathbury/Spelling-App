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

interface Bubble {
  id: number;
  char: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

export default function LexiconLeak() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const { registerHandler, unregisterHandler } = useKeyboard();

  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);
    if (found && found.words.length > 0) {
      setList(found);
      setupWord(found.words[0].text.toUpperCase());
    } else {
      navigate('/portal');
    }
  }, [listId, navigate]);

  const setupWord = (word: string) => {
    setTargetWord(word);
    setUserInput('');
    setFeedback(null);
    
    const scrambled = word.split('').sort(() => Math.random() - 0.5);
    const newBubbles = scrambled.map((char, i) => ({
      id: i,
      char,
      x: Math.random() * 80 + 10, // 10% to 90%
      y: Math.random() * 40 + 10, // 10% to 50%
      duration: isTrial ? 2 + Math.random() * 2 : 4 + Math.random() * 3,
      delay: Math.random() * 2
    }));
    setBubbles(newBubbles);
  };

  const onKeyPress = useCallback((key: string) => {
    if (feedback || gameOver) return;

    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'BACKSPACE') {
      setUserInput(prev => prev.slice(0, -1));
    } else if (userInput.length < targetWord.length && /^[A-Z]$/.test(key)) {
      setUserInput(prev => prev + key);
    }
  }, [feedback, gameOver, userInput, targetWord]);

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

  const handleSubmit = () => {
    if (userInput === targetWord) {
      setFeedback('correct');
      
      if (isTrial) {
        storageService.addStars(5);
        setStarsEarned(prev => Math.min(50, prev + 5));
      }

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (list && nextIndex < list.words.length) {
          setCurrentIndex(nextIndex);
          setupWord(list.words[nextIndex].text.toUpperCase());
        } else {
          setGameOver(true);
        }
      }, 1500);
    } else {
      setFeedback('incorrect');
      
      if (isTrial) {
        storageService.lockGame(`lexicon-leak-${listId}`);
        setTimeout(() => setGameOver(true), 1500);
      } else {
        setTimeout(() => {
          setFeedback(null);
          setUserInput('');
        }, 1500);
      }
    }
  };

  if (!list) return null;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">The Lexicon Leak</h2>
        <p className="text-[var(--theme-color)] text-xs font-bold uppercase tracking-widest opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice Mode'} • {currentIndex + 1}/{list.words.length} Translated
        </p>
      </div>

      {/* Bubbles Area */}
      <div className="flex-1 relative scrollable-content pb-12">
        <AnimatePresence>
          {!feedback && bubbles.map((b) => (
            <motion.div
              key={`${currentIndex}-${b.id}`}
              initial={{ y: '100vh', opacity: 0 }}
              animate={{ 
                y: [0, -20, 0],
                x: [0, 10, -10, 0],
                opacity: 1 
              }}
              transition={{
                y: { duration: b.duration, repeat: Infinity, ease: 'easeInOut' },
                x: { duration: b.duration * 1.5, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.5 }
              }}
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              className="absolute w-12 h-12 rounded-full bg-[var(--theme-nebula)] border border-[var(--theme-color)]/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_15px_var(--theme-glow)]"
            >
              <span className="text-xl font-black text-white text-glow">{b.char}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Crystal Jar / Input Area */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
          <div className="relative group">
            {/* Jar SVG */}
            <svg width="200" height="120" viewBox="0 0 200 120" className="drop-shadow-[0_0_20px_var(--theme-glow)]">
              <path 
                d="M40,10 Q40,0 50,0 L150,0 Q160,0 160,10 L160,30 Q160,40 170,40 L180,40 Q200,40 200,60 L200,100 Q200,120 180,120 L20,120 Q0,120 0,100 L0,60 Q0,40 20,40 L30,40 Q40,40 40,30 Z" 
                fill="rgba(255,255,255,0.05)" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="2"
              />
              <path 
                d="M40,20 L160,20" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <span className={`text-3xl font-black tracking-widest transition-all ${feedback === 'correct' ? 'text-emerald-400' : feedback === 'incorrect' ? 'text-rose-400' : 'text-white'}`}>
                {userInput}
                {userInput.length < targetWord.length && (
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-1 h-8 bg-[var(--theme-color)] ml-1"
                  />
                )}
              </span>
            </div>
          </div>
          
          <p className="text-[10px] font-black text-[var(--theme-color)] uppercase tracking-widest opacity-50">
            Translate the floating runes
          </p>
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
              <div className="text-6xl">{starsEarned > 0 ? '🏺' : '🐸'}</div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                  {starsEarned > 0 ? 'Translation Success!' : 'Lexicon Backfire!'}
                </h3>
                <p className="text-[var(--theme-color)] text-sm font-bold mt-2">
                  {starsEarned > 0 
                    ? `You successfully translated the scrolls. You earned ${starsEarned} stars!` 
                    : `The words have boiled over. This book is locked.`}
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
