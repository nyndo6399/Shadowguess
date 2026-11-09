/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Classroom, GameItem } from '../types/game';
import { DEFAULT_CLASSROOMS } from './defaultData';
import { idbGet, idbSet } from './idbStorage';

export const STORAGE_KEY_CLASSES = 'shadow_guess_classes_v1';
export const STORAGE_KEY_ACTIVE_ID = 'shadow_guess_active_class_id_v1';
export const STORAGE_KEY_LAST_SAVED = 'shadow_guess_last_saved_time_v1';

// Normalize classroom data ensuring proper shapes and colors
function normalizeClassrooms(parsed: unknown): Classroom[] | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed.map((cls: Classroom) => ({
    ...cls,
    items: (cls.items || []).map((it: GameItem) => ({
      ...it,
      silhouetteColor:
        it.silhouetteColor === '#000000' || !it.silhouetteColor || it.silhouetteColor.startsWith('#')
          ? '#000000'
          : it.silhouetteColor,
    })),
  }));
}

// Synchronous fast loader (for instant first render cache from localStorage)
export function loadClassrooms(): Classroom[] {
  if (typeof window === 'undefined') return DEFAULT_CLASSROOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (!raw) return DEFAULT_CLASSROOMS;
    const parsed = JSON.parse(raw);
    const normalized = normalizeClassrooms(parsed);
    return normalized || DEFAULT_CLASSROOMS;
  } catch (e) {
    console.warn('Initial localStorage read fallback', e);
    return DEFAULT_CLASSROOMS;
  }
}

// Asynchronous persistent loader from IndexedDB (Unlimited quota, holds all images & words permanently)
export async function loadClassroomsAsync(): Promise<Classroom[]> {
  if (typeof window === 'undefined') return DEFAULT_CLASSROOMS;

  try {
    // 1. Try reading from robust IndexedDB first
    const fromIdb = await idbGet<Classroom[]>(STORAGE_KEY_CLASSES);
    const normalizedIdb = normalizeClassrooms(fromIdb);
    if (normalizedIdb && normalizedIdb.length > 0) {
      return normalizedIdb;
    }

    // 2. Fallback to localStorage if migrating from an older version
    const raw = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalizedLs = normalizeClassrooms(parsed);
      if (normalizedLs && normalizedLs.length > 0) {
        // Migrate into IndexedDB for permanent unlimited safety
        await idbSet(STORAGE_KEY_CLASSES, normalizedLs);
        return normalizedLs;
      }
    }

    // 3. First time use: save defaults to both IndexedDB and localStorage
    await idbSet(STORAGE_KEY_CLASSES, DEFAULT_CLASSROOMS);
    saveClassrooms(DEFAULT_CLASSROOMS);
    return DEFAULT_CLASSROOMS;
  } catch (err) {
    console.error('Failed to load classrooms asynchronously:', err);
    return DEFAULT_CLASSROOMS;
  }
}

// Save classrooms to both IndexedDB (primary persistent store) and localStorage (secondary)
export function saveClassrooms(classrooms: Classroom[]): void {
  if (typeof window === 'undefined') return;

  // 1. Save to IndexedDB (No 5MB quota limit, safely stores dozens of high-res images)
  idbSet(STORAGE_KEY_CLASSES, classrooms).catch((err) => {
    console.error('[Storage] Error persisting to IndexedDB:', err);
  });
  idbSet(STORAGE_KEY_LAST_SAVED, Date.now()).catch(() => {});

  // 2. Safely attempt to sync to localStorage as secondary backup without throwing
  try {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classrooms));
  } catch {
    // If quota is exceeded in localStorage, IndexedDB is already keeping everything safe!
  }
}

export function loadActiveId(classrooms: Classroom[]): string {
  if (typeof window === 'undefined') return classrooms[0]?.id || '';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (saved && classrooms.some((c) => c.id === saved)) {
      return saved;
    }
    return classrooms[0]?.id || '';
  } catch {
    return classrooms[0]?.id || '';
  }
}

export async function loadActiveIdAsync(classrooms: Classroom[]): Promise<string> {
  if (typeof window === 'undefined') return classrooms[0]?.id || '';
  try {
    const fromIdb = await idbGet<string>(STORAGE_KEY_ACTIVE_ID);
    if (fromIdb && classrooms.some((c) => c.id === fromIdb)) {
      return fromIdb;
    }
    return loadActiveId(classrooms);
  } catch {
    return loadActiveId(classrooms);
  }
}

export function saveActiveId(id: string): void {
  if (typeof window === 'undefined') return;
  idbSet(STORAGE_KEY_ACTIVE_ID, id).catch(() => {});
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {
    // ignore
  }
}

// Export single classroom to JSON file download
export function exportClassroomToJson(classroom: Classroom): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(classroom, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanName = classroom.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9-]/g, '_');
  downloadAnchor.setAttribute('download', `${cleanName || 'shadow_class'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export ALL classrooms and images to a single complete backup file
export function exportAllClassroomsBackup(classrooms: Classroom[]): void {
  const backupData = {
    version: 1,
    appName: 'Shadow Guess - NHUY',
    exportDate: new Date().toISOString(),
    classrooms,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `shadow_guess_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Parse imported full backup or single classroom JSON
export function parseImportedJson(jsonText: string): Classroom[] | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && Array.isArray(parsed.classrooms)) {
      return normalizeClassrooms(parsed.classrooms);
    }
    if (parsed && parsed.name && Array.isArray(parsed.items)) {
      const normalizedSingle = normalizeClassrooms([parsed]);
      return normalizedSingle;
    }
    if (Array.isArray(parsed)) {
      return normalizeClassrooms(parsed);
    }
    return null;
  } catch (e) {
    console.error('Failed to parse imported json', e);
    return null;
  }
}

// Download Excel template (CSV format compatible with Excel)
export function downloadExcelTemplate(): void {
  const csvContent =
    '\uFEFF"Từ vựng / Câu hỏi (Word)","URL Hình ảnh (Image URL)"\n' +
    '"go for a swim","https://example.com/duck.png"\n' +
    '"go for a ride","https://example.com/bike.png"\n' +
    '"watch a movie","https://example.com/movie.png"\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'mau_nhap_shadow_guess.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Parse imported CSV text into GameItem array
export function parseCsvToItems(csvText: string, currentItemCount: number): GameItem[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const items: GameItem[] = [];
  const startIndex = lines[0].toLowerCase().includes('từ') || lines[0].toLowerCase().includes('word') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());

    const word = parts[0]?.replace(/^"|"$/g, '') || `Từ ${i}`;
    const imgUrl = parts[1]?.replace(/^"|"$/g, '') || '';

    const col = items.length % 4;
    const row = Math.floor(items.length / 4);
    const x = 15 + col * 22;
    const y = 30 + (row % 3) * 22;

    items.push({
      id: `item-csv-${Date.now()}-${i}`,
      word,
      imageUrl: imgUrl,
      silhouetteColor: '#000000',
      x: Math.min(85, Math.max(10, x)),
      y: Math.min(80, Math.max(25, y)),
      scale: 1.0,
      numberLabel: currentItemCount + items.length + 1,
    });
  }

  return items;
}

// Download the standalone single-file HTML directly to the user's computer
export async function downloadStandaloneHtml(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/shadow_guess_standalone.html');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shadow_guess_offline.html';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    }
  } catch (err) {
    console.warn('Fetch standalone failed, using anchor fallback', err);
  }

  // Anchor fallback
  const link = document.createElement('a');
  link.href = '/shadow_guess_standalone.html';
  link.download = 'shadow_guess_offline.html';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}
