/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'classic-test' | 'flash' | 'blanks' | 'sudden-death' | 'proofread' | 'masters-grid' | 'witchs-noose' | 'seers-wordsearch' | 'lexicon-leak';

export interface Word {
  id: string;
  text: string;
  audio?: string; // Base64 data URL of spoken incantation
}

export interface SpellingList {
  id: string;
  name: string;
  words: Word[];
  createdAt: number;
}

export interface Voucher {
  id: string;
  name: string;
  minutes: number;
  earnedAt: number;
  listName: string;
}

export interface PrizeDefinition {
  id: string;
  name: string;
  minutes: number;
  tierColor: 'lilac' | 'gold' | 'cosmic';
  weeklyLimit: boolean;
  mergeable: boolean;
  wonThisWeek?: boolean;
}
