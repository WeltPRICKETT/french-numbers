import { useState } from 'react';
import type { StudyStats } from '../types';
import { loadStats } from '../utils/storage';

interface Props {
  onBack: () => void;
}

export default function StatsPage({ onBack }: Props) {
  const [stats] = useState<StudyStats>(() => loadStats());

  const todayAccuracy = stats.todayAnswered > 0
    ? ((stats.todayCorrect / stats.todayAnswered) * 100).toFixed(1)
    : '—';
  const totalAccuracy = stats.totalAnswered > 0
    ? ((stats.totalCorrect / stats.totalAnswered) * 100).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="content-width mx-auto animate-fade-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-[var(--c-heading)] tracking-wide">Statistiques</h2>
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
        </div>

        <div className="ornament mb-6"><span>RÉSUMÉ</span></div>

        <div className="grid grid-cols-2 gap-3 mb-6 stagger-children">
          <StatCard label="Aujourd'hui" value={stats.todayAnswered} sub="questions" />
          <StatCard label="Précision" value={`${todayAccuracy}%`} highlight />
          <StatCard label="Total" value={stats.totalAnswered} sub="questions" />
          <StatCard label="Précision totale" value={`${totalAccuracy}%`} highlight />
          <StatCard label="Série actuelle" value={stats.streak} sub="consécutifs" />
          <StatCard label="Meilleure série" value={stats.bestStreak} sub="record" />
        </div>

        <div className="card-medieval p-4 mb-6">
          <div className="font-body text-sm text-[var(--c-gold-dark)] italic">Temps de réaction moyen</div>
          <div className="font-display text-2xl font-bold text-[var(--c-heading)] mt-1">
            {stats.averageReactionTimeMs > 0
              ? `${(stats.averageReactionTimeMs / 1000).toFixed(2)}s`
              : '—'}
          </div>
        </div>

        {Object.keys(stats.modeStats).length > 0 && (
          <div className="mb-6">
            <div className="ornament mb-3"><span>PAR MODE</span></div>
            <div className="space-y-2 stagger-children">
              {Object.entries(stats.modeStats).map(([mode, s]) => {
                const acc = s.answered > 0 ? ((s.correct / s.answered) * 100).toFixed(1) : '—';
                return (
                  <div key={mode} className="card-medieval flex items-center justify-between p-3">
                    <span className="font-body text-sm text-[var(--c-text)]">{modeLabel(mode)}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="font-body text-[var(--c-gold-dark)]">{s.answered} q.</span>
                      <span className="font-display font-semibold text-[var(--c-heading)]">{acc}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.keys(stats.difficultyStats).length > 0 && (
          <div className="mb-6">
            <div className="ornament mb-3"><span>PAR NIVEAU</span></div>
            <div className="space-y-2 stagger-children">
              {Object.entries(stats.difficultyStats).map(([diff, s]) => {
                const acc = s.answered > 0 ? ((s.correct / s.answered) * 100).toFixed(1) : '—';
                return (
                  <div key={diff} className="card-medieval flex items-center justify-between p-3">
                    <span className="font-body text-sm text-[var(--c-text)]">{diff}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="font-body text-[var(--c-gold-dark)]">{s.answered} q.</span>
                      <span className="font-display font-semibold text-[var(--c-heading)]">{acc}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div className="card-medieval p-4 text-center">
      <div className="font-body text-xs text-[var(--c-gold-dark)] italic mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold ${highlight ? 'text-[var(--c-gold)]' : 'text-[var(--c-heading)]'}`}>
        {value}
      </div>
      {sub && <div className="font-body text-[10px] text-[var(--c-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

function modeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'number-to-french': '看数字写法语',
    'audio-to-number': '听语音写数字',
    'french-to-number': '看法语写数字',
    'multiple-choice-number': '选择题（数字）',
    'multiple-choice-audio': '选择题（语音）',
    'speed': '快速反应',
  };
  return labels[mode] ?? mode;
}
