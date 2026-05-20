import { useState, useCallback, useEffect } from 'react';
import type { PracticeMode, Difficulty, FeedbackState } from '../types';
import { numberToFrench } from '../utils/numberToFrench';
import { checkFrenchAnswer, checkNumberAnswer } from '../utils/answerNormalize';
import { generateNumberForDifficulty } from '../utils/random';
import { generateChoices } from '../utils/choices';
import { recordAnswer, addMistake } from '../utils/storage';
import { getDifficultyLabel } from '../utils/difficulty';
import AnswerInput from './AnswerInput';
import SpeechControls from './SpeechControls';
import FeedbackPanel from './FeedbackPanel';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import SpeedTimer from './SpeedTimer';

const MODE_LABELS: Record<PracticeMode, string> = {
  'number-to-french': 'Nombre → Français',
  'audio-to-number': 'Écouter → Nombre',
  'french-to-number': 'Français → Nombre',
  'multiple-choice-number': 'Choix (Nombre)',
  'multiple-choice-audio': 'Choix (Audio)',
  'speed': 'Réaction rapide',
};

const SPEED_OPTIONS = [3, 5, 10];
const SPEED_SUB_MODES: { label: string; mode: 'audio-to-number' | 'number-to-french' | 'french-to-number' }[] = [
  { label: 'Audio → №', mode: 'audio-to-number' },
  { label: '№ → Fr', mode: 'number-to-french' },
  { label: 'Fr → №', mode: 'french-to-number' },
];


interface Props {
  mode: PracticeMode;
  difficulty: Difficulty;
  customRange?: [number, number];
  onBack: () => void;
  mistakeNumbers?: number[];
}

