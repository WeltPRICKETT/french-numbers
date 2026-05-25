import { useState } from 'react';
import type { PracticeMode, Difficulty } from './types';
import type { ExamBank, ExamSessionOptions } from './types/examBank';
import { loadMistakes } from './utils/storage';
import { useSettings } from './hooks/useSettings';
import HomePage from './components/HomePage';
import PracticePage from './components/PracticePage';
import MistakeList from './components/MistakeList';
import StatsPage from './components/StatsPage';
import ExamBankPage from './components/ExamBankPage';
import ExamPracticePage from './components/ExamPracticePage';
import SettingsPage from './components/SettingsPage';
import ThemeToggle from './components/ThemeToggle';
import NumberTablePage from './components/NumberTablePage';

type Page = 'home' | 'practice' | 'review' | 'stats' | 'exam-bank' | 'exam-practice' | 'settings' | 'number-table';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [prevPage, setPrevPage] = useState<Page>('home');
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [customRange, setCustomRange] = useState<[number, number]>([0, 100]);
  const [mistakeCount, setMistakeCount] = useState(() => loadMistakes().length);
  const [mistakeNumbers, setMistakeNumbers] = useState<number[] | undefined>();
  const [examBank, setExamBank] = useState<ExamBank | null>(null);
  const [examOptions, setExamOptions] = useState<ExamSessionOptions | null>(null);

  const { settings, setSettings, toggleTheme, resetSettings } = useSettings();

  const handleStart = () => {
    if (!mode) return;
    setMistakeNumbers(undefined);
    setPage('practice');
  };

  const handlePracticeMistakes = (reviewMode: string) => {
    const mistakes = loadMistakes();
    setMistakeNumbers(mistakes.map((m) => m.number));
    setMode(reviewMode as PracticeMode);
    setPage('practice');
  };

  const handleBack = () => {
    setMistakeCount(loadMistakes().length);
    setPage('home');
  };

  const openSettings = () => {
    setPrevPage(page);
    setPage('settings');
  };

  const closeSettings = () => {
    setPage(prevPage);
  };

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <>
      <ThemeToggle
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSettings={openSettings}
      />
      {page === 'home' && (
        <HomePage
          selectedMode={mode}
          selectedDifficulty={difficulty}
          customRange={customRange}
          onModeSelect={setMode}
          onDifficultySelect={setDifficulty}
          onCustomRangeChange={setCustomRange}
          onStart={handleStart}
          onViewMistakes={() => setPage('review')}
          onViewStats={() => setPage('stats')}
          onViewExamBank={() => setPage('exam-bank')}
          onViewNumberTable={() => setPage('number-table')}
          mistakeCount={mistakeCount}
        />
      )}
      {page === 'practice' && mode && (
        <PracticePage
          mode={mode}
          difficulty={difficulty}
          customRange={customRange}
          onBack={handleBack}
          mistakeNumbers={mistakeNumbers}
        />
      )}
      {page === 'review' && (
        <MistakeList
          onPracticeMistakes={handlePracticeMistakes}
          onBack={handleBack}
        />
      )}
      {page === 'stats' && (
        <StatsPage onBack={handleBack} />
      )}
      {page === 'exam-bank' && (
        <ExamBankPage
          onBack={handleBack}
          onStartExam={(bank, options) => { setExamBank(bank); setExamOptions(options); setPage('exam-practice'); }}
        />
      )}
      {page === 'exam-practice' && examBank && examOptions && (
        <ExamPracticePage
          bank={examBank}
          options={examOptions}
          onBack={() => setPage('exam-bank')}
          onFinish={() => setPage('exam-bank')}
        />
      )}
      {page === 'settings' && (
        <SettingsPage
          settings={settings}
          onUpdate={setSettings}
          onReset={resetSettings}
          onBack={closeSettings}
        />
      )}
      {page === 'number-table' && (
        <NumberTablePage onBack={handleBack} />
      )}
    </>
  );
}
