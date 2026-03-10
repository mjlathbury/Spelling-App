/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import GlobalBackground from './GlobalBackground';
import GlobalKeyboard from './GlobalKeyboard';
import { storageService } from '../services/storageService';

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();
  
  const isKeyboardActive = useMemo(() => {
    // Show keyboard on Login Screen (no username) or Spellbook Builder
    const isLogin = !storageService.getUserName();
    const isBuilder = location.pathname.startsWith('/builder');
    return isLogin || isBuilder;
  }, [location.pathname]);

  return (
    <div className={`fixed inset-0 flex flex-col bg-[#020208] overflow-hidden select-none ${isKeyboardActive ? 'keyboard-active' : 'keyboard-hidden'}`}>
      <GlobalBackground />
      
      {/* Stage Area */}
      <div id="main-stage" className="relative z-10 overflow-hidden">
        {children}
      </div>

      {/* Base Area */}
      <div id="custom-keyboard">
        <GlobalKeyboard />
      </div>
    </div>
  );
}
