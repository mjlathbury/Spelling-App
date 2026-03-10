/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Trophy, Star } from 'lucide-react';
import { storageService } from '../services/storageService';
import { PrizeDefinition, Voucher } from '../types';

interface WheelOfWondersProps {
  onClose: () => void;
  onWin: (voucher: Voucher) => void;
}

export default function WheelOfWonders({ onClose, onWin }: WheelOfWondersProps) {
  const [prizes, setPrizes] = useState<PrizeDefinition[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningPrize, setWinningPrize] = useState<PrizeDefinition | null>(null);
  const [stars, setStars] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastSegmentRef = useRef<number>(-1);

  useEffect(() => {
    setPrizes(storageService.getPrizes());
    setStars(storageService.getDailyStars());
  }, []);

  const spinWheel = () => {
    if (isSpinning || stars < 150 || prizes.length === 0) return;

    storageService.spendStars(150);
    setStars(storageService.getDailyStars());
    setIsSpinning(true);
    setWinningPrize(null);

    // Calculate a random winning segment
    const segmentAngle = 360 / prizes.length;
    const winningIndex = Math.floor(Math.random() * prizes.length);
    
    // Add multiple full rotations (5-10) plus the target angle
    const extraRotations = (5 + Math.floor(Math.random() * 5)) * 360;
    const targetRotation = rotation + extraRotations + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetRotation);

    // Track segment passes for haptics
    const startTime = Date.now();
    const duration = 5000; // 5 seconds spin

    const checkHaptics = () => {
      if (!isSpinning) return;
      
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for rotation progress
      const currentRotation = rotation + (targetRotation - rotation) * (1 - Math.pow(1 - progress, 3));
      const currentSegment = Math.floor((currentRotation % 360) / segmentAngle);
      
      if (currentSegment !== lastSegmentRef.current) {
        navigator.vibrate(5);
        lastSegmentRef.current = currentSegment;
      }

      if (progress < 1) {
        requestAnimationFrame(checkHaptics);
      }
    };

    requestAnimationFrame(checkHaptics);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = prizes[winningIndex];
      setWinningPrize(prize);
      
      const newVoucher: Voucher = {
        id: Math.random().toString(36).substr(2, 9),
        name: prize.name,
        minutes: prize.minutes,
        earnedAt: Date.now(),
        listName: 'Wheel of Wonders'
      };
      
      storageService.saveVoucher(newVoucher);
      onWin(newVoucher);
    }, duration);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
    >
      <div className="max-w-md w-full text-center relative">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-black text-white mb-2 text-glow">Wheel of Wonders</h2>
          <p className="text-[var(--theme-color)] font-medium">Sacrifice 150 stars for a legendary prize!</p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="bg-[var(--theme-nebula)] px-4 py-2 rounded-full flex items-center gap-2 border border-[var(--theme-color)]/30">
              <Star size={20} className="text-gold fill-gold" />
              <span className="text-white font-black">{stars} / 150</span>
            </div>
          </div>
        </motion.div>

        {/* The Wheel */}
        <div className="relative aspect-square w-full max-w-[320px] mx-auto mb-12">
          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center border-4 border-black">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-gold absolute -bottom-3"></div>
            </div>
          </div>

          <motion.div
            ref={wheelRef}
            animate={{ rotate: rotation }}
            transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
            className="w-full h-full rounded-full border-8 border-[var(--theme-color)]/30 relative overflow-hidden shadow-[0_0_50px_var(--theme-glow)] bg-black"
          >
            {prizes.map((prize, i) => {
              const angle = 360 / prizes.length;
              const rotate = i * angle;
              const skew = 90 - angle;
              
              return (
                <div
                  key={prize.id}
                  className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                  style={{
                    transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                    backgroundColor: i % 2 === 0 ? 'var(--theme-nebula)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--theme-color-30)'
                  }}
                >
                  <div 
                    className="absolute bottom-0 left-0 w-[200%] h-[200%] flex items-center justify-center"
                    style={{
                      transform: `skewY(${skew}deg) rotate(${angle / 2}deg) translateY(-25%)`,
                    }}
                  >
                    <div className="flex flex-col items-center text-white font-black text-[10px] uppercase tracking-tighter">
                      <span className="text-gold">{prize.minutes}m</span>
                      <span className="opacity-50">{prize.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
          
          {/* Center Hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-[var(--theme-color)] rounded-full border-4 border-black shadow-[0_0_20px_var(--theme-glow)] flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
          </div>
        </div>

        <button
          disabled={isSpinning || stars < 150 || prizes.length === 0}
          onClick={spinWheel}
          className={`
            w-full py-5 rounded-2xl font-black text-2xl transition-all flex items-center justify-center gap-3
            ${stars >= 150 && !isSpinning 
              ? 'bg-[var(--theme-color)] text-white shadow-[0_0_30px_var(--theme-glow)] hover:scale-105 active:scale-95' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          <Sparkles size={28} className={stars >= 150 ? 'text-gold' : ''} />
          {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
        </button>

        {/* Win Popup */}
        <AnimatePresence>
          {winningPrize && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="glass-card p-12 max-w-sm w-full text-center border-gold shadow-[0_0_100px_rgba(255,215,0,0.3)] pointer-events-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 opacity-10 pointer-events-none"
                >
                  <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,gold,transparent)] rounded-full" />
                </motion.div>
                
                <div className="bg-gold/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gold shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                  <Trophy size={48} />
                </div>
                
                <h3 className="text-3xl font-black text-white mb-2">Legendary Discovery!</h3>
                <p className="text-[var(--theme-color)] font-medium mb-8">
                  You have unearthed a <span className="text-gold font-bold">{winningPrize.minutes}m {winningPrize.name}</span> voucher.
                </p>
                
                <button
                  onClick={() => setWinningPrize(null)}
                  className="w-full bg-gold text-black py-4 rounded-xl font-black text-lg hover:scale-105 transition-transform"
                >
                  CLAIM REWARD
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
