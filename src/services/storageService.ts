/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpellingList, Voucher, PrizeDefinition } from '../types';
import { saveAudio, deleteAudio } from './audioDb';

const STORAGE_KEY = 'spelling_lists';
const VOUCHER_KEY = 'spelling_vouchers';
const USER_NAME_KEY = 'spelling_user_name';
const PIN_KEY = 'guardian_pin';
const PRIZES_KEY = 'prize_definitions';
const DAILY_STARS_KEY = 'daily_stars';
const MASTERY_LOCKS_KEY = 'mastery_locks';
const LAST_RESET_KEY = 'last_reset_dates';

export const storageService = {
  getUserName: (): string | null => {
    return localStorage.getItem(USER_NAME_KEY);
  },

  setUserName: (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
  },

  clearUserName: () => {
    localStorage.removeItem(USER_NAME_KEY);
  },

  getLists: (): SpellingList[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveList: (list: SpellingList) => {
    const lists = storageService.getLists();
    const index = lists.findIndex(l => l.id === list.id);

    // Strip audio from words before localStorage, persist to IDB separately
    const wordsForIdb = list.words.filter(w => w.audio);
    const listToStore: SpellingList = {
      ...list,
      words: list.words.map(({ audio: _audio, ...rest }) => rest),
    };

    if (index > -1) {
      lists[index] = listToStore;
    } else {
      lists.push(listToStore);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));

    // Fire-and-forget: write audio blobs to IDB
    wordsForIdb.forEach(w => {
      if (w.audio) saveAudio(w.id, w.audio).catch(() => {});
    });
  },

  deleteList: (id: string) => {
    const lists = storageService.getLists();
    const toDelete = lists.find(l => l.id === id);
    if (toDelete) {
      // Cascade-delete audio from IDB
      toDelete.words.forEach(w => deleteAudio(w.id).catch(() => {}));
    }
    const remaining = lists.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  },

  // Convert a File/Blob to a Base64 data URL using FileReader
  fileToBase64: (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
    });
  },

  // Seeds built-in spellbooks on first launch (only if no lists exist)
  seedDefaultLists: () => {
    const existing = storageService.getLists();
    if (existing.length > 0) return; // Don't overwrite user's lists

    const colourWords = [
      'red', 'yellow', 'pink', 'green', 'orange',
      'purple', 'blue', 'black', 'white', 'grey',
    ];

    const coloursList: SpellingList = {
      id: 'default-colours',
      name: 'Colours',
      words: colourWords.map((text, i) => ({ id: `colour-${i}`, text })),
      createdAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([coloursList]));
  },

  getVouchers: (): Voucher[] => {
    const data = localStorage.getItem(VOUCHER_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveVoucher: (voucher: Voucher) => {
    const vouchers = storageService.getVouchers();
    vouchers.push(voucher);
    localStorage.setItem(VOUCHER_KEY, JSON.stringify(vouchers));
  },

  deleteVoucher: (id: string) => {
    const vouchers = storageService.getVouchers().filter(v => v.id !== id);
    localStorage.setItem(VOUCHER_KEY, JSON.stringify(vouchers));
  },

  // PIN Logic
  getPIN: (): string | null => {
    return localStorage.getItem(PIN_KEY);
  },

  setPIN: (pin: string) => {
    localStorage.setItem(PIN_KEY, pin);
  },

  // Prize Logic
  getPrizes: (): PrizeDefinition[] => {
    const data = localStorage.getItem(PRIZES_KEY);
    const prizes = data ? JSON.parse(data) : [];
    if (prizes.length === 0) {
      const defaults: PrizeDefinition[] = [
        { id: 'p1', name: 'Roblox', minutes: 15, tierColor: 'lilac', weeklyLimit: false, mergeable: true },
        { id: 'p2', name: 'YouTube', minutes: 15, tierColor: 'lilac', weeklyLimit: false, mergeable: true },
        { id: 'p3', name: 'Minecraft', minutes: 15, tierColor: 'lilac', weeklyLimit: false, mergeable: true },
        { id: 'p4', name: 'Switch Time', minutes: 15, tierColor: 'lilac', weeklyLimit: false, mergeable: true }
      ];
      localStorage.setItem(PRIZES_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return prizes;
  },

  savePrize: (prize: PrizeDefinition) => {
    const prizes = storageService.getPrizes();
    const index = prizes.findIndex(p => p.id === prize.id);
    if (index > -1) {
      prizes[index] = prize;
    } else {
      prizes.push(prize);
    }
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
  },

  deletePrize: (id: string) => {
    const prizes = storageService.getPrizes().filter(p => p.id !== id);
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
  },

  // Reset Logic
  checkResets: () => {
    const now = new Date();
    const lastResetData = localStorage.getItem(LAST_RESET_KEY);
    const lastResets = lastResetData ? JSON.parse(lastResetData) : { daily: 0, weekly: 0 };

    const lastDaily = new Date(lastResets.daily);
    const lastWeekly = new Date(lastResets.weekly);

    // Midnight Reset (Daily)
    if (now.getDate() !== lastDaily.getDate() || now.getMonth() !== lastDaily.getMonth() || now.getFullYear() !== lastDaily.getFullYear()) {
      storageService.resetDaily();
      lastResets.daily = now.getTime();
    }

    // Monday Reset (Weekly)
    // 0 is Sunday, 1 is Monday
    const currentDay = now.getDay();
    
    // If it's Monday and we haven't reset today, or if more than 7 days passed
    const isMonday = currentDay === 1;
    const diffDays = (now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24);

    if ((isMonday && now.getDate() !== lastWeekly.getDate()) || diffDays >= 7) {
      storageService.resetWeekly();
      lastResets.weekly = now.getTime();
    }

    localStorage.setItem(LAST_RESET_KEY, JSON.stringify(lastResets));
  },

  resetDaily: () => {
    localStorage.setItem(DAILY_STARS_KEY, '0');
    localStorage.setItem(MASTERY_LOCKS_KEY, JSON.stringify([]));
  },

  resetWeekly: () => {
    const prizes = storageService.getPrizes().map(p => ({ ...p, wonThisWeek: false }));
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
  },

  emergencyReset: () => {
    storageService.resetDaily();
    storageService.resetWeekly();
    const now = new Date();
    localStorage.setItem(LAST_RESET_KEY, JSON.stringify({ daily: now.getTime(), weekly: now.getTime() }));
  },

  // Star Economy
  getDailyStars: (): number => {
    const stars = localStorage.getItem(DAILY_STARS_KEY);
    return stars ? parseInt(stars) : 0;
  },

  addStars: (amount: number): number => {
    const current = storageService.getDailyStars();
    const next = Math.min(150, current + amount);
    localStorage.setItem(DAILY_STARS_KEY, next.toString());
    return next;
  },

  spendStars: (amount: number): boolean => {
    const current = storageService.getDailyStars();
    if (current >= amount) {
      localStorage.setItem(DAILY_STARS_KEY, (current - amount).toString());
      return true;
    }
    return false;
  },

  isEclipse: (): boolean => {
    return storageService.getDailyStars() >= 150;
  },

  // Mastery Locks (Daily game locks)
  isGameLocked: (gameId: string): boolean => {
    const locks = localStorage.getItem(MASTERY_LOCKS_KEY);
    const lockList = locks ? JSON.parse(locks) : [];
    return lockList.includes(gameId);
  },

  lockGame: (gameId: string) => {
    const locks = localStorage.getItem(MASTERY_LOCKS_KEY);
    const lockList = locks ? JSON.parse(locks) : [];
    if (!lockList.includes(gameId)) {
      lockList.push(gameId);
      localStorage.setItem(MASTERY_LOCKS_KEY, JSON.stringify(lockList));
    }
  },



  clearAll: () => {
    localStorage.clear();
  }
};

// Module-level cache so we only fetch once per session
let _wordListCache: Set<string> | null = null;
let _wordListPromise: Promise<Set<string>> | null = null;

export const loadWordList = (): Promise<Set<string>> => {
  if (_wordListCache) return Promise.resolve(_wordListCache);
  if (_wordListPromise) return _wordListPromise;

  _wordListPromise = fetch('/words_alpha.txt')
    .then(res => res.text())
    .then(text => {
      const set = new Set(
        text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(Boolean)
      );
      _wordListCache = set;
      return set;
    });

  return _wordListPromise;
};
