/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, Sparkles, Trophy, Star, Wand2, Merge } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Voucher } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import WheelOfWonders from './WheelOfWonders';
import TensionSlider from './TensionSlider';

export default function Rewards() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [stars, setStars] = useState(0);
  const [isEclipse, setIsEclipse] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  
  const voucherRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setVouchers(storageService.getVouchers());
    setUserName(storageService.getUserName() || 'Hero');
    setStars(storageService.getDailyStars());
    setIsEclipse(storageService.isEclipse());
  };

  const handleRedeem = (id: string) => {
    setRedeemingId(id);
    
    // Haptic feedback for redemption
    if (navigator.vibrate) {
      navigator.vibrate([20, 100, 20, 100]);
    }

    setTimeout(() => {
      storageService.deleteVoucher(id);
      refreshData();
      setRedeemingId(null);
      setShowFinalMessage(true);
      setTimeout(() => setShowFinalMessage(false), 3000);
    }, 1500);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
    navigator.vibrate(10);
  };

  const handleDrag = (id: string, info: any) => {
    const draggedVoucher = vouchers.find(v => v.id === id);
    if (!draggedVoucher) return;

    // Check for proximity to other identical vouchers
    let foundHover = null;
    for (const otherId in voucherRefs.current) {
      if (otherId === id) continue;
      
      const otherVoucher = vouchers.find(v => v.id === otherId);
      if (!otherVoucher || otherVoucher.name !== draggedVoucher.name || otherVoucher.minutes !== draggedVoucher.minutes) continue;

      const rect = voucherRefs.current[otherId]?.getBoundingClientRect();
      if (rect) {
        const dx = info.point.x - (rect.left + rect.width / 2);
        const dy = info.point.y - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          foundHover = otherId;
          // Increasing vibration 'hum'
          const intensity = Math.max(0, 100 - distance);
          if (intensity > 50) navigator.vibrate(5);
          break;
        }
      }
    }
    setHoveredId(foundHover);
  };

  const handleDragEnd = (id: string) => {
    if (hoveredId) {
      const v1 = vouchers.find(v => v.id === id);
      const v2 = vouchers.find(v => v.id === hoveredId);
      
      if (v1 && v2 && v1.name === v2.name && v1.minutes === v2.minutes) {
        // MERGE!
        navigator.vibrate(50); // Magnetic Snap thud
        
        const mergedVoucher: Voucher = {
          ...v2,
          id: Math.random().toString(36).substr(2, 9),
          minutes: v1.minutes + v2.minutes,
          earnedAt: Date.now()
        };
        
        storageService.deleteVoucher(v1.id);
        storageService.deleteVoucher(v2.id);
        storageService.saveVoucher(mergedVoucher);
        refreshData();
      }
    }
    setDraggedId(null);
    setHoveredId(null);
  };

  const totalMinutes = vouchers.reduce((acc, v) => acc + v.minutes, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {showFinalMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-white text-[var(--theme-color)] px-8 py-4 rounded-2xl font-black shadow-[0_0_50px_rgba(255,255,255,0.5)] border-2 border-[var(--theme-color)]"
          >
            "As you wish. The magic has been released."
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white text-glow">{userName}'s Treasure Chest 💎</h2>
            <p className="text-xs md:text-sm text-[var(--theme-color)] font-medium">Behold your earned mystic rewards.</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWheel(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all
              ${isEclipse 
                ? 'bg-gold text-[#1a1a2e] shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-pulse' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'}
            `}
          >
            <Star size={16} className={isEclipse ? 'fill-[#1a1a2e]' : ''} />
            WHEEL OF WONDERS
          </motion.button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollable-content">
          <div className="glass-card p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-gold/30 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <div className="flex items-center gap-4">
              <div className="bg-gold/20 p-4 rounded-2xl text-gold shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                <Clock size={32} />
              </div>
              <div>
                <div className="text-gold font-black text-4xl mb-0">{totalMinutes}</div>
                <div className="text-[var(--theme-color)] font-bold uppercase tracking-widest text-[10px]">Total Mystic Minutes</div>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <div className="flex items-center gap-2 bg-[var(--theme-nebula)] px-3 py-1 rounded-full border border-[var(--theme-color)]/30">
                <Star size={14} className="text-gold fill-gold" />
                <span className="text-white font-black text-sm">{stars} / 150</span>
              </div>
              <p className="text-[var(--theme-color)] font-medium text-[10px] max-w-[200px] text-center sm:text-right">
                Reach 150 stars to spin the Wheel of Wonders!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {vouchers.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full glass-card border-dashed border-2 border-white/10 p-12 text-center"
                >
                  <Trophy size={48} className="mx-auto mb-4 text-white/10" />
                  <p className="text-[var(--theme-color)] font-bold text-lg">Your chest is empty. Complete a quest to earn rewards!</p>
                </motion.div>
              ) : (
                vouchers.map((voucher) => (
                  <motion.div
                    key={voucher.id}
                    ref={el => voucherRefs.current[voucher.id] = el}
                    layout
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.8}
                    onDragStart={() => handleDragStart(voucher.id)}
                    onDrag={(e, info) => handleDrag(voucher.id, info)}
                    onDragEnd={() => handleDragEnd(voucher.id)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: hoveredId === voucher.id ? 1.1 : 1,
                      opacity: 1,
                      zIndex: draggedId === voucher.id ? 50 : 1,
                      borderColor: hoveredId === voucher.id ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.1)'
                    }}
                    exit={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                    className={`
                      glass-card p-5 relative overflow-hidden group cursor-grab active:cursor-grabbing
                      ${redeemingId === voucher.id ? 'border-gold shadow-[0_0_30px_rgba(255,215,0,0.5)]' : 'border-white/10'}
                      ${hoveredId === voucher.id ? 'shadow-[0_0_30px_rgba(255,215,0,0.3)]' : ''}
                    `}
                  >
                    {redeemingId === voucher.id && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white z-20 flex items-center justify-center overflow-hidden"
                      >
                        {/* Fire Whoosh Animation */}
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 4, opacity: 0 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute w-32 h-32 bg-gradient-to-t from-orange-500 via-yellow-400 to-white rounded-full blur-2xl"
                        />
                        <motion.div
                          initial={{ y: 0, opacity: 1 }}
                          animate={{ y: -200, opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeIn" }}
                          className="flex flex-col items-center"
                        >
                          <Sparkles size={64} className="text-gold animate-pulse" />
                          <span className="text-[var(--theme-color)] font-black text-xs mt-2 uppercase tracking-widest">Releasing Magic...</span>
                        </motion.div>
                        
                        {/* Particles */}
                        {Array.from({ length: 30 }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, scale: 1 }}
                            animate={{ 
                              x: (Math.random() - 0.5) * 400,
                              y: (Math.random() - 0.5) * 400,
                              scale: 0,
                              opacity: 0
                            }}
                            transition={{ duration: 1.2, delay: Math.random() * 0.2 }}
                            className="absolute w-2 h-2 bg-gold rounded-full blur-[1px]"
                          />
                        ))}
                      </motion.div>
                    )}

                    {hoveredId === voucher.id && (
                      <div className="absolute inset-0 bg-gold/10 flex items-center justify-center z-10">
                        <Merge size={48} className="text-gold animate-pulse" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[var(--theme-nebula)] p-2 rounded-xl text-[var(--theme-color)]">
                        <Wand2 size={20} />
                      </div>
                      <button 
                        onClick={() => {
                          storageService.deleteVoucher(voucher.id);
                          refreshData();
                        }}
                        className="text-white/10 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <div className="text-gold font-black text-3xl mb-0">{voucher.minutes} MINS</div>
                      <div className="text-white font-black text-lg uppercase tracking-tight truncate">
                        {voucher.name}
                      </div>
                      <div className="text-[var(--theme-color)] font-bold text-[10px] uppercase tracking-widest truncate opacity-50">
                        From: {voucher.listName}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <TensionSlider 
                        onComplete={() => handleRedeem(voucher.id)}
                        disabled={draggedId !== null}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showWheel && (
          <WheelOfWonders 
            onClose={() => setShowWheel(false)}
            onWin={() => {
              refreshData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
