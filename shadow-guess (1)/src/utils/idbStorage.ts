/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Robust Native IndexedDB Storage wrapper for Shadow Guess
// Unlimited quota, persists images, words, classrooms across tab closes & browser restarts.

const DB_NAME = 'ShadowGuessDB';
const DB_VERSION = 1;
const STORE_NAME = 'shadow_guess_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : null);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to get key ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] idbGet failed for key "${key}":`, err);
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to set key ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] idbSet failed for key "${key}":`, err);
    return false;
  }
}

export async function idbDelete(key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to delete key ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] idbDelete failed for key "${key}":`, err);
    return false;
  }
}
