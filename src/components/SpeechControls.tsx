import { useCallback, useEffect, useState } from 'react';

interface NativeTTS {
  speak: (text: string, rate: string) => Promise<boolean>;
  getVoices: () => Promise<{ name: string; lang: string }[]>;
  setVoice: (name: string) => Promise<void>;
}

declare global {
  interface Window {
    nativeTTS?: NativeTTS;
  }
}

interface Props {
  text: string;
  label?: string;
  /** @deprecated Space shortcut is now always active */
  shortcut?: boolean;
}

type Speed = 'slow' | 'normal' | 'fast';

export default function SpeechControls({ text, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [error, setError] = useState('');

  const play = useCallback(async () => {
    if (playing) return;
    if (!window.nativeTTS) {
      setError('TTS indisponible — veuillez utiliser l\'app');
      return;
    }

    setError('');
    setPlaying(true);
    try {
      await window.nativeTTS.speak(text, speed);
    } catch {
      setError('Échec de la lecture');
    } finally {
      setPlaying(false);
    }
  }, [text, speed, playing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        play();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [play]);

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <button
        type="button"
        onClick={play}
        disabled={playing}
        className={`btn-royal px-6 py-3 text-sm flex items-center gap-2 ${playing ? 'animate-pulse' : ''}`}
      >
        <span className="text-base">{playing ? '♫' : '▶'}</span>
        {playing ? 'En cours...' : label || 'Écouter'}
      </button>

      <div className="flex gap-1">
        {(['slow', 'normal', 'fast'] as Speed[]).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all duration-200 ${
              speed === s
                ? 'bg-[color-mix(in_srgb,var(--c-gold)_20%,transparent)] text-[var(--c-gold-dark)] border border-[color-mix(in_srgb,var(--c-gold)_40%,transparent)] font-semibold'
                : 'text-[var(--c-muted)] hover:text-[var(--c-secondary)] hover:bg-[color-mix(in_srgb,var(--c-border)_20%,transparent)]'
            }`}
          >
            {{ slow: 'Lent', normal: 'Normal', fast: 'Rapide' }[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="font-body text-xs text-[var(--c-error)] italic animate-fade-in">{error}</div>
      )}
    </div>
  );
}
