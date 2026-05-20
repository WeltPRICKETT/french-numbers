interface Props {
  options: { value: number; french: string }[];
  selectedValue: number | null;
  onSelect: (value: number) => void;
  disabled: boolean;
  showValue?: boolean;
}

export default function MultipleChoiceQuestion({ options, selectedValue, onSelect, disabled, showValue = true }: Props) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="grid grid-cols-2 gap-3 w-full stagger-children">
      {options.map((opt, idx) => {
        const isSelected = selectedValue === opt.value;
        return (
          <button
            key={idx}
            onClick={() => onSelect(opt.value)}
            disabled={disabled}
            className={`select-card p-4 text-center transition-all duration-300 ${
              isSelected ? 'active' : ''
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="font-display text-xs text-[var(--c-gold)] mb-1">
              {letters[idx]}
              {!disabled && <span className="text-[var(--c-border)] ml-1.5">{idx + 1}</span>}
            </div>
            <div className="font-body text-lg font-semibold text-[var(--c-heading)]">{opt.french}</div>
            {showValue && <div className="font-body text-sm text-[var(--c-gold-dark)] italic">{opt.value}</div>}
          </button>
        );
      })}
    </div>
  );
}
