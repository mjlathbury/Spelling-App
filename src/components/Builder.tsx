/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList, Word } from '../types';
import { motion } from 'motion/react';

interface LongPressButtonProps {
  onLongPress: () => void;
  children: React.ReactNode;
  className?: string;
}

function LongPressButton({ onLongPress, children, className }: LongPressButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
    }, 1000);
  };

  const cancel = () => {
    setIsPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <button
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className={`${className} relative overflow-hidden`}
    >
      {isPressing && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, ease: 'linear' }}
          className="absolute inset-0 bg-rose-500/20 pointer-events-none"
        />
      )}
      {children}
    </button>
  );
}

export default function Builder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listName, setListName] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const lists = storageService.getLists();
      const existing = lists.find(l => l.id === id);
      if (existing) {
        setListName(existing.name);
        setWords(existing.words);
      }
    } else {
      setWords([{
        id: Math.random().toString(36).substring(2, 11),
        text: ''
      }]);
    }
  }, [id]);

  const addWord = () => {
    setWords(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 11),
      text: ''
    }]);
  };

  const removeWord = (wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
  };

  const updateWordText = (wordId: string, text: string) => {
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, text } : w));
  };

  const handleSave = () => {
    if (!listName.trim()) {
      alert('Please give your spellbook a name!');
      return;
    }
    if (words.length === 0 || words.some(w => !w.text.trim())) {
      alert('Please make sure all spells have text!');
      return;
    }

    setIsSaving(true);
    const newList: SpellingList = {
      id: id || crypto.randomUUID(),
      name: listName,
      words: words.map(w => ({ ...w, text: w.text.trim() })),
      createdAt: Date.now()
    };

    storageService.saveList(newList);
    setTimeout(() => {
      setIsSaving(false);
      navigate('/');
    }, 500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-white text-glow">Spellbook Builder 📖</h2>
          <p className="text-xs md:text-sm text-[var(--theme-color)] font-medium">Craft your ancient incantations.</p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollable-content">
          <div className="glass-card p-6 md:p-8">
            <div className="mb-8">
              <label className="block text-xs font-black text-[var(--theme-color)] uppercase tracking-widest mb-2">
                Spellbook Name
              </label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Ancient Creatures"
                className="w-full text-xl p-4 rounded-2xl magic-input outline-none focus:border-[var(--theme-color)]"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-[var(--theme-color)] uppercase tracking-widest">
                <div className="col-span-10">Incantation</div>
                <div className="col-span-2 text-right">Banish</div>
              </div>

              {words.map((word, index) => (
                <div 
                  key={word.id}
                  className="grid grid-cols-12 gap-3 items-center p-3 glass-card border-none bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="col-span-10 relative">
                    <input
                      type="text"
                      value={word.text}
                      onChange={(e) => updateWordText(word.id, e.target.value)}
                      placeholder="Type spell..."
                      className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--theme-color)] outline-none transition-all text-base font-medium text-white"
                    />
                  </div>
                  
                  <div className="col-span-2 flex justify-end">
                    <LongPressButton
                      onLongPress={() => removeWord(word.id)}
                      className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </LongPressButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={addWord}
                className="flex-1 flex items-center justify-center gap-2 p-4 glass-button rounded-2xl font-bold text-sm"
              >
                <Plus size={20} />
                Add New Spell
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl font-bold text-sm transition-all
                  ${isSaving 
                    ? 'bg-white/5 text-white/20 border border-white/10' 
                    : 'bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-glow)] hover:shadow-[0_0_30px_var(--theme-glow)] hover:scale-[1.02]'}
                `}
              >
                <Save size={20} />
                {isSaving ? 'Binding...' : 'Bind Spellbook'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
