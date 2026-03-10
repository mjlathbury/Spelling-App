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
      onKeyPress(key);
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
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ['SPACE']
  ];

  const getKeyStateStyle = (key: string) => {
    const state = keyStates[key];
    if (state === 'correct') return 'bg-emerald-500/40 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';
    if (state === 'misplaced') return 'bg-amber-500/40 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    if (state === 'disabled') return 'opacity-20 grayscale scale-95';
    return 'bg-white/5 border-white/10 text-white/80';
  };

  const renderKey = (key: string, isSpecial: boolean = false) => {
    let icon;
    if (key === 'THEME') icon = <Palette size={20} className="text-[var(--theme-color)]" />;
    else if (key === 'BACKSPACE') icon = <Delete size={20} />;
    else if (key === 'SHIFT') icon = <ArrowUp size={22} fill={isShift ? "currentColor" : "none"} />;
    else if (key === 'ENTER') icon = <CornerDownLeft size={22} />;
    else if (key === 'SPACE') icon = <div className="w-24 h-1 bg-white/20 rounded-full" />;

    const stateStyle = getKeyStateStyle(key);
    const baseWidth = key === 'SPACE' ? 'w-48' : (isSpecial ? 'w-14' : 'flex-1');

    return (
      <button
        key={key}
        data-key={key}
        className={`
          relative flex items-center justify-center ${baseWidth} h-11 md:h-14 rounded-xl
          border transition-all active:scale-95 active:bg-white/20
          ${stateStyle}
          ${isSpecial ? 'bg-white/10' : ''}
        `}
      >
        <span className="font-black text-lg pointer-events-none">
          {icon || (isShift ? key.toUpperCase() : key.toLowerCase())}
        </span>
        <div className="absolute inset-0 rounded-xl opacity-0 active:opacity-100 transition-opacity pointer-events-none shadow-[0_0_20px_var(--theme-glow)] border-2 border-[var(--theme-color)]" />
      </button>
    );
  };

  return (
    <div 
      onClick={handleKeyboardClick}
      className="h-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-2 flex flex-col justify-center relative z-50 select-none"
    >
      {/* Corner Special Keys */}
      <div className="absolute top-2 left-2">{renderKey('THEME', true)}</div>
      <div className="absolute top-2 right-2">{renderKey('BACKSPACE', true)}</div>
      <div className="absolute bottom-2 left-2">{renderKey('SHIFT', true)}</div>
      <div className="absolute bottom-2 right-2">{renderKey('ENTER', true)}</div>

      <div className="max-w-2xl mx-auto w-full space-y-1.5 px-16">
        {keyboardRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`flex justify-center gap-1.5 ${rowIndex === 1 ? 'px-[5%]' : ''}`}
          >
            {row.map((key) => renderKey(key))}
          </div>
        ))}
      </div>
    </div>
  );
}
