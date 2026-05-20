import type { PracticeMode, Difficulty } from '../types';
import ModeSelector from './ModeSelector';
import DifficultySelector from './DifficultySelector';

interface Props {
  selectedMode: PracticeMode | null;
  selectedDifficulty: Difficulty;
  customRange: [number, number];
  onModeSelect: (mode: PracticeMode) => void;
  onDifficultySelect: (d: Difficulty) => void;
  onCustomRangeChange: (range: [number, number]) => void;
  onStart: () => void;
  onViewMistakes: () => void;
  onViewStats: () => void;
  onViewExamBank: () => void;
  mistakeCount: number;
}

export default function HomePage({
  selectedMode,
  selectedDifficulty,
  customRange,
  onModeSelect,
  onDifficultySelect,
  onCustomRangeChange,
  onStart,
  onViewMistakes,
  onViewStats,
  onViewExamBank,
  mistakeCount,
}: Props) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
      <div className="content-width w-full space-y-6 animate-fade-slide-in">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="text-4xl">&#x269C;</div>
          <h1 className="font-display text-2xl font-bold text-[var(--c-heading)] tracking-wide">
            Aide-M&eacute;moire Fran&ccedil;ais
          </h1>
          <p className="font-body text-[var(--c-secondary)] text-lg italic">
            个人法语学习助手
          </p>
          <div className="ornament mt-3">
            <span>&#x2726;</span>
          </div>
        </div>

        {/* Two main sections */}
        <div className="grid grid-cols-2 gap-4 stagger-children">
          <button
            onClick={() => document.getElementById('number-config')?.scrollIntoView({ behavior: 'smooth' })}
            className="card-medieval p-5 text-left group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">&#x1F3B5;</div>
            <h2 className="font-display text-sm font-semibold text-[var(--c-heading)]">Nombres</h2>
            <p className="font-body text-xs text-[var(--c-gold-dark)] mt-1 italic">数字听说训练</p>
          </button>

          <button
            onClick={onViewExamBank}
            className="card-medieval p-5 text-left group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">&#x1F4DC;</div>
            <h2 className="font-display text-sm font-semibold text-[var(--c-heading)]">Biblioth&egrave;que</h2>
            <p className="font-body text-xs text-[var(--c-gold-dark)] mt-1 italic">题库练习</p>
          </button>
        </div>

        {/* Number practice config */}
        <div id="number-config" className="card-medieval p-6 space-y-5 animate-fade-slide-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--c-heading)_12%,transparent)] flex items-center justify-center text-sm">&#x1F522;</div>
            <h3 className="font-display text-sm font-semibold text-[var(--c-heading)] tracking-wide uppercase">
              Exercice de Nombres
            </h3>
          </div>

          <ModeSelector selected={selectedMode} onSelect={onModeSelect} />
          <DifficultySelector
            selected={selectedDifficulty}
            onSelect={onDifficultySelect}
            customRange={customRange}
            onCustomRangeChange={onCustomRangeChange}
          />

          <button
            onClick={onStart}
            disabled={!selectedMode}
            className="btn-royal w-full py-3.5 text-sm tracking-wider"
          >
            COMMENCER
          </button>
          {!selectedMode && (
            <p className="font-body text-xs text-[var(--c-muted)] text-center italic">
              Veuillez choisir un mode &mdash; 请先选择练习模式
            </p>
          )}
        </div>

        {/* Nav links */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onViewMistakes}
            className="card-medieval px-4 py-2.5 flex items-center gap-2 text-sm font-body text-[var(--c-secondary)] hover:text-[var(--c-heading)] transition-colors"
          >
            <span>&#x1F4D6;</span>
            <span>Erreurs</span>
            {mistakeCount > 0 && (
              <span className="bg-[var(--c-error)] text-[var(--c-card)] text-xs px-1.5 py-0.5 rounded-full font-display">
                {mistakeCount}
              </span>
            )}
          </button>
          <button
            onClick={onViewStats}
            className="card-medieval px-4 py-2.5 flex items-center gap-2 text-sm font-body text-[var(--c-secondary)] hover:text-[var(--c-heading)] transition-colors"
          >
            <span>&#x1F3C6;</span>
            <span>Statistiques</span>
          </button>
        </div>

        {/* Footer ornament */}
        <div className="text-center text-[var(--c-border)] text-xs tracking-[0.3em] font-display">
          &#x2014; EST. MMXXVI &#x2014;
        </div>
      </div>
    </div>
  );
}
