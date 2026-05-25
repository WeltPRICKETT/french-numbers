import { useMemo, useState } from 'react';
import { numberToFrench } from '../utils/numberToFrench';

interface Props {
  onBack: () => void;
}

type Speed = 'slow' | 'normal' | 'fast';

const SPEED_RATES: Record<Speed, number> = {
  slow: 0.75,
  normal: 1,
  fast: 1.3,
};

const GROUPS = [
  { label: '0-20', min: 0, max: 20 },
  { label: '21-69', min: 21, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90-100', min: 90, max: 100 },
];

export default function NumberTablePage({ onBack }: Props) {
  const [filter, setFilter] = useState(GROUPS[0].label);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [playing, setPlaying] = useState<number | null>(null);
  const rows = useMemo(() => {
    const group = GROUPS.find(item => item.label === filter) || GROUPS[0];
    return Array.from({ length: group.max - group.min + 1 }, (_, index) => group.min + index);
  }, [filter]);

  const play = async (num: number) => {
    const text = numberToFrench(num);
    setPlaying(num);
    try {
      await speak(text, speed);
    } finally {
      setPlaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="content-width mx-auto py-6 space-y-4 animate-fade-slide-in">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
          <h1 className="font-display text-lg font-bold text-[var(--c-heading)] tracking-wide">Table des Nombres</h1>
          <div className="w-12" />
        </div>

        <div className="card-medieval p-4 space-y-3">
          <div>
            <div className="font-body text-sm text-[var(--c-secondary)] mb-1">范围</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 rounded-lg bg-[color-mix(in_srgb,var(--c-border)_24%,transparent)] p-1">
              {GROUPS.map(group => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => setFilter(group.label)}
                  className={`px-2 py-2 rounded-md text-xs font-display transition-all ${
                    filter === group.label ? 'bg-[var(--c-heading)] text-[var(--c-bg)] shadow-sm' : 'text-[var(--c-secondary)] hover:text-[var(--c-heading)]'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-body text-sm text-[var(--c-secondary)] mb-1">语速</div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[color-mix(in_srgb,var(--c-border)_24%,transparent)] p-1">
              {(['slow', 'normal', 'fast'] as Speed[]).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSpeed(item)}
                  className={`px-2 py-2 rounded-md text-xs font-display transition-all ${
                    speed === item ? 'bg-[var(--c-heading)] text-[var(--c-bg)] shadow-sm' : 'text-[var(--c-secondary)] hover:text-[var(--c-heading)]'
                  }`}
                >
                  {{ slow: 'Lent', normal: 'Normal', fast: 'Rapide' }[item]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-medieval overflow-hidden">
          <div className="grid grid-cols-[5rem_1fr_4.5rem] px-4 py-2 text-xs font-display text-[var(--c-gold-dark)] border-b border-[color-mix(in_srgb,var(--c-border)_45%,transparent)]">
            <span>数字</span>
            <span>法语</span>
            <span className="text-right">读音</span>
          </div>
          <div className="divide-y divide-[color-mix(in_srgb,var(--c-border)_35%,transparent)]">
            {rows.map(num => (
              <div key={num} className="grid grid-cols-[5rem_1fr_4.5rem] items-center px-4 py-2.5">
                <div className="font-display text-lg font-semibold text-[var(--c-heading)]">{num}</div>
                <div className="font-body text-lg text-[var(--c-text)]">{numberToFrench(num)}</div>
                <button
                  type="button"
                  onClick={() => play(num)}
                  disabled={playing !== null}
                  className="justify-self-end w-9 h-9 rounded-full btn-royal flex items-center justify-center text-xs disabled:opacity-50"
                  title={`播放 ${num}`}
                >
                  {playing === num ? '♫' : '▶'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function speak(text: string, speed: Speed) {
  if (window.nativeTTS) {
    return window.nativeTTS.speak(text, speed);
  }

  return new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      reject(new Error('Speech synthesis is unavailable'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = SPEED_RATES[speed];
    const frenchVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith('fr'));
    if (frenchVoice) utterance.voice = frenchVoice;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Speech synthesis failed'));
    window.speechSynthesis.speak(utterance);
  });
}
