/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Mic, Volume2, MicOff } from 'lucide-react';
import { storageService } from '../services/storageService';
import { saveAudio, getAudio } from '../services/audioDb';
import { SpellingList, Word } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useKeyboard } from '../context/KeyboardContext';

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
  const [focusedId, setFocusedId] = useState<'name' | string | null>(null);

  // Recording state
  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Audio presence map: wordId → base64 (populated from IDB on load)
  const [wordAudioMap, setWordAudioMap] = useState<Record<string, string>>({});

  // true until the user has explicitly granted mic access this session
  const [needsMicPermission, setNeedsMicPermission] = useState(true);
  const [micDeniedMsg, setMicDeniedMsg] = useState<string | null>(null);

  const { registerHandler, unregisterHandler } = useKeyboard();

  // Load existing list + fetch existing audio from IDB
  // Also silently check mic permission so we skip the grant step if already allowed.
  useEffect(() => {
    const loadList = async () => {
      // Silent permission check — no popup triggered here
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') setNeedsMicPermission(false);
        status.onchange = () => {
          if (status.state === 'granted') setNeedsMicPermission(false);
        };
      } catch { /* ignore if Permissions API unavailable */ }

      if (id) {
        const lists = storageService.getLists();
        const existing = lists.find(l => l.id === id);
        if (existing) {
          setListName(existing.name);
          setWords(existing.words);
          // Fetch audio presence from IDB for each word
          const audioEntries: Record<string, string> = {};
          await Promise.all(
            existing.words.map(async w => {
              const audio = await getAudio(w.id);
              if (audio) audioEntries[w.id] = audio;
            })
          );
          setWordAudioMap(audioEntries);
        }
      } else {
        setWords([{
          id: Math.random().toString(36).substring(2, 11),
          text: ''
        }]);
      }
    };
    loadList();
  }, [id]);

  const addWord = () => {
    setWords(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 11),
      text: ''
    }]);
  };

  const removeWord = (wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
    setWordAudioMap(prev => { const n = { ...prev }; delete n[wordId]; return n; });
  };

  // --- Microphone permission ---
  // Called directly from onClick — direct user gesture guarantees browser shows the popup.
  const enableMicPermission = async () => {
    setMicDeniedMsg(null);
    if (!window.isSecureContext) {
      setMicDeniedMsg('⚠️ Magic Hearing requires a Secure Connection. Please ensure you are using HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // immediately release; we just needed the grant
      setNeedsMicPermission(false);
    } catch {
      setMicDeniedMsg('Permission Denied: Please check your phone settings to unlock the microphone.');
    }
  };

  // --- Recording logic ---
  const startRecording = async (wordId: string) => {
    if (!window.isSecureContext) {
      setMicDeniedMsg('⚠️ Magic Hearing requires a Secure Connection. Please ensure you are using HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        try {
          const base64 = await storageService.fileToBase64(blob);
          await saveAudio(wordId, base64);
          setWordAudioMap(prev => ({ ...prev, [wordId]: base64 }));
        } catch {}
        setRecordingWordId(null);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingWordId(wordId);
    } catch {
      setMicDeniedMsg('Permission Denied: Please check your phone settings to unlock the microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = async (wordId: string) => {
    if (recordingWordId === wordId) {
      stopRecording();
    } else {
      if (recordingWordId) stopRecording(); // stop any other recording first
      await startRecording(wordId);
    }
  };

  const playWordAudio = (wordId: string) => {
    const base64 = wordAudioMap[wordId];
    if (base64) {
      try { new Audio(base64).play(); } catch {}
    }
  };

  // --- Keyboard handler ---
  const onKeyPress = useCallback((key: string) => {
    if (!focusedId) return;

    if (key === 'ENTER') {
      if (focusedId === 'name') {
        if (words.length > 0) setFocusedId(words[0].id);
      } else {
        const idx = words.findIndex(w => w.id === focusedId);
        if (idx < words.length - 1) {
          setFocusedId(words[idx + 1].id);
        } else {
          handleSave();
        }
      }
    } else if (key === 'BACKSPACE') {
      if (focusedId === 'name') {
        setListName(prev => prev.slice(0, -1));
      } else {
        setWords(prev => prev.map(w => w.id === focusedId ? { ...w, text: w.text.slice(0, -1) } : w));
      }
    } else if (key === 'SPACE') {
      if (focusedId === 'name') {
        setListName(prev => prev + ' ');
      } else {
        setWords(prev => prev.map(w => w.id === focusedId ? { ...w, text: w.text + ' ' } : w));
      }
    } else if (key.length === 1) {
      if (focusedId === 'name') {
        setListName(prev => prev + key);
      } else {
        setWords(prev => prev.map(w => w.id === focusedId ? { ...w, text: w.text + key } : w));
      }
    }
  }, [focusedId, words]);

  useEffect(() => {
    registerHandler(onKeyPress);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler, onKeyPress]);

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
      // Audio is stored in IDB — saveList will strip any .audio off anyway
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
                readOnly
                type="text"
                value={listName}
                onFocus={() => setFocusedId('name')}
                placeholder="e.g., Ancient Creatures"
                className={`w-full text-xl p-4 rounded-2xl magic-input outline-none transition-all ${focusedId === 'name' ? 'border-[var(--theme-color)] shadow-[0_0_15px_var(--theme-glow)]' : ''}`}
              />
            </div>

            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black text-[var(--theme-color)] uppercase tracking-widest">
                <div className="col-span-6">Incantation</div>
                <div className="col-span-3 text-center">Record</div>
                <div className="col-span-2 text-center">Play</div>
                <div className="col-span-1 text-right">⌫</div>
              </div>

              {/* Permission denied message — shown after enableMicPermission or startRecording fails */}
              {micDeniedMsg && (
                <div className="glass-card p-4 border-rose-500/30 bg-rose-500/5 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🎙️</span>
                  <p className="text-rose-300 text-xs font-bold leading-relaxed">{micDeniedMsg}</p>
                </div>
              )}

              {words.map((word) => {
                const isRecordingThis = recordingWordId === word.id;
                const hasAudio = !!wordAudioMap[word.id];

                return (
                  <div
                    key={word.id}
                    className="grid grid-cols-12 gap-2 items-center p-3 glass-card border-none bg-white/5 hover:bg-white/10 transition-all"
                  >
                    {/* Word text input */}
                    <div className="col-span-6">
                      <input
                        readOnly
                        type="text"
                        value={word.text}
                        onFocus={() => setFocusedId(word.id)}
                        placeholder="Type spell..."
                        className={`w-full p-3 rounded-xl bg-black/20 border transition-all text-base font-medium text-white outline-none ${focusedId === word.id ? 'border-[var(--theme-color)] shadow-[0_0_10px_var(--theme-glow)]' : 'border-white/10'}`}
                      />
                    </div>

                    {/* Mic / Record column */}
                    <div className="col-span-3 flex justify-center">
                      {needsMicPermission ? (
                        /* 'Enable Magic Hearing' — direct click → getUserMedia → browser popup */
                        <button
                          type="button"
                          onClick={enableMicPermission}
                          className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all text-center"
                        >
                          <Mic size={18} />
                          <span className="text-[9px] font-black uppercase tracking-wide leading-none">Enable</span>
                        </button>
                      ) : (
                        /* Normal recording button */
                        <button
                          type="button"
                          title={isRecordingThis ? 'Tap to stop' : hasAudio ? 'Re-record' : 'Record'}
                          onClick={() => toggleRecording(word.id)}
                          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all
                            ${isRecordingThis
                              ? 'bg-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                              : hasAudio
                                ? 'bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/60 text-[var(--theme-color)]'
                                : 'bg-white/10 border border-white/20 text-white/50 hover:text-white hover:bg-white/20'
                            }`}
                        >
                          <AnimatePresence mode="wait">
                            {isRecordingThis ? (
                              <motion.div
                                key="recording"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                              >
                                <MicOff size={20} className="text-white" />
                              </motion.div>
                            ) : (
                              <motion.div key="idle" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                <Mic size={20} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {isRecordingThis && (
                            <motion.span
                              className="absolute inset-0 rounded-full border-2 border-rose-400"
                              animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            />
                          )}
                          {hasAudio && !isRecordingThis && (
                            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--theme-color)] shadow-[0_0_5px_var(--theme-glow)]" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Play button — only visible when audio exists */}
                    <div className="col-span-2 flex justify-center">
                      {hasAudio && (
                        <button
                          type="button"
                          title="Play recording"
                          onClick={() => playWordAudio(word.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                        >
                          <Volume2 size={18} />
                        </button>
                      )}
                    </div>

                    {/* Long-press delete */}
                    <div className="col-span-1 flex justify-end">
                      <LongPressButton
                        onLongPress={() => removeWord(word.id)}
                        className="p-2 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </LongPressButton>
                    </div>
                  </div>
                );
              })}
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
