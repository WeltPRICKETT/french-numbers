export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type PracticeMode =
  | 'number-to-french'
  | 'audio-to-number'
  | 'french-to-number'
  | 'multiple-choice-number'
  | 'multiple-choice-audio'
  | 'speed';

export interface StudyStats {
  totalAnswered: number;
  totalCorrect: number;
  todayAnswered: number;
  todayCorrect: number;
  streak: number;
  bestStreak: number;
  averageReactionTimeMs: number;
  modeStats: Record<string, { answered: number; correct: number }>;
  difficultyStats: Record<string, { answered: number; correct: number }>;
}

export interface MistakeRecord {
  number: number;
  french: string;
  count: number;
  lastWrongAt: string;
  modes: string[];
  difficulties: string[];
}

export interface DifficultyConfig {
  label: string;
  description: string;
  min: number;
  max: number;
  hardSet?: number[];
  includeSeventies: boolean;
}

export type FeedbackState = 'idle' | 'correct' | 'incorrect' | 'timeout';
