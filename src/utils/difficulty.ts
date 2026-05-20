import type { Difficulty, DifficultyConfig } from '../types';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  1: {
    label: '入门 (Niveau 1)',
    description: '0–20，适合刚开始学法语数字',
    min: 0,
    max: 20,
    includeSeventies: false,
  },
  2: {
    label: '基础 (Niveau 2)',
    description: '0–69，不含 70–99',
    min: 0,
    max: 69,
    includeSeventies: false,
  },
  3: {
    label: '进阶 (Niveau 3)',
    description: '0–100，包含所有数字',
    min: 0,
    max: 100,
    includeSeventies: true,
  },
  4: {
    label: '困难专项 (Niveau 4)',
    description: '只练容易混淆的数字',
    min: 0,
    max: 100,
    includeSeventies: true,
    hardSet: [16, 17, 18, 19, 60, 61, 62, 69, 70, 71, 72, 79, 80, 81, 82, 89, 90, 91, 92, 99, 100],
  },
  5: {
    label: '自定义 (Niveau 5)',
    description: '自定义范围',
    min: 0,
    max: 100,
    includeSeventies: true,
  },
};

export function getDifficultyLabel(level: Difficulty): string {
  return DIFFICULTY_CONFIGS[level]?.label ?? `难度 ${level}`;
}
