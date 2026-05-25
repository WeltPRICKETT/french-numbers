import { useEffect, useState } from 'react';

interface Props {
  seconds: number;
  onTimeout: () => void;
  running: boolean;
  resetKey: number;
}

export default function SpeedTimer({ seconds, onTimeout, running, resetKey }: Props) {
  return (
    <SpeedTimerBar
      key={`${seconds}-${resetKey}`}
      seconds={seconds}
      onTimeout={onTimeout}
      running={running}
    />
  );
}

function SpeedTimerBar({ seconds, onTimeout, running }: Omit<Props, 'resetKey'>) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onTimeout();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, running, onTimeout]);

  const pct = (remaining / seconds) * 100;
  const isUrgent = remaining <= 2;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-body text-[var(--c-gold-dark)] italic">⏳ Temps restant</span>
        <span className={`font-display font-bold ${isUrgent ? 'text-[var(--c-error)] animate-pulse' : 'text-[var(--c-heading)]'}`}>
          {remaining}s
        </span>
      </div>
      <div className="w-full h-2 bg-[color-mix(in_srgb,var(--c-border)_40%,transparent)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isUrgent ? 'bg-[var(--c-error)]' : pct > 50 ? 'bg-[var(--c-success)]' : 'bg-[var(--c-gold)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
