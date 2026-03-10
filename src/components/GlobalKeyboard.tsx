/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { Palette, Delete, ArrowUp, CornerDownLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useKeyboard } from '../context/KeyboardContext';

export default function GlobalKeyboard() {
  const { cycleTheme } = useTheme();
  const { keyStates, onKeyPress, isShift, setIsShift } = useKeyboard();

  const handleKeyPress = useCallback((key: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }

    if (key === 'THEME') {
      cycleTheme();
    } else if (key === 'SHIFT') {
      setIsShift(!isShift);
    } else {
      // Emit the key in the correct case based on shift state
      // Special keys (BACKSPACE, ENTER, SPACE) pass through unchanged
      const isLetter = key.length === 1 && /[A-Z]/.test(key);
      const emittedKey = isLetter ? (isShift ? key.toUpperCase() : key.toLowerCase()) : key;
      onKeyPress(emittedKey);
      // Auto-reset shift after typing a letter (one-shot, like a real keyboard)
      if (isLetter && isShift) setIsShift(false);
    }
  }, [onKeyPress, isShift, setIsShift, cycleTheme]);

  const handleKeyboardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    if (button && button.dataset.key) {
      handleKeyPress(button.dataset.key);
    }
  };

  const keyboardRows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    "ZXCVBNM".split("")
  ];

  const getKeyStateStyle = (key: string) => {
    const state = keyStates[key];
    if (state === 'disabled') return 'opacity-20 grayscale scale-95 pointer-events-none';
    if (state === 'correct') return 'bg-emerald-500/40 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';
    if (state === 'misplaced') return 'bg-amber-500/40 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    return 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:bg-white/20';
  };

  const renderKey = (key: string, isSpecial: boolean = false) => {
    let content;
    if (key === 'THEME') content = <Palette size={20} className="text-[var(--theme-color)]" />;
    else if (key === 'BACKSPACE') content = <Delete size={20} />;
    else if (key === 'SHIFT') content = <ArrowUp size={20} fill={isShift ? "currentColor" : "none"} />;
    else if (key === 'ENTER') content = <CornerDownLeft size={20} />;
    else if (key === 'SPACE') content = "SPACE";
    else content = isShift ? key.toUpperCase() : key.toLowerCase();

    return (
      <button
        key={key}
        data-key={key}
        onMouseDown={(e) => e.preventDefault()}
        className={`
          ${key === 'SPACE' ? 'flex-[3]' : 'flex-1'} min-w-0 h-full flex items-center justify-center rounded-lg border ${key === 'SPACE' ? 'text-xs uppercase tracking-widest opacity-60' : 'text-xl'} font-black transition-all active:scale-95 touch-manipulation
          ${getKeyStateStyle(key)}
          ${isSpecial ? 'bg-white/10 border-white/20' : ''}
        `}
      >
        {content}
      </button>
    );
  };

  return (
    <div 
      onClick={handleKeyboardClick}
      className="h-full bg-black/80 backdrop-blur-2xl border-t border-white/10 p-1 flex flex-col gap-1 select-none overflow-hidden"
    >
      {/* Row 1 */}
      <div className="flex gap-1 h-[24%] w-full">
        {renderKey('THEME', true)}
        {keyboardRows[0].map(key => renderKey(key))}
        {renderKey('BACKSPACE', true)}
      </div>

      {/* Row 2 */}
      <div className="flex gap-1 h-[24%] w-full px-[5%]">
        {keyboardRows[1].map(key => renderKey(key))}
      </div>

      {/* Row 3 */}
      <div className="flex gap-1 h-[24%] w-full px-[2%]">
        {renderKey('SHIFT', true)}
        {keyboardRows[2].map(key => renderKey(key))}
        {renderKey('ENTER', true)}
      </div>

      {/* Row 4: Centered Spacebar */}
      <div className="flex gap-1 h-[24%] w-full justify-center px-[20%]">
        {renderKey('SPACE')}
      </div>
    </div>
  );
}
