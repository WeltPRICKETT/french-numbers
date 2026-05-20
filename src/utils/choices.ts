import { numberToFrench } from './numberToFrench';
import { shuffleArray } from './random';

const CONFUSION_GROUPS: Record<number, number[]> = {
  16: [13, 15, 60],
  17: [7, 10, 70],
  18: [8, 10, 80],
  19: [9, 10, 90],
  60: [50, 16, 70],
  61: [51, 71, 81],
  62: [52, 72, 82],
  69: [59, 79, 89],
  70: [60, 17, 80],
  71: [61, 17, 81],
  72: [62, 82, 92],
  79: [69, 89, 99],
  80: [70, 18, 90],
  81: [71, 61, 91],
  82: [72, 62, 92],
  89: [79, 69, 99],
  90: [80, 19, 100],
  91: [81, 71, 92],
  92: [82, 72, 91],
  99: [89, 79, 100],
  100: [90, 99, 0],
};

export function generateChoices(correctNumber: number, count: number = 4): { value: number; french: string }[] {
  const correct = { value: correctNumber, french: numberToFrench(correctNumber) };

  const preferred = CONFUSION_GROUPS[correctNumber] ?? [];
  const distractors: number[] = [];

  // Add preferred distractors first
  for (const p of preferred) {
    if (p >= 0 && p <= 100 && p !== correctNumber && !distractors.includes(p)) {
      distractors.push(p);
    }
    if (distractors.length >= count - 1) break;
  }

  // Fill remaining with nearby numbers
  const offsets = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 20, -20, 4, -4];
  for (const offset of offsets) {
    if (distractors.length >= count - 1) break;
    const candidate = correctNumber + offset;
    if (candidate >= 0 && candidate <= 100 && candidate !== correctNumber && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }

  // Fill with random if still not enough
  while (distractors.length < count - 1) {
    const rand = Math.floor(Math.random() * 101);
    if (rand !== correctNumber && !distractors.includes(rand)) {
      distractors.push(rand);
    }
  }

  const options = [correct, ...distractors.slice(0, count - 1).map((v) => ({ value: v, french: numberToFrench(v) }))];
  return shuffleArray(options);
}