export default function PracticePage({ mode, difficulty, customRange, onBack, mistakeNumbers }: Props) {
  const [currentNumber, setCurrentNumber] = useState(() => generateQuestion());
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [choices, setChoices] = useState(() => generateChoices(currentNumber));
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // Speed mode states
  const [speedSeconds, setSpeedSeconds] = useState(5);
  const [speedSubMode, setSpeedSubMode] = useState<'audio-to-number' | 'number-to-french' | 'french-to-number'>('audio-to-number');
  const [speedTimerKey, setSpeedTimerKey] = useState(0);
  const [speedRunning, setSpeedRunning] = useState(false);

  function generateQuestion(): number {
    if (mistakeNumbers && mistakeNumbers.length > 0) {
      return mistakeNumbers[Math.floor(Math.random() * mistakeNumbers.length)];
    }
    return generateNumberForDifficulty(difficulty, customRange?.[0], customRange?.[1]);
  }

  const resetQuestion = useCallback(() => {
    const next = generateQuestion();
    setCurrentNumber(next);
    setUserAnswer('');
    setFeedback('idle');
    setSelectedChoice(null);
    setChoices(generateChoices(next));
    setStartTime(Date.now());
    setSpeedTimerKey((k) => k + 1);
  }, [difficulty, mistakeNumbers]);

  const handleCorrect = useCallback(() => {
    const reactionTime = Date.now() - startTime;
    setFeedback('correct');
    setCorrectCount((c) => c + 1);
    setStreak((s) => s + 1);
    recordAnswer(true, mode, getDifficultyLabel(difficulty), reactionTime);
    setSpeedRunning(false);
  }, [startTime, mode, difficulty]);

  const handleIncorrect = useCallback(() => {
    setFeedback('incorrect');
    setStreak(0);
    recordAnswer(false, mode, getDifficultyLabel(difficulty));
    addMistake(currentNumber, numberToFrench(currentNumber), mode, getDifficultyLabel(difficulty));
    setSpeedRunning(false);
  }, [currentNumber, mode, difficulty]);

  const handleTimeout = useCallback(() => {
    setFeedback('timeout');
    setStreak(0);
    recordAnswer(false, mode, getDifficultyLabel(difficulty));
    addMistake(currentNumber, numberToFrench(currentNumber), mode, getDifficultyLabel(difficulty));
    setSpeedRunning(false);
  }, [currentNumber, mode, difficulty]);

  const handleNext = () => {
    setQuestionCount((c) => c + 1);
    resetQuestion();
    if (mode === 'speed') {
      setSpeedRunning(true);
    }
  };

  const submitTextAnswer = () => {
    if (feedback !== 'idle') return;
    const correctNumber = currentNumber;

    if (mode === 'number-to-french') {
      if (checkFrenchAnswer(userAnswer, correctNumber, numberToFrench)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    } else if (mode === 'audio-to-number' || mode === 'french-to-number') {
      if (checkNumberAnswer(userAnswer, correctNumber)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    }
  };

  const submitSpeedAnswer = () => {
    if (feedback !== 'idle') return;
    const correctNumber = currentNumber;

    if (speedSubMode === 'number-to-french') {
      if (checkFrenchAnswer(userAnswer, correctNumber, numberToFrench)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    } else {
      if (checkNumberAnswer(userAnswer, correctNumber)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    }
  };

  const handleChoiceSelect = (value: number) => {
    if (feedback !== 'idle') return;
    setSelectedChoice(value);
    if (value === currentNumber) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  useEffect(() => {
    if (mode === 'speed') {
      setSpeedRunning(true);
    }
  }, [mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Enter: next question when feedback is shown
      if (e.key === 'Enter' && feedback !== 'idle') {
        e.preventDefault();
        handleNext();
        return;
      }

      // Right arrow: same as Enter when feedback is shown
      if (e.key === 'ArrowRight' && feedback !== 'idle') {
        e.preventDefault();
        handleNext();
        return;
      }

      // 1/2/3/4: select choice in multiple-choice modes
      if (!isTyping && feedback === 'idle' && (mode === 'multiple-choice-number' || mode === 'multiple-choice-audio')) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4 && keyNum <= choices.length) {
          e.preventDefault();
          handleChoiceSelect(choices[keyNum - 1].value);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [feedback, handleNext, mode, choices, handleChoiceSelect]);

  const correctAnswer = mode === 'number-to-french'
    ? numberToFrench(currentNumber)
    : String(currentNumber);

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="content-width mx-auto animate-fade-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
          <div className="text-center">
            <div className="font-display text-sm text-[var(--c-heading)] tracking-wide">{MODE_LABELS[mode]}</div>
            <div className="font-body text-xs text-[var(--c-gold-dark)] italic">{getDifficultyLabel(difficulty)}</div>
          </div>
          <div className="font-display text-sm text-[var(--c-heading)] text-right min-w-[5ch]">
            {questionCount > 0 && (
              <>
                {correctCount}/{questionCount}
                {streak >= 3 && <div className="text-[var(--c-gold)] animate-pulse-glow">✦ {streak}</div>}
              </>
            )}
          </div>
        </div>

        {/* Speed mode config */}
        {mode === 'speed' && feedback === 'idle' && (
          <div className="mb-4 card-medieval p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-body text-sm text-[var(--c-gold-dark)]">⏳ Durée :</span>
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSpeedSeconds(s); setSpeedTimerKey((k) => k + 1); setSpeedRunning(true); }}
                  className={`px-3 py-1 text-sm font-display rounded-lg transition-all ${
                    speedSeconds === s
                      ? 'bg-[var(--c-heading)] text-[var(--c-bg)]'
                      : 'bg-[color-mix(in_srgb,var(--c-border)_20%,transparent)] text-[var(--c-secondary)] hover:bg-[color-mix(in_srgb,var(--c-border)_40%,transparent)]'
                  }`}
                >
                  {s}s
                </button>
              ))}
              <span className="font-body text-sm text-[var(--c-gold-dark)] ml-2">Type :</span>
              {SPEED_SUB_MODES.map((sm) => (
                <button
                  key={sm.mode}
                  onClick={() => setSpeedSubMode(sm.mode)}
                  className={`px-2 py-1 text-xs font-display rounded-lg transition-all ${
                    speedSubMode === sm.mode
                      ? 'bg-[var(--c-heading)] text-[var(--c-bg)]'
                      : 'bg-[color-mix(in_srgb,var(--c-border)_20%,transparent)] text-[var(--c-secondary)] hover:bg-[color-mix(in_srgb,var(--c-border)_40%,transparent)]'
                  }`}
                >
                  {sm.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Speed timer */}
        {mode === 'speed' && (
          <div className="mb-4">
            <SpeedTimer
              seconds={speedSeconds}
              onTimeout={handleTimeout}
              running={speedRunning && feedback === 'idle'}
              resetKey={speedTimerKey}
            />
          </div>
        )}

        {/* Question area */}
        <div className="card-medieval p-6 mb-4">
          {/* Number to French */}
          {mode === 'number-to-french' && (
            <>
              <div className="text-center mb-6">
                <div className="font-display text-6xl font-bold text-[var(--c-heading)]">{currentNumber}</div>
                <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Écrivez en français</div>
              </div>
              <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" />
              <div className="mt-4">
                <AnswerInput
                  value={userAnswer}
                  onChange={setUserAnswer}
                  onSubmit={submitTextAnswer}
                  placeholder="Écrivez le nombre en français..."
                  disabled={feedback !== 'idle'}
                />
              </div>
            </>
          )}

          {/* Audio to Number */}
          {mode === 'audio-to-number' && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">♫</div>
                <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" shortcut />
                <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Écoutez et écrivez le nombre</div>
              </div>
              <AnswerInput
                value={userAnswer}
                onChange={setUserAnswer}
                onSubmit={submitTextAnswer}
                placeholder="Entrez le nombre..."
                disabled={feedback !== 'idle'}
              />
            </>
          )}

          {/* French to Number */}
          {mode === 'french-to-number' && (
            <>
              <div className="text-center mb-6">
                <div className="font-body text-4xl font-bold text-[var(--c-heading)] italic">{numberToFrench(currentNumber)}</div>
                <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Écrivez en chiffres</div>
              </div>
              <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" />
              <div className="mt-4">
                <AnswerInput
                  value={userAnswer}
                  onChange={setUserAnswer}
                  onSubmit={submitTextAnswer}
                  placeholder="Entrez le nombre..."
                  disabled={feedback !== 'idle'}
                />
              </div>
            </>
          )}

          {/* Multiple Choice - Number to French */}
          {mode === 'multiple-choice-number' && (
            <>
              <div className="text-center mb-6">
                <div className="font-display text-5xl font-bold text-[var(--c-heading)] mb-2">{currentNumber}</div>
                <div className="font-body text-sm text-[var(--c-muted)] italic">Choisissez la bonne réponse</div>
              </div>
              <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" />
              <div className="mt-4">
                <MultipleChoiceQuestion
                  options={choices}
                  selectedValue={selectedChoice}
                  onSelect={handleChoiceSelect}
                  disabled={feedback !== 'idle'}
                  showValue={false}
                />
              </div>
            </>
          )}

          {/* Multiple Choice - Audio to Number */}
          {mode === 'multiple-choice-audio' && (
            <>
              <div className="text-center mb-6">
                <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" shortcut />
                <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Choisissez le nombre correspondant</div>
              </div>
              <MultipleChoiceQuestion
                options={choices.map((c) => ({ ...c, french: String(c.value), value: c.value }))}
                selectedValue={selectedChoice}
                onSelect={handleChoiceSelect}
                disabled={feedback !== 'idle'}
                showValue={false}
              />
            </>
          )}

          {/* Speed mode - sub-mode rendering */}
          {mode === 'speed' && (
            <>
              {speedSubMode === 'number-to-french' && (
                <>
                  <div className="text-center mb-6">
                    <div className="font-display text-5xl font-bold text-[var(--c-heading)]">{currentNumber}</div>
                    <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Vite ! Écrivez en français</div>
                  </div>
                  <AnswerInput
                    value={userAnswer}
                    onChange={setUserAnswer}
                    onSubmit={submitSpeedAnswer}
                    placeholder="Écrivez le nombre..."
                    disabled={feedback !== 'idle'}
                  />
                </>
              )}
              {speedSubMode === 'audio-to-number' && (
                <>
                  <div className="text-center mb-6">
                    <SpeechControls text={numberToFrench(currentNumber)} label="Écouter" shortcut />
                    <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Vite ! Écrivez le nombre</div>
                  </div>
                  <AnswerInput
                    value={userAnswer}
                    onChange={setUserAnswer}
                    onSubmit={submitSpeedAnswer}
                    placeholder="Entrez le nombre..."
                    disabled={feedback !== 'idle'}
                  />
                </>
              )}
              {speedSubMode === 'french-to-number' && (
                <>
                  <div className="text-center mb-6">
                    <div className="font-body text-4xl font-bold text-[var(--c-heading)] italic">{numberToFrench(currentNumber)}</div>
                    <div className="font-body text-sm text-[var(--c-muted)] italic mt-2">Vite ! Écrivez en chiffres</div>
                  </div>
                  <AnswerInput
                    value={userAnswer}
                    onChange={setUserAnswer}
                    onSubmit={submitSpeedAnswer}
                    placeholder="Entrez le nombre..."
                    disabled={feedback !== 'idle'}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Feedback */}
        <FeedbackPanel
          state={feedback}
          correctAnswer={correctAnswer}
          onNext={handleNext}
        />

        {/* Keyboard hints */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-body text-xs text-[var(--c-muted)] italic mt-4">
          <span>Enter — valider</span>
          <span>→ — suivant</span>
          <span>Espace — écouter</span>
          {(mode === 'multiple-choice-number' || mode === 'multiple-choice-audio') && (
            <span>1-4 — choisir</span>
          )}
        </div>
      </div>
    </div>
  );
}
