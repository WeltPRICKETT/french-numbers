import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIGS } from './difficulty';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateNumberForDifficulty(difficulty: Difficulty, customMin?: number, customMax?: number): number {
  const config = DIFFICULTY_CONFIGS[difficulty];
  if (difficulty === 4 && config.hardSet) {
    return config.hardSet[Math.floor(Math.random() * config.hardSet.length)];
  }
  if (difficulty === 5) {
    const min = customMin ?? 0;
    const max = customMax ?? 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
}
