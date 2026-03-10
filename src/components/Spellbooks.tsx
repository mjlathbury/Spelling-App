/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Edit2, Book, Clock } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpellingList } from '../types';
import { motion } from 'motion/react';

export default function Spellbooks() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<SpellingList[]>([]);

  useEffect(() => {
    setLists(storageService.getLists());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to banish this spellbook?')) {
      storageService.deleteList(id);
      setLists(storageService.getLists());
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white text-glow">Active Spellbooks</h2>
            <p className="text-xs md:text-sm text-[var(--theme-color)] font-medium">Your collection of ancient incantations.</p>
          </div>
          <button
            onClick={() => navigate('/builder')}
            className="bg-[var(--theme-color)] text-white p-3 md:px-6 md:py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_0_15px_var(--theme-glow)] hover:scale-105 transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Craft New Tome</span>
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 scrollable-content pb-12">
          {lists.length === 0 ? (
            <div className="glass-card border-dashed border-2 border-white/10 p-12 text-center">
              <Book size={48} className="mx-auto mb-4 text-white/10" />
              <p className="text-[var(--theme-color)] font-bold text-lg mb-6">Your library is empty. Begin your quest by crafting a spellbook!</p>
              <button
                onClick={() => navigate('/builder')}
                className="bg-[var(--theme-color)] text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_0_20px_var(--theme-glow)] hover:scale-105 transition-all"
              >
                Craft My First Tome
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lists.map((list) => (
                <motion.div
                  key={list.id}
                  layout
                  className="glass-card p-5 hover:border-[var(--theme-color)] transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-[var(--theme-color)]/20 p-2 rounded-xl text-[var(--theme-color)]">
                      <Book size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/builder/${list.id}`);
                        }}
                        className="p-2 text-white/30 hover:text-[var(--theme-color)] transition-colors"
                        title="Edit Tome"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(list.id, e)}
                        className="p-2 text-white/30 hover:text-rose-500 transition-colors"
                        title="Banish Tome"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-1 truncate">{list.name}</h3>
                  <div className="flex items-center gap-3 text-[var(--theme-color)] font-bold text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {list.words.length} spells
                    </span>
                    <span className="text-white/10">•</span>
                    <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/portal', { state: { selectedListId: list.id } })}
                    className="mt-4 w-full py-2 rounded-xl bg-[var(--theme-color)] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-colors"
                  >
                    <Play size={14} fill="currentColor" />
                    Enter Portal
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
