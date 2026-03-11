export type GameState = 'title' | 'countdown' | 'race' | 'goal' | 'result';

export interface SaveData {
  bestTime: number;      // seconds (0 = no record)
  bestCoins: number;
  totalStars: number;    // cumulative across all plays
  playCount: number;
}

export const SAVE_KEY = 'sky-flight-save';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as SaveData;
  } catch { /* ignore */ }
  return { bestTime: 0, bestCoins: 0, totalStars: 0, playCount: 0 };
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
