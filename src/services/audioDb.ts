/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IndexedDB wrapper for word audio storage.
 * Keeps audio out of localStorage (avoids 5MB limit).
 * All functions are async.
 */

const DB_NAME = 'SpellbookAudio';
const DB_VERSION = 1;
const STORE = 'word_audio';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudio(wordId: string, base64: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(base64, wordId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getAudio(wordId: string): Promise<string | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(wordId);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteAudio(wordId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(wordId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Fetch audio for multiple words in one IDB transaction.
 * Returns a Map<wordId, base64> for words that have audio.
 */
export async function getManyAudio(wordIds: string[]): Promise<Map<string, string>> {
  const db = await openDb();
  const map = new Map<string, string>();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    let pending = wordIds.length;
    if (pending === 0) { db.close(); resolve(map); return; }

    wordIds.forEach(id => {
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => {
        if (req.result) map.set(id, req.result);
        if (--pending === 0) { db.close(); resolve(map); }
      };
      req.onerror = () => {
        if (--pending === 0) { db.close(); resolve(map); }
      };
    });
  });
}
