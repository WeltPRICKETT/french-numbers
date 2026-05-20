import { useState } from 'react';
import type { MistakeRecord } from '../types';
import { numberToFrench } from '../utils/numberToFrench';
import { removeMistake, clearMistakes, loadMistakes } from '../utils/storage';

interface Props {
  onPracticeMistakes: (mode: string) => void;
  onBack: () => void;
}

export default function MistakeList({ onPracticeMistakes, onBack }: Props) {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => loadMistakes());
  const [sortBy, setSortBy] = useState<'count' | 'recent'>('count');

  const sorted = [...mistakes].sort((a, b) => {
    if (sortBy === 'count') return b.count - a.count;
    return new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime();
  });

  const handleDelete = (number: number) => {
    removeMistake(number);
    setMistakes(loadMistakes());
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有错题吗？')) {
      clearMistakes();
      setMistakes([]);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="content-width mx-auto animate-fade-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-[var(--c-heading)] tracking-wide">Carnet d'erreurs</h2>
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
        </div>

        {mistakes.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <div className="text-5xl mb-4">✦</div>
            <p className="font-body text-[var(--c-secondary)] italic">Aucune erreur — continuez ainsi !</p>
            <button onClick={onBack} className="btn-royal mt-4 px-6 py-2.5 text-sm">
              Pratiquer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="font-body text-sm text-[var(--c-gold-dark)] italic">
                {mistakes.length} erreur{mistakes.length > 1 ? 's' : ''}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'count' | 'recent')}
                className="input-medieval text-sm px-2 py-1"
              >
                <option value="count">Par fréquence</option>
                <option value="recent">Par date</option>
              </select>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => onPracticeMistakes('number-to-french')}
                  className="btn-royal px-3 py-1.5 text-xs"
                >
                  Réviser
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-display text-[var(--c-error)] border border-[color-mix(in_srgb,var(--c-error)_30%,transparent)] rounded-lg hover:bg-[color-mix(in_srgb,var(--c-error)_10%,transparent)] transition-colors"
                >
                  Tout effacer
                </button>
              </div>
            </div>

            <div className="ornament mb-4"><span>ERREURS</span></div>

            <div className="space-y-2 stagger-children">
              {sorted.map((m) => (
                <div
                  key={m.number}
                  className="card-medieval flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-bold text-[var(--c-heading)] min-w-[3ch]">
                      {m.number}
                    </span>
                    <div>
                      <div className="font-body font-semibold text-[var(--c-text)]">{numberToFrench(m.number)}</div>
                      <div className="font-body text-xs text-[var(--c-muted)]">
                        {m.count} fois · {new Date(m.lastWrongAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m.number)}
                    className="px-3 py-1 text-xs font-display text-[var(--c-error)] hover:bg-[color-mix(in_srgb,var(--c-error)_10%,transparent)] rounded-lg transition-colors"
                  >
                    ✗
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
