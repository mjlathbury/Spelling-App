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

// --- Web Audio Helpers ---
function playPopSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.13);
    osc.onended = () => ctx.close();
  } catch {}
}

function playMagicSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.36);
      if (i === notes.length - 1) osc.onended = () => ctx.close();
    });
  } catch {}
}

interface Bubble {
  id: number;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPopping?: boolean;
}

export default function LexiconLeak() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120.0); // 120 Seconds per world
  const [isResetting, setIsResetting] = useState(false);
  const resetTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestRef = React.useRef<number>(0);

  const { registerHandler, unregisterHandler } = useKeyboard();

  // Word Randomization on Load
  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);
    if (found && found.words.length > 0) {
      setList(found);
      const words = found.words.map(w => w.text.toUpperCase()).sort(() => Math.random() - 0.5);
      setShuffledWords(words);
      setupWord(words[0]);
    } else {
      navigate('/portal');
    }
  }, [listId, navigate]);

  // Physics & Timer Loop
  const updatePhysics = useCallback(() => {
    if (gameOver) return; // timer keeps running even during feedback

    setBubbles(prevBubbles => prevBubbles.map(b => {
      if (b.isPopping) return b;

      let nextX = b.x + b.vx;
      let nextY = b.y + b.vy;
      let nextVx = b.vx;
      let nextVy = b.vy;

      // Stage constraints (0-100% width, 0-80% height of stage container)
      if (nextX <= 5) nextVx = Math.abs(b.vx);
      if (nextX >= 95) nextVx = -Math.abs(b.vx);
      
      if (nextY <= 5) nextVy = Math.abs(b.vy);
      if (nextY >= 60) nextVy = -Math.abs(b.vy);

      return {
        ...b,
        x: Math.max(0, Math.min(100, nextX)),
        y: Math.max(0, Math.min(60, nextY)),
        vx: nextVx,
        vy: nextVy
      };
    }));

    // Update Timer
    setTimeLeft(prev => {
      const nextTime = prev - 0.016;
      if (nextTime <= 0) {
        setGameOver(true);
        return 0;
      }
      return nextTime;
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [gameOver, feedback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics]);

  const setupWord = useCallback((word: string) => {
    setTargetWord(word);
    setUserInput('');
    setFeedback(null);
    
    const scrambled = word.split('').sort(() => Math.random() - 0.5);
    const newBubbles = scrambled.map((char) => ({
      id: Math.random(),
      char,
      x: Math.random() * 80 + 10,
      y: Math.random() * 48 + 5,
      vx: (Math.random() - 0.5) * 0.4, 
      vy: (Math.random() - 0.5) * 0.4
    }));
    setBubbles(newBubbles);
  }, []);

  const handleSubmit = useCallback((input: string) => {
    if (input.toUpperCase() === targetWord) {
      playMagicSound();
      setFeedback('correct');
      if (isTrial) {
        storageService.addStars(5);
        setStarsEarned(prev => Math.min(50, prev + 5));
      }
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (shuffledWords && nextIndex < shuffledWords.length) {
          setCurrentIndex(nextIndex);
          setupWord(shuffledWords[nextIndex]);
        } else {
          setGameOver(true);
        }
      }, 1200);
    } else {
      setFeedback('incorrect');
      if (isTrial) storageService.lockGame(`lexicon-leak-${listId}`);
      setTimeout(() => setGameOver(true), 1500);
    }
  }, [currentIndex, shuffledWords, targetWord, setupWord, isTrial, listId]);

  const handleBubblePop = useCallback((bubbleId: number) => {
    setBubbles(prev => prev.map(b => b.id === bubbleId ? { ...b, isPopping: true } : b));
    playPopSound();
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubbleId));
    }, 200);
  }, []);

  // Shared inner typing logic to prevent recursion/double-popping
  const handleTyping = useCallback((char: string) => {
    if (userInput.length < targetWord.length && /^[A-Za-z\s]$/.test(char)) {
      const nextInput = userInput + char;
      setUserInput(nextInput);
      if (nextInput.length === targetWord.length) {
        handleSubmit(nextInput);
      }
    }
  }, [userInput, targetWord, handleSubmit]);

  const onKeyPress = useCallback((key: string) => {
    if (feedback || gameOver) return;

    if (key === 'BACKSPACE') {
      setUserInput(prev => prev.slice(0, -1));
    } else {
      // Match bubble by uppercase key (bubbles still hold uppercase chars)
      const matchingBubble = bubbles.find(b => b.char === key.toUpperCase() && !b.isPopping);
      if (matchingBubble) {
        handleBubblePop(matchingBubble.id);
      }
      handleTyping(key);
    }
  }, [feedback, gameOver, handleTyping, bubbles, handleBubblePop]);

  const handleBubblePress = useCallback((bubbleId: number, char: string) => {
    if (feedback || gameOver) return;
    handleBubblePop(bubbleId);
    handleTyping(char); // Call handleTyping DIRECTLY, no bubble search needed
  }, [feedback, gameOver, handleBubblePop, handleTyping]);

  const startResetTimer = () => {
    setIsResetting(true);
    resetTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setupWord(targetWord);
      setIsResetting(false);
    }, 1000); // 1 second hold on lid
  };

  const cancelResetTimer = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setIsResetting(false);
  };

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

  if (!list) return null;

  // Fill level: rises per letter typed in the current word
  const fillPercent = targetWord.length > 0
    ? Math.min(100, Math.round((userInput.length / targetWord.length) * 100))
    : 0;

  return (
    <div className="h-full relative overflow-hidden bg-[#050510]">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,var(--theme-glow)_0%,transparent_70%)]" />
      </div>

      {/* Large ghost timer backdrop — fills the background of the play area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ top: '10%', bottom: '35%' }}>
        <span className="text-[40vw] font-black tabular-nums leading-none select-none"
          style={{ color: 'rgba(255,255,255,0.13)' }}
        >
          {Math.ceil(timeLeft)}
        </span>
      </div>

      {/* Header — centred */}
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 z-50 pointer-events-none">
        <h2 className="text-base font-black text-white/80 uppercase tracking-[0.2em]">Lexicon Leak</h2>
        <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-widest opacity-70">
          Word {currentIndex + 1} / {shuffledWords.length} · {isTrial ? 'Trial' : 'Practice'}
        </span>
      </div>

      {/* Full-Screen Bubble Stage */}
      <div className="absolute inset-0">
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={false}
            animate={b.isPopping ? {
              scale: [1, 3.5],
              opacity: 0,
              filter: 'blur(20px)'
            } : {
              scale: 1,
              opacity: 1
            }}
            transition={b.isPopping ? { duration: 0.25 } : { duration: 0.15 }}
            onPointerDown={() => handleBubblePress(b.id, b.char)}
            className={`
              absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full
              flex items-center justify-center
              shadow-[0_0_25px_var(--theme-glow)] cursor-pointer z-40 select-none
              ${b.isPopping ? 'bg-white pointer-events-none' : 'glass-card bg-[var(--theme-nebula)] border-[var(--theme-color)]/50 backdrop-blur-md active:scale-90'}
            `}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            <span className={`text-3xl font-black pointer-events-none
              ${b.isPopping ? 'text-black' : 'text-white drop-shadow-[0_0_8px_var(--theme-glow)]'}
            `}>
              {b.char}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Jar — fixed absolute bottom, centred — whole jar is press-hold target */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50">
        <div
          className="relative select-none cursor-pointer"
          onPointerDown={startResetTimer}
          onPointerUp={cancelResetTimer}
          onPointerLeave={cancelResetTimer}
        >

          {/* Realistic Glass Jar SVG — rounder, more jar-like */}
          <svg width="280" height="260" viewBox="0 0 220 200" preserveAspectRatio="xMidYMax meet"
            className="block"
            style={{ filter: 'drop-shadow(0 0 24px var(--theme-glow))' }}
          >
            <defs>
              {/* Clip to jar body only */}
              <clipPath id="jarBodyClip">
                <path d="M18,65 Q15,60 18,58 L202,58 Q205,60 202,65 L202,175 Q202,192 185,192 L35,192 Q18,192 18,175 Z" />
              </clipPath>
              <linearGradient id="jarGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
              </linearGradient>
              <linearGradient id="jarFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--theme-color)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--theme-glow)" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Lid top cap */}
            <rect x="72" y="3" width="76" height="16" rx="8"
              fill={isResetting ? 'var(--theme-color)' : 'rgba(255,255,255,0.14)'}
              stroke={isResetting ? 'var(--theme-glow)' : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5"
              style={{ transition: 'fill 0.2s, stroke 0.2s' }}
            />
            {/* Lid band / rim */}
            <rect x="68" y="17" width="84" height="12" rx="5"
              fill={isResetting ? 'rgba(160,100,255,0.2)' : 'rgba(255,255,255,0.09)'}
              stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
            />

            {/* Neck — narrower than body */}
            <rect x="80" y="29" width="60" height="28" rx="2"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"
            />

            {/* Shoulder curves — widen from neck to body */}
            <path d="M80,57 Q50,57 18,65 L18,58 Q50,52 80,57 Z" fill="rgba(255,255,255,0.05)" />
            <path d="M140,57 Q170,57 202,65 L202,58 Q170,52 140,57 Z" fill="rgba(255,255,255,0.05)" />

            {/* Wide jar body */}
            <path
              d="M18,62 Q16,58 18,58 L202,58 Q204,58 202,62 L202,175 Q202,193 185,193 L35,193 Q18,193 18,175 Z"
              fill="url(#jarGlass)"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />

            {/* Liquid fill — rises per letter typed */}
            <rect
              x="20" y={62 + (120 * (1 - fillPercent / 100))}
              width="180" height={Math.max(0, 120 * fillPercent / 100) + 18}
              fill="url(#jarFill)"
              clipPath="url(#jarBodyClip)"
              style={{ transition: 'y 0.35s ease, height 0.35s ease' }}
            />
            {/* Liquid surface shimmer */}
            {fillPercent > 0 && (
              <rect
                x="20" y={62 + (120 * (1 - fillPercent / 100))}
                width="180" height="5" rx="2.5"
                fill="rgba(255,255,255,0.35)"
                clipPath="url(#jarBodyClip)"
                style={{ transition: 'y 0.35s ease' }}
              />
            )}

            {/* Left glass highlight */}
            <path d="M40,70 Q36,100 38,140" stroke="rgba(255,255,255,0.4)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M52,67 Q49,88 50,112" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Bottom reflection */}
            <ellipse cx="110" cy="186" rx="72" ry="6" fill="rgba(255,255,255,0.07)" />
          </svg>

          {/* Reset progress ring — sweeps around lid when holding */}
          {isResetting && (
            <div className="absolute pointer-events-none inset-0 flex items-start justify-center">
              <svg width="84" height="30" viewBox="0 0 84 30" className="mt-1">
                <circle cx="42" cy="15" r="12"
                  fill="none" stroke="var(--theme-color)" strokeWidth="3"
                  strokeDasharray="75" strokeDashoffset="75"
                  style={{ animation: 'lid-ring 1s linear forwards', transformOrigin: '42px 15px', transform: 'rotate(-90deg)' }}
                />
              </svg>
            </div>
          )}

          {/* Typed letters inside the jar */}
          <div className="absolute inset-0 flex items-end justify-center pb-16">
            <span className={`text-3xl font-black tracking-[0.25em] transition-colors drop-shadow-md leading-tight
              ${feedback === 'correct' ? 'text-emerald-300' : feedback === 'incorrect' ? 'text-rose-400' : 'text-white'}
            `}>
              {userInput}
            </span>
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-[#020208]/90 backdrop-blur-2xl"
          >
            <div className="glass-card p-12 text-center space-y-10 max-w-sm w-full border-[var(--theme-color)]/40 shadow-2xl">
              <div className="text-9xl drop-shadow-[0_0_40px_var(--theme-glow)]">
                {starsEarned > 0 && feedback === 'correct' ? '🏺' : '🌌'}
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white uppercase tracking-[0.2em] leading-none">
                  {starsEarned > 0 && feedback === 'correct' ? 'List Captured' : 'Void Reclaimed'}
                </h3>
                <p className="text-[var(--theme-color)] text-base font-bold leading-relaxed opacity-80">
                  {starsEarned > 0 && feedback === 'correct'
                    ? `You contained ${starsEarned > 0 ? starsEarned : 'all'} runes. ${starsEarned} stars earned.`
                    : `The runes have returned to the void. Be faster next time.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/portal')}
                className="w-full py-6 bg-[var(--theme-color)] text-white font-black rounded-[2rem] uppercase tracking-[0.3em] shadow-[0_0_40px_var(--theme-glow)] active:scale-95 transition-all"
              >
                Return to Portal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes progress-ring {
          from { stroke-dashoffset: 500; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes lid-ring {
          from { stroke-dashoffset: 63; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}



