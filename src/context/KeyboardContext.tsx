/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface KeyboardContextType {
  onKeyPress: (key: string) => void;
  registerHandler: (handler: (key: string) => void) => void;
  unregisterHandler: () => void;
  isShift: boolean;
  setIsShift: (val: boolean) => void;
  keyStates: Record<string, 'disabled' | 'correct' | 'misplaced' | 'default'>;
  setKeyState: (key: string, state: 'disabled' | 'correct' | 'misplaced' | 'default') => void;
  clearKeyStates: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [handler, setHandler] = useState<((key: string) => void) | null>(null);
  const [isShift, setIsShift] = useState(false);
  const [keyStates, setKeyStates] = useState<Record<string, 'disabled' | 'correct' | 'misplaced' | 'default'>>({});

  const registerHandler = useCallback((newHandler: (key: string) => void) => {
    setHandler(() => newHandler);
  }, []);

  const unregisterHandler = useCallback(() => {
    setHandler(null);
  }, []);

  const setKeyState = useCallback((key: string, state: 'disabled' | 'correct' | 'misplaced' | 'default') => {
    setKeyStates(prev => ({ ...prev, [key]: state }));
  }, []);

  const clearKeyStates = useCallback(() => {
    setKeyStates({});
  }, []);

  const onKeyPress = useCallback((key: string) => {
    if (handler) {
      handler(key);
    }
  }, [handler]);

  const value = useMemo(() => ({ 
    onKeyPress, 
    registerHandler, 
    unregisterHandler, 
    isShift, 
    setIsShift,
    keyStates,
    setKeyState,
    clearKeyStates
  }), [onKeyPress, registerHandler, unregisterHandler, isShift, keyStates, setKeyState, clearKeyStates]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
