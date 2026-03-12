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

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { size: number, directions: { dr: number, dc: number }[], label: string, stars: number, allowIntersection?: boolean }> = {
  easy: { 
    size: 10, 
    directions: [
      { dr: 0, dc: 1 },  // E
      { dr: 1, dc: 0 },  // S
      { dr: 1, dc: 1 },  // SE
      { dr: 1, dc: -1 }, // SW
    ],
    label: 'Easy Vision',
    stars: 20
  },
  medium: { 
    size: 10, 
    directions: [
      { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, // E, W
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, // S, N
      { dr: 1, dc: 1 }, { dr: -1, dc: -1 }, // SE, NW
      { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, // SW, NE
    ],
    label: 'Medium Vision',
    stars: 35
  },
  hard: { 
    size: 12, 
    directions: [
      { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
      { dr: 1, dc: 1 }, { dr: -1, dc: -1 },
      { dr: 1, dc: -1 }, { dr: -1, dc: 1 },
    ],
    allowIntersection: true,
    label: 'Hard Vision',
    stars: 50
  }
};

export default function SeersWordsearch() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTrial = location.state?.isTrial || false;

  const [list, setList] = useState<SpellingList | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
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
    } else {
      navigate('/training');
    }
  }, [listId, navigate]);

  const handleStartGame = (diff: Difficulty) => {
    setDifficulty(diff);
    if (list) {
      generateGrid(list.words.map(w => w.text.toUpperCase()), diff);
    }
  };

  const generateGrid = (words: string[], diff: Difficulty) => {
    const { size, directions, allowIntersection } = DIFFICULTY_CONFIG[diff];
    const newGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const placedWords: string[] = [];

    // Try to place each word
    words.forEach(word => {
      if (word.length > size) return;
      
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        
        if (canPlace(newGrid, word, row, col, dir, size, allowIntersection)) {
          placeWord(newGrid, word, row, col, dir);
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

  const canPlace = (grid: string[][], word: string, row: number, col: number, dir: { dr: number, dc: number }, size: number, allowIntersection?: boolean) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + (i * dir.dr);
      const c = col + (i * dir.dc);
      
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      
      const currentCell = grid[r][c];
      if (currentCell !== '') {
        if (!allowIntersection || currentCell !== word[i]) {
          return false;
        }
      }
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, row: number, col: number, dir: { dr: number, dc: number }) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + (i * dir.dr);
      const c = col + (i * dir.dc);
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
          const { stars } = DIFFICULTY_CONFIG[difficulty!];
          const totalStars = stars * wordsToFind.length;
          storageService.addStars(totalStars);
          setStarsEarned(totalStars);
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

  if (!difficulty) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter text-glow">The Seer's Vision</h2>
            <p className="text-[var(--theme-color)] font-bold text-lg uppercase tracking-widest opacity-80">Choose your vision orb</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff, i) => (
              <motion.button
                key={diff}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartGame(diff)}
                className="group relative flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border-2 border-white/10 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)]/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-color)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-left relative z-10">
                  <span className="block text-2xl font-black text-white uppercase tracking-tight">{DIFFICULTY_CONFIG[diff].label}</span>
                  <p className="text-sm font-bold text-white/50 uppercase tracking-[0.2em] mt-1 max-w-[200px]">
                    {diff === 'easy' && 'Horizontal, vertical & diagonal forward only'}
                    {diff === 'medium' && 'Inverted vision: Words can be backwards'}
                    {diff === 'hard' && 'Intersecting runes & all 8 directions'}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-white/5 border border-white/10 text-white/20 group-hover:text-[var(--theme-color)] group-hover:border-[var(--theme-color)] group-hover:shadow-[0_0_20px_var(--theme-glow)] transition-all">
                  <div className="text-3xl">👁️</div>
                </div>
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => navigate('/training')}
            className="w-full text-white/30 text-sm font-black hover:text-white uppercase tracking-[0.3em] transition-colors text-center"
          >
            ← Return to Training
          </button>
        </motion.div>
      </div>
    );
  }

  const { size, stars } = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="h-full flex flex-col relative overflow-hidden select-none">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">
          {DIFFICULTY_CONFIG[difficulty].label}
        </h2>
        <p className="text-[var(--theme-color)] text-xs font-bold uppercase tracking-widest opacity-70">
          {isTrial ? 'Trial Mode' : 'Training Mode'} • {foundWords.length}/{wordsToFind.length} Found
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
          className="glass-card border-[var(--theme-color)]/30 touch-none p-2"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gap: size > 10 ? '2px' : '4px'
          }}
        >
            {grid.map((row, r) => row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              data-cell={`${r}-${c}`}
              className={`
                flex items-center justify-center font-black transition-all rounded-md
                ${size > 10 ? 'w-6 h-6 sm:w-7 sm:h-7 text-[10px]' : 'w-7 h-7 sm:w-8 sm:h-8 text-sm'}
                ${isCellSelected(r, c) ? 'bg-[#9d50bb]/80 text-white scale-110 z-10 shadow-[0_0_15px_#9d50bb]' : ''}
                ${isCellFound(r, c) ? 'text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-white/60'}
              `}
              style={isCellSelected(r, c) ? { background: 'radial-gradient(circle, #9d50bb 0%, transparent 70%)' } : {}}
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
                onClick={() => navigate('/training')}
                className="w-full py-4 bg-[var(--theme-color)] text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_var(--theme-glow)]"
              >
                Return to Training
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
