import type { FeedbackState } from '../types';

interface Props {
  state: FeedbackState;
  correctAnswer: string;
  onNext: () => void;
}

export default function FeedbackPanel({ state, correctAnswer, onNext }: Props) {
  if (state === 'idle') return null;

  const isCorrect = state === 'correct';
  const isTimeout = state === 'timeout';

  return (
    <div className={`p-5 rounded-xl text-center animate-scale-in ${
      isCorrect ? 'feedback-correct' : 'feedback-wrong'
    }`}>
      <div className="font-display text-2xl mb-2 tracking-wide">
        {isCorrect ? '✦ Correct !' : isTimeout ? '⏰ Temps écoulé' : '✗ Incorrect'}
      </div>
      {!isCorrect && (
        <div className="font-body text-sm text-[var(--c-secondary)]">
          La réponse : <span className="font-semibold text-lg text-[var(--c-heading)]">{correctAnswer}</span>
        </div>
      )}
      <button
        onClick={onNext}
        className="btn-royal mt-4 px-8 py-2.5 text-sm"
      >
        Suivant ↵
      </button>
    </div>
  );
}
