/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameItem {
  id: string;
  word: string;
  imageUrl: string;
  silhouetteUrl?: string; // Precomputed 100% solid filled silhouette data URL
  silhouetteColor: string; // #000000 for pure black or any custom hex/color
  x: number; // 0 to 100 percentage of container width
  y: number; // 0 to 100 percentage of container height
  scale: number; // default 1.0 (range 0.4 - 2.5)
  numberLabel: number; // 1, 2, 3...
}

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  backgroundImageUrl: string;
  items: GameItem[];
  maxMistakes?: number; // 0 or undefined for unlimited
  unlimitedMistakes?: boolean; // default true
  createdAt: number;
  updatedAt: number;
}

export interface GamePlayState {
  currentQuestionIndex: number;
  revealedItemIds: string[];
  mistakesCount: number;
  isWon: boolean;
  score: number;
  startTime: number;
  endTime: number | null;
}
