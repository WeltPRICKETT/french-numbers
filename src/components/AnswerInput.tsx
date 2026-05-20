interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  label?: string;
}

export default function AnswerInput({ value, onChange, onSubmit, placeholder, disabled, label }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="w-full animate-fade-slide-in">
      {label && <div className="font-body text-sm text-[var(--c-gold-dark)] mb-2 italic">{label}</div>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input-medieval flex-1 disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="btn-gold px-6 py-3 text-sm"
        >
          Valider
        </button>
      </div>
    </div>
  );
}
