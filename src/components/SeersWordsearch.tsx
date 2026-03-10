/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { SpellingList } from '../types';

interface GridCell {
  char: string;
  row: number;
  col: number;
}

export default function SeersWordsearch() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<{ start: GridCell, end: GridCell } | null>(null);
  const [foundCells, setFoundCells] = useState<{ row: number, col: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lists = storageService.getLists();
    const found = lists.find(l => l.id === listId);
    if (found && found.words.length > 0) {
      setList(found);
      generateGrid(found.words.map(w => w.text.toUpperCase()));
    } else {
      navigate('/portal');
    }
  }, [listId, navigate]);

  const generateGrid = (words: string[]) => {
    const size = 10;
    const newGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const placedWords: string[] = [];

    // Try to place each word
    words.forEach(word => {
      if (word.length > size) return;
      
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        const direction = Math.floor(Math.random() * 3); // 0: Horiz, 1: Vert, 2: Diag
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        
        if (canPlace(newGrid, word, row, col, direction)) {
          placeWord(newGrid, word, row, col, direction);
          placedWords.push(word);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill remaining with random runes/letters
    const runes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = runes[Math.floor(Math.random() * runes.length)];
        }
      }
    }

    setGrid(newGrid.map((row, r) => row.map((char, c) => ({ char, row: r, col: c }))));
    setWordsToFind(placedWords);
  };

  const canPlace = (grid: string[][], word: string, row: number, col: number, dir: number) => {
    const size = 10;
    for (let i = 0; i < word.length; i++) {
      let r = row, c = col;
      if (dir === 0) c += i;
      if (dir === 1) r += i;
      if (dir === 2) { r += i; c += i; }
      
      if (r >= size || c >= size || (grid[r][c] !== '' && grid[r][c] !== word[i])) return false;
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, row: number, col: number, dir: number) => {
    for (let i = 0; i < word.length; i++) {
      let r = row, c = col;
      if (dir === 0) c += i;
      if (dir === 1) r += i;
      if (dir === 2) { r += i; c += i; }
      grid[r][c] = word[i];
    }
  };

  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.hasAttribute('data-cell')) {
      const [r, c] = element.getAttribute('data-cell')!.split('-').map(Number);
      return grid[r][c];
    }
    return null;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const cell = getCellFromEvent(e);
    if (cell) setSelection({ start: cell, end: cell });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selection) return;
    const cell = getCellFromEvent(e);
    if (cell) setSelection({ ...selection, end: cell });
  };

  const handleEnd = () => {
    if (!selection) return;
    
    const selectedWord = getSelectedWord();
    if (selectedWord && wordsToFind.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      const newFound = [...foundWords, selectedWord];
      setFoundWords(newFound);
      
      // Add cells to found list
      const cells = getSelectedCells();
      setFoundCells([...foundCells, ...cells]);

      if (newFound.length === wordsToFind.length) {
        setGameOver(true);
        if (isTrial) {
          storageService.addStars(50);
          setStarsEarned(50);
        }
      }
    }
    
    setSelection(null);
  };

  const getSelectedCells = () => {
    if (!selection) return [];
    const { start, end } = selection;
    const cells: { row: number, col: number }[] = [];
    
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    if (steps === 0) return [start];
    
    // Check if valid direction (Horiz, Vert, or 45deg Diag)
    const isValid = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    if (!isValid) return [];

    const stepR = dr / steps;
    const stepC = dc / steps;

    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: Math.round(start.row + i * stepR),
        col: Math.round(start.col + i * stepC)
      });
    }
    return cells;
  };

  const getSelectedWord = () => {
    const cells = getSelectedCells();
    return cells.map(c => grid[c.row][c.col].char).join('');
  };

  const isCellSelected = (r: number, c: number) => {
    return getSelectedCells().some(cell => cell.row === r && cell.col === c);
  };

  const isCellFound = (r: number, c: number) => {
    return foundCells.some(cell => cell.row === r && cell.col === c);
  };

  if (!list) return null;

  return (
    <div className="h-full flex flex-col relative overflow-hidden select-none">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">The Seer's Wordsearch</h2>
        <p className="text-[var(--theme-color)] text-xs font-bold uppercase tracking-widest opacity-70">
          {isTrial ? 'Trial Mode' : 'Practice Mode'} • {foundWords.length}/{wordsToFind.length} Found
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 scrollable-content pb-12">
        {/* Grid */}
        <div 
          ref={gridRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="grid grid-cols-10 gap-1 p-2 glass-card border-[var(--theme-color)]/30 touch-none"
        >
          {grid.map((row, r) => row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              data-cell={`${r}-${c}`}
              className={`
                w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-black transition-all rounded-md
                ${isCellSelected(r, c) ? 'bg-[var(--theme-color)] text-white scale-110 z-10' : ''}
                ${isCellFound(r, c) ? 'text-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : 'text-white/60'}
              `}
            >
              {cell.char}
            </div>
          )))}
        </div>

        {/* Word List */}
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {wordsToFind.map((word, i) => (
            <div 
              key={i}
              className={`
                px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
                ${foundWords.includes(word) 
                  ? 'bg-gold/20 border-gold text-gold line-through' 
                  : 'bg-white/5 border-white/10 text-[var(--theme-color)]'}
              `}
            >
              {word}
            </div>
          ))}
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <div className="glass-card p-8 text-center space-y-6 max-w-xs w-full">
              <div className="text-6xl">👁️</div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">Vision Complete!</h3>
                <p className="text-[var(--theme-color)] text-sm font-bold mt-2">
                  You have revealed all the hidden truths. You earned {starsEarned} stars!
                </p>
              </div>
              <button
                onClick={() => navigate('/portal')}
                className="w-full py-4 bg-[var(--theme-color)] text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_var(--theme-glow)]"
              >
                Return to Portal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
