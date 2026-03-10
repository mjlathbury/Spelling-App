/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useKeyboard } from '../context/KeyboardContext';

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [show, setShow] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const { registerHandler, unregisterHandler } = useKeyboard();

  useEffect(() => {
    const savedName = storageService.getUserName();
    if (savedName && savedName.trim() !== '') {
      setShow(false);
    } else {
      setShow(true);
    }
  }, []);

  const handleStart = useCallback(() => {
    const trimmedName = name.trim();
    if (trimmedName) {
      storageService.setUserName(trimmedName);
      setShow(false);
    }
  }, [name]);

  const onKeyPress = useCallback((key: string) => {
    if (key === 'ENTER') {
      handleStart();
    } else if (key === 'BACKSPACE') {
      setName(prev => prev.slice(0, -1));
    } else if (key === 'SPACE') {
      setName(prev => prev + ' ');
    } else if (key.length === 1) {
      setName(prev => prev + key);
    }
  }, [handleStart]);

  useEffect(() => {
    if (show) {
      registerHandler(onKeyPress);
    } else {
      unregisterHandler();
    }
    return () => unregisterHandler();
  }, [show, registerHandler, unregisterHandler, onKeyPress]);

  if (show === null) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col items-center justify-center p-6 relative z-10 gap-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="p-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_30px_var(--theme-glow)]"
            >
              <Wand2 size={64} className="text-[var(--theme-color)]" />
            </motion.div>

            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_var(--theme-glow)]">
                Magical Spelling Quest
              </h1>
              <p className="text-white/40 font-bold tracking-[0.4em] text-xs uppercase">
                Enchanted Academy
              </p>
            </div>

            <div className="w-full max-w-sm space-y-6">
              <div className="relative">
                <input
                  readOnly
                  type="text"
                  value={name}
                  placeholder="Identify yourself..."
                  className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 text-center font-black text-2xl text-white placeholder:text-white/10 shadow-inner outline-none focus:border-[var(--theme-color)] transition-all"
                />
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--theme-color)] to-transparent opacity-50" />
              </div>
              
              <button
                onClick={() => handleStart()}
                className="w-full py-5 rounded-2xl bg-[var(--theme-color)] text-white font-black text-lg tracking-[0.2em] uppercase shadow-[0_0_20px_var(--theme-glow)] active:scale-95 transition-all"
              >
                Begin My Quest
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!show && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          {children}
        </motion.div>
      )}
    </>
  );
}
