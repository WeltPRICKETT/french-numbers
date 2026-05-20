import { useState, useCallback, useEffect } from 'react';
import type { ExamBank, Question, ExamResult } from '../types/examBank';
import { checkAnswer, saveResult, buildGradingPackage } from '../utils/examBank';

interface Props {
  bank: ExamBank;
  onBack: () => void;
  onFinish: () => void;
}

export default function ExamPracticePage({ bank, onBack, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  // Current question state
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const question = bank.questions[index];
  const total = bank.questions.length;
  const currentAnswer = answers[question?.id];
  const hasAnswered = currentAnswer !== undefined;

  const getUserAnswer = useCallback((): unknown => {
    switch (question.type) {
      case 'single_choice':
      case 'true_false':
        return selected[0] ?? null;
      case 'multiple_choice':
        return [...selected].sort();
      case 'fill_in_blank':
      case 'short_answer':
      case 'writing':
        return input;
      default:
        return null;
    }
  }, [question, selected, input]);

  const handleSubmitAnswer = useCallback(() => {
    const answer = getUserAnswer();
    if (answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)) return;
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    setShowFeedback(true);
  }, [getUserAnswer, question]);

  // Navigate to a specific question index, restoring saved answer state
  const navigateTo = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= total) return;
    setIndex(newIndex);
    const q = bank.questions[newIndex];
    const savedAnswer = answers[q.id];
    if (savedAnswer !== undefined) {
      // Restore previously saved answer
      setShowFeedback(true);
      if (q.type === 'single_choice' || q.type === 'true_false') {
        setSelected([String(savedAnswer)]);
        setInput('');
      } else if (q.type === 'multiple_choice' && Array.isArray(savedAnswer)) {
        setSelected(savedAnswer as string[]);
        setInput('');
      } else {
        setInput(String(savedAnswer));
        setSelected([]);
      }
    } else {
      setShowFeedback(false);
      setInput('');
      setSelected([]);
    }
  }, [total, bank.questions, answers]);

  const handleNext = useCallback(() => {
    if (index < total - 1) {
      navigateTo(index + 1);
    } else {
      // Finish exam — compute results
      const finalAnswers = { ...answers, [question.id]: currentAnswer ?? getUserAnswer() };
      let correct = 0;
      const answerDetails: ExamResult['answers'] = {};
      for (const q of bank.questions) {
        const ua = finalAnswers[q.id];
        const isCorrect = checkAnswer(q, ua);
        if (isCorrect) correct++;
        answerDetails[q.id] = { userAnswer: ua, correct: isCorrect };
      }
      const writingCount = bank.questions.filter(q => q.type === 'writing').length;
      const gradableTotal = total - writingCount;
      const score = gradableTotal > 0 ? Math.round((correct / gradableTotal) * 100) : 0;
      const r: ExamResult = {
        bankId: bank.id,
        bankTitle: bank.exam_title,
        date: new Date().toISOString(),
        total,
        correct,
        score,
        answers: answerDetails,
        writingPending: writingCount,
      };
      saveResult(r);
      setResult(r);
      setFinished(true);
    }
  }, [index, total, answers, question, currentAnswer, getUserAnswer, bank, navigateTo]);

  const handlePrev = useCallback(() => {
    navigateTo(index - 1);
  }, [index, navigateTo]);

  // Full keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Enter: submit answer or go to next
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        if (showFeedback) handleNext();
        else if (!hasAnswered) handleSubmitAnswer();
        return;
      }

      // ArrowRight: next question (when feedback shown or already answered)
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (showFeedback || hasAnswered) {
          handleNext();
        }
        return;
      }

      // ArrowLeft: previous question
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }

      // 1/2/3/4: select options (only when not typing and not yet answered)
      if (!isTyping && !hasAnswered && !showFeedback) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4) {
          if (question.type === 'single_choice' && question.options) {
            const opt = question.options[keyNum - 1];
            if (opt) {
              e.preventDefault();
              setSelected([opt.label]);
            }
          } else if (question.type === 'multiple_choice' && question.options) {
            const opt = question.options[keyNum - 1];
            if (opt) {
              e.preventDefault();
              setSelected(prev =>
                prev.includes(opt.label)
                  ? prev.filter(s => s !== opt.label)
                  : [...prev, opt.label]
              );
            }
          } else if (question.type === 'true_false' && (keyNum === 1 || keyNum === 2)) {
            e.preventDefault();
            setSelected([keyNum === 1 ? 'true' : 'false']);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFeedback, hasAnswered, handleNext, handlePrev, handleSubmitAnswer, question]);

  const [copied, setCopied] = useState(false);

  const handleExportGrading = useCallback(() => {
    if (!result) return;
    const pkg = buildGradingPackage(bank, result.answers);
    navigator.clipboard.writeText(pkg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [bank, result]);

  if (finished && result) {
    const passed = bank.pass_score_percent ? result.score >= bank.pass_score_percent : true;
    const writingCount = bank.questions.filter(q => q.type === 'writing').length;
    const nonWritingTotal = total - writingCount;
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
        <div className="content-width w-full card-medieval p-8 text-center space-y-4 animate-scale-in">
          <div className="text-4xl">{passed ? '&#x2726;' : '&#x2694;'}</div>
          <h2 className="font-display text-xl font-bold text-[var(--c-heading)]">
            {bank.exam_title}
          </h2>
          <div className="font-display text-5xl font-bold text-[var(--c-gold)]">{result.score}%</div>
          <p className="font-body text-[var(--c-secondary)]">
            {result.correct} / {nonWritingTotal} correct
            {writingCount > 0 && (
              <span className="text-[var(--c-gold-dark)]"> · {writingCount} écriture(s) à corriger</span>
            )}
          </p>
          {bank.pass_score_percent && nonWritingTotal > 0 && (
            <p className={`font-display text-sm ${passed ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'}`}>
              {passed ? '&#x2713; Réussi' : '&#x2717; Non réussi'} (seuil : {bank.pass_score_percent}%)
            </p>
          )}

          {/* Writing export button */}
          {writingCount > 0 && (
            <div className="card-medieval p-4 space-y-3">
              <div className="ornament"><span>ÉCRITURE</span></div>
              <p className="font-body text-sm text-[var(--c-secondary)]">
                {writingCount} 道写作题需要 AI 批改。点击下方按钮将批改包复制到剪贴板，然后粘贴给 Claude / ChatGPT。
              </p>
              <button
                onClick={handleExportGrading}
                className={`btn-gold w-full px-6 py-3 text-sm transition-all ${copied ? 'opacity-80' : ''}`}
              >
                {copied ? '✓ 已复制到剪贴板' : '导出 AI 批改包'}
              </button>
              {/* Preview writing answers */}
              <div className="text-left space-y-2 mt-2">
                {bank.questions.filter(q => q.type === 'writing').map(q => {
                  const ans = String(result.answers[q.id]?.userAnswer || '');
                  const wordCount = ans.trim().split(/\s+/).filter(Boolean).length;
                  return (
                    <div key={q.id} className="bg-[color-mix(in_srgb,var(--c-heading)_5%,transparent)] rounded-lg p-3 text-sm">
                      <p className="font-body font-semibold text-[var(--c-heading)]">{q.content}</p>
                      {q.word_limit && (
                        <p className="font-body text-xs text-[var(--c-muted)] mt-0.5">
                          {wordCount} / {q.word_limit} mots
                        </p>
                      )}
                      <p className="font-body text-[var(--c-text)] mt-1 whitespace-pre-wrap line-clamp-4">{ans}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-writing errors */}
          {bank.questions.filter(q => q.type !== 'writing' && !result.answers[q.id]?.correct).length > 0 && (
            <div className="mt-6 text-left space-y-3">
              <div className="ornament"><span>ERREURS</span></div>
              {bank.questions
                .filter(q => q.type !== 'writing' && !result.answers[q.id]?.correct)
                .map(q => (
                  <div key={q.id} className="bg-[var(--c-error-row-bg)] border border-[var(--c-error-row-border)] rounded-lg p-3 text-sm">
                    <p className="font-body font-semibold text-[var(--c-text)]">{q.content}</p>
                    <p className="font-body text-[var(--c-error)] mt-1">
                      Réponse : {formatAnswer(q, q.correct_answer)}
                    </p>
                    {q.explanation && (
                      <p className="font-body text-xs text-[var(--c-gold-dark)] italic mt-1">{q.explanation}</p>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <button onClick={onFinish} className="btn-royal px-8 py-2.5 text-sm">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4">
      <div className="content-width w-full py-8 space-y-6 animate-fade-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Quitter
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={index <= 0}
              className="font-display text-sm text-[var(--c-heading)] hover:text-[var(--c-gold)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Question précédente (←)"
            >
              ◂
            </button>
            <span className="font-display text-sm text-[var(--c-gold-dark)] tracking-wide">
              {index + 1} / {total}
            </span>
            <button
              onClick={() => (showFeedback || hasAnswered) && handleNext()}
              disabled={!showFeedback && !hasAnswered}
              className="font-display text-sm text-[var(--c-heading)] hover:text-[var(--c-gold)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Question suivante (→)"
            >
              ▸
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[color-mix(in_srgb,var(--c-border)_40%,transparent)] rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[var(--c-gold)] to-[var(--c-gold-dark)] h-2 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="card-medieval p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[color-mix(in_srgb,var(--c-heading)_12%,transparent)] text-[var(--c-heading)] text-xs font-display rounded-full border border-[color-mix(in_srgb,var(--c-heading)_20%,transparent)]">
              {typeLabel(question.type)}
            </span>
            <span className="px-2.5 py-0.5 bg-[color-mix(in_srgb,var(--c-gold)_12%,transparent)] text-[var(--c-gold-dark)] text-xs font-display rounded-full border border-[color-mix(in_srgb,var(--c-gold)_20%,transparent)]">
              {diffLabel(question.difficulty)}
            </span>
          </div>

          <p className="font-body text-lg font-medium text-[var(--c-text)] leading-relaxed">
            {question.content}
          </p>

          {/* Answer area */}
          {renderAnswerArea(question, selected, setSelected, input, setInput, hasAnswered)}
        </div>

        {/* Feedback */}
        {showFeedback && question.type === 'writing' && (
          <div className="animate-scale-in card-medieval p-4 text-center">
            <p className="font-display font-semibold text-[var(--c-gold)]">
              ✦ Soumis — en attente de correction
            </p>
            <p className="font-body text-sm text-[var(--c-muted)] mt-1 italic">
              写作已提交，完成全部答题后可导出批改包交给 AI 批改
            </p>
          </div>
        )}
        {showFeedback && question.type !== 'writing' && (
          <div className={`animate-scale-in ${
            checkAnswer(question, currentAnswer) ? 'feedback-correct' : 'feedback-wrong'
          }`}>
            <p className={`font-display font-semibold ${
              checkAnswer(question, currentAnswer) ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'
            }`}>
              {checkAnswer(question, currentAnswer) ? '✦ Correct !' : '✗ Incorrect'}
            </p>
            {!checkAnswer(question, currentAnswer) && (
              <p className="font-body text-sm text-[var(--c-secondary)] mt-1">
                Réponse : {formatAnswer(question, question.correct_answer)}
              </p>
            )}
            {question.explanation && (
              <p className="font-body text-sm text-[var(--c-gold-dark)] italic mt-2">{question.explanation}</p>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="text-center">
          {!showFeedback ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={getUserAnswer() === null || getUserAnswer() === '' || (Array.isArray(getUserAnswer()) && (getUserAnswer() as string[]).length === 0)}
              className="btn-royal w-full px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-gold w-full px-6 py-3 text-sm"
            >
              {index < total - 1 ? 'Suivant ↵' : 'Résultats'}
            </button>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-body text-xs text-[var(--c-muted)] italic">
          <span>Enter — valider</span>
          <span>← → — naviguer</span>
          {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
            <span>1-4 — choisir</span>
          )}
          {question.type === 'true_false' && (
            <span>1 Vrai · 2 Faux</span>
          )}
        </div>
      </div>
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    single_choice: 'Choix unique',
    multiple_choice: 'Choix multiple',
    true_false: 'Vrai / Faux',
    fill_in_blank: 'Compléter',
    short_answer: 'Réponse libre',
    writing: 'Écriture',
  };
  return map[type] || type;
}

function diffLabel(d: string): string {
  const map: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
  return map[d] || d;
}

function formatAnswer(q: Question, answer: unknown): string {
  if (q.type === 'true_false') return answer === 'true' || answer === true ? 'Vrai' : 'Faux';
  if (q.type === 'single_choice' && q.options) {
    const opt = q.options.find(o => o.label === answer);
    return opt ? `${opt.label}. ${opt.text}` : String(answer);
  }
  if (q.type === 'multiple_choice' && Array.isArray(answer) && q.options) {
    return (answer as string[]).map(a => {
      const opt = q.options!.find(o => o.label === a);
      return opt ? `${opt.label}` : a;
    }).join(', ');
  }
  return String(answer);
}

function renderAnswerArea(
  question: Question,
  selected: string[],
  setSelected: (s: string[]) => void,
  input: string,
  setInput: (s: string) => void,
  disabled: boolean,
) {
  switch (question.type) {
    case 'single_choice':
      return (
        <div className="space-y-2 stagger-children">
          {question.options?.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => !disabled && setSelected([opt.label])}
              disabled={disabled}
              className={`select-card w-full text-left px-4 py-3 transition-all duration-300 ${
                selected.includes(opt.label) ? 'active' : ''
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="font-display text-sm text-[var(--c-gold)] mr-2">{opt.label}.</span>
              <span className="font-body text-[var(--c-text)]">{opt.text}</span>
              {!disabled && <span className="float-right font-display text-xs text-[var(--c-border)]">{idx + 1}</span>}
            </button>
          ))}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2 stagger-children">
          <p className="font-body text-xs text-[var(--c-muted)] italic">Sélection multiple</p>
          {question.options?.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => {
                if (disabled) return;
                setSelected(
                  selected.includes(opt.label)
                    ? selected.filter(s => s !== opt.label)
                    : [...selected, opt.label]
                );
              }}
              disabled={disabled}
              className={`select-card w-full text-left px-4 py-3 transition-all duration-300 ${
                selected.includes(opt.label) ? 'active' : ''
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="inline-flex items-center gap-2 flex-1">
                <span className={`w-4 h-4 border rounded transition-colors ${
                  selected.includes(opt.label) ? 'bg-[var(--c-gold)] border-[var(--c-gold)]' : 'border-[var(--c-border)]'
                }`} />
                <span>
                  <span className="font-display text-sm text-[var(--c-gold)] mr-1">{opt.label}.</span>
                  <span className="font-body text-[var(--c-text)]">{opt.text}</span>
                </span>
              </span>
              {!disabled && <span className="font-display text-xs text-[var(--c-border)]">{idx + 1}</span>}
            </button>
          ))}
        </div>
      );

    case 'true_false':
      return (
        <div className="flex gap-3">
          {[{ label: 'true', text: 'Vrai', key: '1' }, { label: 'false', text: 'Faux', key: '2' }].map(opt => (
            <button
              key={opt.label}
              onClick={() => !disabled && setSelected([opt.label])}
              disabled={disabled}
              className={`select-card flex-1 px-4 py-3 text-center transition-all duration-300 ${
                selected.includes(opt.label) ? 'active' : ''
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="font-display text-[var(--c-heading)]">{opt.text}</span>
              {!disabled && <span className="font-display text-xs text-[var(--c-border)] ml-2">{opt.key}</span>}
            </button>
          ))}
        </div>
      );

    case 'fill_in_blank':
      return (
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Votre réponse..."
          className="input-medieval w-full disabled:opacity-60"
        />
      );

    case 'short_answer':
      return (
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Votre réponse..."
          rows={4}
          className="input-medieval w-full resize-none disabled:opacity-60"
        />
      );

    case 'writing':
      return (
        <div className="space-y-3">
          {question.writing_prompt && (
            <div className="card-medieval p-4 border-l-4 border-[var(--c-gold)]">
              <p className="font-body text-sm text-[var(--c-secondary)] whitespace-pre-wrap">{question.writing_prompt}</p>
            </div>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={disabled}
            placeholder="Rédigez votre texte ici..."
            rows={10}
            className="input-medieval w-full resize-y disabled:opacity-60"
          />
          <div className="flex items-center justify-between text-xs font-body text-[var(--c-muted)]">
            <span>
              {input.trim() ? input.trim().split(/\s+/).length : 0} mots
              {question.word_limit ? ` / ${question.word_limit} recommandés` : ''}
            </span>
            {question.grading_criteria && question.grading_criteria.length > 0 && (
              <span className="text-[var(--c-gold-dark)]">
                Critères : {question.grading_criteria.join(' · ')}
              </span>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
