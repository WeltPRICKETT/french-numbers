import type { StudyStats, MistakeRecord } from '../types';

const STATS_KEY = 'french-numbers-stats';
const MISTAKES_KEY = 'french-numbers-mistakes';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDefaultStats(): StudyStats {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    todayAnswered: 0,
    todayCorrect: 0,
    streak: 0,
    bestStreak: 0,
    averageReactionTimeMs: 0,
    modeStats: {},
    difficultyStats: {},
  };
}

export function loadStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedDate = localStorage.getItem('french-numbers-stats-date');
      const today = getTodayKey();
      if (savedDate !== today) {
        parsed.todayAnswered = 0;
        parsed.todayCorrect = 0;
      }
      return { ...getDefaultStats(), ...parsed };
    }
  } catch {
    // ignore
  }
  return getDefaultStats();
}

export function saveStats(stats: StudyStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  localStorage.setItem('french-numbers-stats-date', getTodayKey());
}

export function recordAnswer(
  correct: boolean,
  mode: string,
  difficulty: string,
  reactionTimeMs: number = 0,
): StudyStats {
  const stats = loadStats();
  stats.totalAnswered++;
  stats.todayAnswered++;
  if (correct) {
    stats.totalCorrect++;
    stats.todayCorrect++;
    stats.streak++;
    if (stats.streak > stats.bestStreak) {
      stats.bestStreak = stats.streak;
    }
  } else {
    stats.streak = 0;
  }

  if (reactionTimeMs > 0) {
    const prevTotal = stats.averageReactionTimeMs * (stats.totalAnswered - 1);
    stats.averageReactionTimeMs = (prevTotal + reactionTimeMs) / stats.totalAnswered;
  }

  if (!stats.modeStats[mode]) {
    stats.modeStats[mode] = { answered: 0, correct: 0 };
  }
  stats.modeStats[mode].answered++;
  if (correct) stats.modeStats[mode].correct++;

  if (!stats.difficultyStats[difficulty]) {
    stats.difficultyStats[difficulty] = { answered: 0, correct: 0 };
  }
  stats.difficultyStats[difficulty].answered++;
  if (correct) stats.difficultyStats[difficulty].correct++;

  saveStats(stats);
  return stats;
}

export function loadMistakes(): MistakeRecord[] {
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveMistakes(mistakes: MistakeRecord[]): void {
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
}

export function addMistake(
  number: number,
  french: string,
  mode: string,
  difficulty: string,
): void {
  const mistakes = loadMistakes();
  const existing = mistakes.find((m) => m.number === number);
  if (existing) {
    existing.count++;
    existing.lastWrongAt = new Date().toISOString();
    if (!existing.modes.includes(mode)) existing.modes.push(mode);
    if (!existing.difficulties.includes(difficulty)) existing.difficulties.push(difficulty);
  } else {
    mistakes.push({
      number,
      french,
      count: 1,
      lastWrongAt: new Date().toISOString(),
      modes: [mode],
      difficulties: [difficulty],
    });
  }
  saveMistakes(mistakes);
}

export function removeMistake(number: number): void {
  const mistakes = loadMistakes().filter((m) => m.number !== number);
  saveMistakes(mistakes);
}

export function clearMistakes(): void {
  localStorage.removeItem(MISTAKES_KEY);
}
