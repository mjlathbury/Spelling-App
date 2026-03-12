/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import GlobalBackground from './GlobalBackground';
import GlobalKeyboard from './GlobalKeyboard';
import { useKeyboard } from '../context/KeyboardContext';

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();
  const { showKeyboard, setShowKeyboard } = useKeyboard();

  // Reset keyboard state on route change to prevent ghost keyboards
  React.useEffect(() => {
    setShowKeyboard(false);
  }, [location.pathname, setShowKeyboard]);

  const isKeyboardActive = useMemo(() => {
    const path = location.pathname;

    // showKeyboard (splash/login) ALWAYS wins
    if (showKeyboard) return true;

    // Routes where the keyboard is NEVER shown — full 100vh stage
    const noKeyboardRoutes = ['/', '/training', '/trial', '/rewards', '/spellbooks', '/settings'];
    if (noKeyboardRoutes.some(r => path === r)) return false;
    if (path.startsWith('/lexicon-leak')) return false;
    if (path.startsWith('/seers-wordsearch')) return false;

    // ClassicTest has its own splash state handled by setShowKeyboard
    if (path.startsWith('/classic-test')) return false;

    // All other routes (games, builder, etc.) get the keyboard
    return true;
  }, [location.pathname, showKeyboard]);

  return (
    <div className={`fixed inset-0 flex flex-col bg-[#020208] overflow-hidden select-none ${isKeyboardActive ? 'keyboard-active' : ''}`}>
      <GlobalBackground />

      {/* Stage Area — 100vh normally, 70vh with keyboard */}
      <div
        id="main-stage"
        className="relative z-10 overflow-hidden"
      >
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </div>

      {/* Keyboard Area — 0vh normally, 30vh with keyboard */}
      <div
        id="custom-keyboard"
        className={`relative z-20 overflow-hidden ${isKeyboardActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <GlobalKeyboard />
      </div>
    </div>
  );
}
