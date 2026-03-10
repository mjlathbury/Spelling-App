/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Sparkles, Flame } from 'lucide-react';
import { storageService } from '../services/storageService';

interface TensionSliderProps {
  onComplete: () => void;
  disabled?: boolean;
}

export default function TensionSlider({ onComplete, disabled }: TensionSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // Map x position to progress (0-100)
  const glowOpacity = useTransform(x, [0, 280], [0, 1]);
  const glowScale = useTransform(x, [0, 280], [0.8, 1.2]);
  const glowColor = useTransform(x, [0, 280], ['var(--theme-glow)', 'rgba(255, 255, 255, 1)']);

  const handleDrag = (_: any, info: { offset: { x: number }, point: { x: number } }) => {
    if (isCompleted || disabled) return;
    
    const containerWidth = containerRef.current?.offsetWidth || 280;
    const currentX = Math.max(0, Math.min(containerWidth - 48, info.point.x - (containerRef.current?.getBoundingClientRect().left || 0) - 24));
    const newProgress = (currentX / (containerWidth - 48)) * 100;
    
    setProgress(newProgress);
    
    if (newProgress >= 98) {
      triggerComplete();
    }
  };

  const handleDragEnd = () => {
    if (isCompleted || disabled) return;
    
    if (progress < 98) {
      // Snap back
      navigator.vibrate(20); // Thud haptic
      setProgress(0);
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  const triggerComplete = () => {
    setIsCompleted(true);
    setProgress(100);
    controls.start({ x: (containerRef.current?.offsetWidth || 280) - 48 });
    
    // High-pitched sparkle sound
    navigator.vibrate([10, 50, 10, 50]);
    
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div className="relative w-full h-12 select-none" ref={containerRef}>
      {/* Track */}
      <div className="absolute inset-0 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-[var(--theme-color)]/20 via-[var(--theme-color)]/40 to-white"
          style={{ width: `${progress}%`, opacity: glowOpacity }}
        />
      </div>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ 
          boxShadow: `0 0 30px ${glowColor}`,
          opacity: glowOpacity,
          scale: glowScale
        }}
      />

      {/* Handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: (containerRef.current?.offsetWidth || 280) - 48 }}
        dragElastic={0}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={`
          absolute top-0 left-0 w-12 h-12 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-10
          ${isCompleted ? 'bg-white text-[var(--theme-color)] shadow-[0_0_30px_#fff]' : 'bg-[var(--theme-color)] text-white shadow-lg'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isCompleted ? <Flame size={24} className="animate-pulse" /> : <Sparkles size={24} />}
      </motion.div>

      {/* Instructions */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-opacity duration-300 ${progress > 20 ? 'opacity-0' : 'opacity-30 text-white'}`}>
          Slide to Release Magic
        </span>
      </div>

      {/* Particles (Canvas would be better, but CSS for simplicity/speed) */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-visible"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: (containerRef.current?.offsetWidth || 280) - 24, y: 24, scale: 1 }}
                animate={{ 
                  x: (containerRef.current?.offsetWidth || 280) - 24 + (Math.random() - 0.5) * 200,
                  y: 24 + (Math.random() - 0.5) * 200,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-2 h-2 bg-white rounded-full blur-[1px]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
