/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export const THEMES = [
  { color: '#9d50bb', name: 'Lilac' },
  { color: '#ffd700', name: 'Gold' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#f43f5e', name: 'Rose' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#14b8a6', name: 'Teal' },
  { color: '#ffffff', name: 'White' }
];

interface ThemeContextType {
  themeIndex: number;
  setThemeIndex: (index: number) => void;
  activeTheme: typeof THEMES[0];
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeIndex, setThemeIndex] = useState(0);

  const cycleTheme = useCallback(() => {
    setThemeIndex((prev) => (prev + 1) % THEMES.length);
  }, []);

  const activeTheme = THEMES[themeIndex];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-color', activeTheme.color);
    root.style.setProperty('--theme-glow', `${activeTheme.color}66`);
    root.style.setProperty('--theme-nebula', `${activeTheme.color}22`);
  }, [activeTheme]);

  const value = useMemo(() => ({ 
    themeIndex, 
    setThemeIndex, 
    activeTheme, 
    cycleTheme 
  }), [themeIndex, activeTheme, cycleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
