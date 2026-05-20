import type { PracticeMode } from '../types';

interface Props {
  selected: PracticeMode | null;
  onSelect: (mode: PracticeMode) => void;
}

const MODES: { mode: PracticeMode; title: string; desc: string; icon: string }[] = [
  { mode: 'number-to-french', title: '看数字写法语', desc: 'Nombre → Français', icon: '✎' },
  { mode: 'audio-to-number', title: '听语音写数字', desc: 'Écouter → Nombre', icon: '♫' },
  { mode: 'french-to-number', title: '看法语写数字', desc: 'Français → Nombre', icon: 'ℹ' },
  { mode: 'multiple-choice-number', title: '选择题（数字）', desc: 'Choix multiples', icon: '✔' },
  { mode: 'multiple-choice-audio', title: '选择题（语音）', desc: 'Écouter et choisir', icon: '♪' },
  { mode: 'speed', title: '快速反应', desc: 'Vitesse!', icon: '⚡' },
];

export default function ModeSelector({ selected, onSelect }: Props) {
  return (
    <div className="w-full space-y-2">
      <div className="ornament text-xs">
        <span>MODE</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 stagger-children">
        {MODES.map((m) => {
          const isSelected = selected === m.mode;
          return (
            <button
              key={m.mode}
              onClick={() => onSelect(m.mode)}
              className={`select-card p-3 text-center transition-all duration-300 ${isSelected ? 'active animate-pulse-glow' : ''}`}
            >
              <span className="text-xl block mb-1">{m.icon}</span>
              <div className="font-display text-xs font-semibold text-[var(--c-heading)] leading-tight">{m.title}</div>
              <div className="font-body text-[10px] text-[var(--c-gold-dark)] mt-0.5 italic">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
