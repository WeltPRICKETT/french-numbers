import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficulty';

interface Props {
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
  customRange: [number, number];
  onCustomRangeChange: (range: [number, number]) => void;
}

const LEVELS: Difficulty[] = [1, 2, 3, 4, 5];
const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];

export default function DifficultySelector({ selected, onSelect, customRange, onCustomRangeChange }: Props) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div className="w-full space-y-2">
      <div className="ornament text-xs">
        <span>NIVEAU</span>
      </div>
      <div className="flex flex-col gap-2">
        {LEVELS.map((level, i) => {
          const config = DIFFICULTY_CONFIGS[level];
          const isSelected = selected === level;
          return (
            <div key={level}>
              <button
                onClick={() => onSelect(level)}
                className={`select-card w-full text-left px-4 py-3 flex items-center gap-3 ${isSelected ? 'active' : ''}`}
              >
                <span className="font-display text-lg text-[var(--c-gold)] w-7 text-center">{ROMAN[i]}</span>
                <div className="flex-1">
                  <div className="font-display text-sm font-semibold text-[var(--c-heading)]">{config.label}</div>
                  <div className="font-body text-xs text-[var(--c-gold-dark)] italic">
                    {level === 5 ? `Personnalisé : ${customRange[0]}–${customRange[1]}` : config.description}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[var(--c-gold)] animate-fade-in">&#x2726;</span>
                )}
              </button>
              {level === 5 && isSelected && (
                <div className="mt-2 ml-10 flex items-center gap-3 animate-fade-slide-in">
                  <label className="flex items-center gap-1 text-sm text-[var(--c-secondary)] font-body">
                    de
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customRange[0]}
                      onChange={(e) => {
                        const v = clamp(Number(e.target.value));
                        onCustomRangeChange([v, Math.max(v, customRange[1])]);
                      }}
                      className="input-medieval w-16 !py-1.5 !px-2 text-center !text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-sm text-[var(--c-secondary)] font-body">
                    &agrave;
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customRange[1]}
                      onChange={(e) => {
                        const v = clamp(Number(e.target.value));
                        onCustomRangeChange([Math.min(customRange[0], v), v]);
                      }}
                      className="input-medieval w-16 !py-1.5 !px-2 text-center !text-sm"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
