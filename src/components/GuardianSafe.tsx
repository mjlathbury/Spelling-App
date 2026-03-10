/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService } from '../services/storageService';
import { PrizeDefinition } from '../types';

interface GuardianSafeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuardianSafe({ isOpen, onClose }: GuardianSafeProps) {
  const [step, setStep] = useState<'pin' | 'setup' | 'menu' | 'factory'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [error, setError] = useState(false);
  
  // Prize Factory State
  const [prizes, setPrizes] = useState<PrizeDefinition[]>([]);
  const [newPrize, setNewPrize] = useState<Partial<PrizeDefinition>>({
    name: '',
    minutes: 15,
    tierColor: 'lilac',
    weeklyLimit: false,
    mergeable: true
  });

  useEffect(() => {
    const pin = storageService.getPIN();
    setSavedPin(pin);
    if (!pin) {
      setStep('setup');
    } else {
      setStep('pin');
    }
    setPrizes(storageService.getPrizes());
  }, [isOpen]);

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleKeyPress = (num: string) => {
    vibrate(10);
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      
      if (newPin.length === 4) {
        if (step === 'setup') {
          // Setting up for the first time
          storageService.setPIN(newPin);
          setSavedPin(newPin);
          setPinInput('');
          setStep('menu');
        } else {
          // Verifying
          if (newPin === savedPin) {
            setPinInput('');
            setStep('menu');
            setError(false);
          } else {
            vibrate([100, 50, 100]);
            setError(true);
            setPinInput('');
            setTimeout(() => setError(false), 500);
          }
        }
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all daily/weekly locks?')) {
      storageService.emergencyReset();
      alert('All locks have been cleared!');
    }
  };

  const savePrize = () => {
    if (newPrize.name && newPrize.minutes) {
      const prize: PrizeDefinition = {
        id: Math.random().toString(36).substr(2, 9),
        name: newPrize.name,
        minutes: newPrize.minutes,
        tierColor: newPrize.tierColor as any,
        weeklyLimit: !!newPrize.weeklyLimit,
        mergeable: !!newPrize.mergeable
      };
      storageService.savePrize(prize);
      setPrizes(storageService.getPrizes());
      setNewPrize({ name: '', minutes: 15, tierColor: 'lilac', weeklyLimit: false, mergeable: true });
    }
  };

  const deletePrize = (id: string) => {
    storageService.deletePrize(id);
    setPrizes(storageService.getPrizes());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-card w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[var(--theme-color)]/10">
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="text-2xl">🛡️</span> Guardian's Safe
            </h2>
            <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollable-content">
            {/* PIN Screen */}
            {(step === 'pin' || step === 'setup') && (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <p className="text-[var(--theme-color)] font-bold mb-4 uppercase tracking-widest text-sm">
                    {step === 'setup' ? 'Set a 4-Digit Security PIN' : 'Enter Guardian PIN'}
                  </p>
                  <div className="flex justify-center gap-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 border-[var(--theme-color)] transition-all duration-300 ${
                          pinInput.length > i ? 'bg-[var(--theme-color)] scale-125 shadow-[0_0_10px_var(--theme-glow)]' : 'bg-transparent'
                        } ${error ? 'bg-rose-500 border-rose-500 animate-shake' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
                    <button
                      key={i}
                      disabled={!key}
                      onClick={() => {
                        if (key === '⌫') {
                          vibrate(5);
                          setPinInput(pinInput.slice(0, -1));
                        } else if (key) {
                          handleKeyPress(key);
                        }
                      }}
                      className={`h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                        !key ? 'opacity-0' : 'bg-white/5 hover:bg-[var(--theme-color)]/20 text-white active:scale-90 border border-white/5'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Menu */}
            {step === 'menu' && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep('factory')}
                  className="w-full p-6 glass-card bg-[var(--theme-color)]/20 border-[var(--theme-color)]/30 hover:bg-[var(--theme-color)]/30 transition-all text-left flex items-center gap-4 group"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">🏭</span>
                  <div>
                    <div className="text-white font-black text-lg">Voucher Factory</div>
                    <div className="text-[var(--theme-color)]/70 text-xs font-bold uppercase tracking-wider">Manage Prize Definitions</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/settings';
                  }}
                  className="w-full p-6 glass-card bg-gold/10 border-gold/30 hover:bg-gold/20 transition-all text-left flex items-center gap-4 group"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">🎵</span>
                  <div>
                    <div className="text-gold font-black text-lg">Music Vault</div>
                    <div className="text-gold/50 text-xs font-bold uppercase tracking-wider">Bind Custom Enchanted Tracks</div>
                  </div>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full p-6 glass-card bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 transition-all text-left flex items-center gap-4 group"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">🚨</span>
                  <div>
                    <div className="text-rose-400 font-black text-lg">Emergency Reset</div>
                    <div className="text-rose-400/50 text-xs font-bold uppercase tracking-wider">Clear All Daily/Weekly Locks</div>
                  </div>
                </button>
              </div>
            )}

            {/* Voucher Factory */}
            {step === 'factory' && (
              <div className="space-y-6">
                <button onClick={() => setStep('menu')} className="text-[var(--theme-color)] font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-white">
                  ← Back to Menu
                </button>

                {/* Add New Prize */}
                <div className="glass-card p-4 border-white/10 space-y-4 bg-white/5">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Create New Prize</h3>
                  <input
                    type="text"
                    placeholder="Prize Name (e.g. Roblox)"
                    value={newPrize.name}
                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[var(--theme-color)]"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-widest">Minutes</label>
                      <input
                        type="number"
                        value={newPrize.minutes}
                        onChange={(e) => setNewPrize({ ...newPrize, minutes: parseInt(e.target.value) })}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[var(--theme-color)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-widest">Tier</label>
                      <select
                        value={newPrize.tierColor}
                        onChange={(e) => setNewPrize({ ...newPrize, tierColor: e.target.value as any })}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[var(--theme-color)]"
                      >
                        <option value="lilac">Lilac</option>
                        <option value="gold">Gold</option>
                        <option value="cosmic">Cosmic Blue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPrize.weeklyLimit}
                        onChange={(e) => setNewPrize({ ...newPrize, weeklyLimit: e.target.checked })}
                        className="w-4 h-4 accent-[var(--theme-color)]"
                      />
                      <span className="text-xs text-white/70 font-bold">Weekly Limit</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPrize.mergeable}
                        onChange={(e) => setNewPrize({ ...newPrize, mergeable: e.target.checked })}
                        className="w-4 h-4 accent-[var(--theme-color)]"
                      />
                      <span className="text-xs text-white/70 font-bold">Mergeable</span>
                    </label>
                  </div>
                  <button
                    onClick={savePrize}
                    className="w-full p-3 bg-[var(--theme-color)] text-white font-black rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_15px_var(--theme-glow)]"
                  >
                    Forge Prize
                  </button>
                </div>

                {/* Prize List */}
                <div className="space-y-3">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Current Prizes</h3>
                  {prizes.map((prize) => (
                    <div key={prize.id} className="glass-card p-4 border-white/10 flex justify-between items-center bg-white/5">
                      <div>
                        <div className="text-white font-black">{prize.name}</div>
                        <div className="text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-widest">
                          {prize.minutes}m • {prize.tierColor} {prize.weeklyLimit && '• 1x/Week'}
                        </div>
                      </div>
                      <button onClick={() => deletePrize(prize.id)} className="text-white/20 hover:text-rose-500 transition-colors">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
