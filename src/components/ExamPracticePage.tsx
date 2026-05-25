import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { ExamBank, ExamResult, ExamSessionOptions, Question } from '../types/examBank';
import { buildGradingPackage, checkAnswer, saveResult } from '../utils/examBank';
import SpeechControls from './SpeechControls';

interface Props {
  bank: ExamBank;
  options: ExamSessionOptions;
  onBack: () => void;
  onFinish: () => void;
}

export default function ExamPracticePage({ bank, options, onBack, onFinish }: Props) {
  const initialQuestions = useMemo(() => selectQuestions(bank, options), [bank, options]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(initialQuestions);
  const sessionBank = useMemo<ExamBank>(() => ({ ...bank, questions: sessionQuestions }), [bank, sessionQuestions]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [input, setInput] = useState('');
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const answerInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const question = sessionQuestions[index];
  const total = sessionQuestions.length;
  const currentAnswer = question ? answers[question.id] : undefined;
  const hasAnswered = currentAnswer !== undefined;

  const getUserAnswer = useCallback((): unknown => {
    if (!question) return null;
    switch (question.type) {
      case 'single_choice':
      case 'listening_single_choice':
      case 'true_false':
        return selected[0] ?? null;
      case 'multiple_choice':
      case 'listening_multiple_choice':
        return [...selected].sort();
      case 'fill_in_blank':
        return question.blanks?.length ? blankInputs : input;
      case 'listening_fill_in_blank':
        return question.blanks?.length || (Array.isArray(question.correct_answer) && question.correct_answer.length > 1) ? blankInputs : input;
      case 'short_answer':
      case 'writing':
        return input;
      default:
        return null;
    }
  }, [question, selected, input, blankInputs]);

  const restoreAnswer = useCallback((q: Question, savedAnswer: unknown) => {
    if (savedAnswer !== undefined) {
      setShowFeedback(true);
      if (q.type === 'single_choice' || q.type === 'listening_single_choice' || q.type === 'true_false') {
        setSelected([String(savedAnswer)]);
        setInput('');
        setBlankInputs([]);
      } else if ((q.type === 'multiple_choice' || q.type === 'listening_multiple_choice') && Array.isArray(savedAnswer)) {
        setSelected(savedAnswer as string[]);
        setInput('');
        setBlankInputs([]);
      } else if ((q.type === 'fill_in_blank' || q.type === 'listening_fill_in_blank') && Array.isArray(savedAnswer)) {
        setBlankInputs(savedAnswer.map(String));
        setInput('');
        setSelected([]);
      } else {
        setInput(String(savedAnswer));
        setSelected([]);
        setBlankInputs([]);
      }
    } else {
      setShowFeedback(false);
      setInput('');
      setSelected([]);
      setBlankInputs([]);
    }
  }, []);

  const navigateTo = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= total) return;
    setIndex(newIndex);
    const q = sessionQuestions[newIndex];
    restoreAnswer(q, answers[q.id]);
  }, [answers, restoreAnswer, sessionQuestions, total]);

  useEffect(() => {
    const inputTypes = new Set(['fill_in_blank', 'listening_fill_in_blank', 'short_answer', 'writing']);
    if (!finished && question && inputTypes.has(question.type)) {
      window.setTimeout(() => answerInputRef.current?.focus(), 0);
    }
  }, [finished, index, question]);

  const handleSubmitAnswer = useCallback(() => {
    if (!question) return;
    const answer = getUserAnswer();
    if (isEmptyAnswer(answer)) return;
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    setShowFeedback(true);
  }, [getUserAnswer, question]);

  const finishExam = useCallback(() => {
    if (!question) return;
    const pendingAnswer = getUserAnswer();
    const finalAnswers = isEmptyAnswer(pendingAnswer)
      ? answers
      : { ...answers, [question.id]: answers[question.id] ?? pendingAnswer };

    let correct = 0;
    const answerDetails: ExamResult['answers'] = {};
    for (const q of sessionQuestions) {
      const ua = finalAnswers[q.id];
      const isCorrect = checkAnswer(q, ua);
      if (q.type !== 'writing' && isCorrect) correct++;
      answerDetails[q.id] = { userAnswer: ua, correct: isCorrect };
    }

    const writingCount = sessionQuestions.filter(q => q.type === 'writing').length;
    const gradableTotal = Math.max(0, total - writingCount);
    const score = gradableTotal > 0 ? Math.round((correct / gradableTotal) * 100) : 0;
    const r: ExamResult = {
      bankId: bank.id,
      bankTitle: bank.exam_title,
      date: new Date().toISOString(),
      total,
      correct,
      score,
      answers: answerDetails,
      questionIds: sessionQuestions.map(q => q.id),
      writingPending: writingCount,
    };
    saveResult(r);
    setResult(r);
    setFinished(true);
  }, [answers, bank, getUserAnswer, question, sessionQuestions, total]);

  const handleNext = useCallback(() => {
    if (index < total - 1) navigateTo(index + 1);
    else finishExam();
  }, [finishExam, index, navigateTo, total]);

  const handlePrev = useCallback(() => navigateTo(index - 1), [index, navigateTo]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const pkg = buildGradingPackage(sessionBank, result.answers, options.exportMode);
    if (!pkg) return;
    navigator.clipboard.writeText(pkg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [options.exportMode, result, sessionBank]);

  const retryWrong = useCallback(() => {
    if (!result) return;
    const wrongIds = sessionQuestions.filter(q => !result.answers[q.id]?.correct).map(q => q.id);
    if (wrongIds.length === 0) return;
    setSessionQuestions(sessionQuestions.filter(q => wrongIds.includes(q.id)));
    setIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setFinished(false);
    setResult(null);
    setInput('');
    setSelected([]);
    setBlankInputs([]);
  }, [result, sessionQuestions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        if (showFeedback) handleNext();
        else if (!hasAnswered) handleSubmitAnswer();
      }
      if (!isTyping && !hasAnswered && !showFeedback && question) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4) {
          if ((question.type === 'single_choice' || question.type === 'listening_single_choice') && question.options?.[keyNum - 1]) {
            e.preventDefault();
            setSelected([question.options[keyNum - 1].label]);
          } else if ((question.type === 'multiple_choice' || question.type === 'listening_multiple_choice') && question.options?.[keyNum - 1]) {
            e.preventDefault();
            const label = question.options[keyNum - 1].label;
            setSelected(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]);
          } else if (question.type === 'true_false' && (keyNum === 1 || keyNum === 2)) {
            e.preventDefault();
            setSelected([keyNum === 1 ? 'true' : 'false']);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handleSubmitAnswer, hasAnswered, question, showFeedback]);

  if (total === 0) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="card-medieval p-8 text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--c-heading)]">没有可练习的题目</h2>
          <button onClick={onBack} className="btn-royal px-8 py-2.5 text-sm">返回</button>
        </div>
      </div>
    );
  }

  if (finished && result) {
    const wrongQuestions = sessionQuestions.filter(q => !result.answers[q.id]?.correct);
    const gradableTotal = total - (result.writingPending || 0);
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center p-4">
        <div className="content-width w-full py-8 space-y-5 animate-scale-in">
          <div className="card-medieval p-6 text-center space-y-3">
            <h2 className="font-display text-xl font-bold text-[var(--c-heading)]">{bank.exam_title}</h2>
            <div className="font-display text-5xl font-bold text-[var(--c-gold)]">{result.score}%</div>
            <p className="font-body text-[var(--c-secondary)]">
              自动判分：{result.correct} / {Math.max(1, gradableTotal)}
              {(result.writingPending || 0) > 0 && <span className="text-[var(--c-gold-dark)]"> · 写作 {result.writingPending} 题待批改</span>}
            </p>
          </div>

          <div className="card-medieval p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">错题解析</h3>
              <span className="font-body text-xs text-[var(--c-muted)]">{wrongQuestions.length} 题</span>
            </div>
            {wrongQuestions.length === 0 ? (
              <p className="font-body text-sm text-[var(--c-success)]">本次没有错题。</p>
            ) : (
              wrongQuestions.map((q, idx) => (
                <ReviewCard key={q.id} question={q} index={idx + 1} userAnswer={result.answers[q.id]?.userAnswer} />
              ))
            )}
          </div>

          <div className="card-medieval p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">导出</h3>
            <p className="font-body text-sm text-[var(--c-secondary)]">
              当前导出范围：{options.exportMode === 'short_answer_only' ? '仅简答题/写作题' : '包含回答的所有题目'}
            </p>
            <button onClick={handleExport} className="btn-gold w-full px-6 py-3 text-sm">
              {copied ? '已复制到剪贴板' : '复制导出 JSON'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={retryWrong} disabled={wrongQuestions.length === 0} className="btn-royal px-6 py-3 text-sm disabled:opacity-50">
              只重考本次错题
            </button>
            <button onClick={onFinish} className="btn-gold px-6 py-3 text-sm">
              返回题库
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentIsCorrect = showFeedback && question.type !== 'writing' ? checkAnswer(question, currentAnswer) : false;

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4">
      <div className="content-width w-full py-8 space-y-6 animate-fade-slide-in">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Quitter
          </button>
          <span className="font-display text-sm text-[var(--c-gold-dark)] tracking-wide">{index + 1} / {total}</span>
        </div>

        <div className="w-full bg-[color-mix(in_srgb,var(--c-border)_40%,transparent)] rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--c-gold)] to-[var(--c-gold-dark)] h-2 rounded-full transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        <div className="card-medieval p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill>{typeLabel(question.type)}</Pill>
            <Pill>{diffLabel(question.difficulty)}</Pill>
            {question.knowledge_tags.map(tag => <Pill key={tag}>{tag}</Pill>)}
          </div>
          <p className="font-body text-lg font-medium text-[var(--c-text)] leading-relaxed">{question.content}</p>
          {isListeningQuestion(question) && question.audio_text && (
            <div className="card-medieval p-4 border-l-4 border-[var(--c-gold)]">
              <div className="font-body text-xs text-[var(--c-muted)] mb-2">听力音频</div>
              <SpeechControls text={question.audio_text} label="播放听力" />
              {question.listen_repeats && (
                <p className="font-body text-xs text-[var(--c-muted)] text-center mt-2">建议播放 {question.listen_repeats} 次</p>
              )}
            </div>
          )}
          {renderAnswerArea(question, selected, setSelected, input, setInput, blankInputs, setBlankInputs, hasAnswered, answerInputRef)}
        </div>

        {showFeedback && (
          <div className={`animate-scale-in ${question.type === 'writing' || currentIsCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <p className={`font-display font-semibold ${question.type === 'writing' || currentIsCorrect ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'}`}>
              {question.type === 'writing' ? '已提交，待批改' : currentIsCorrect ? '正确' : '错误'}
            </p>
            {question.type !== 'writing' && !currentIsCorrect && (
              <p className="font-body text-sm text-[var(--c-secondary)] mt-1">标准答案：{formatAnswer(question, question.correct_answer)}</p>
            )}
            {question.explanation && <p className="font-body text-sm text-[var(--c-gold-dark)] italic mt-2">{question.explanation}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handlePrev} disabled={index <= 0} className="btn-royal px-6 py-3 text-sm disabled:opacity-50">上一题</button>
          {!showFeedback ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={isEmptyAnswer(getUserAnswer())}
              className="btn-gold px-6 py-3 text-sm disabled:opacity-50"
            >
              提交
            </button>
          ) : (
            <button onClick={handleNext} className="btn-gold px-6 py-3 text-sm">
              {index < total - 1 ? '下一题' : '查看结果'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function selectQuestions(bank: ExamBank, options: ExamSessionOptions): Question[] {
  const pool = options.questionIds?.length
    ? bank.questions.filter(q => options.questionIds?.includes(q.id))
    : [...bank.questions];
  const count = Math.max(1, Math.min(options.questionCount, pool.length));
  if (options.selectionMode === 'random') {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  }
  return pool.slice(0, count);
}

function isEmptyAnswer(answer: unknown): boolean {
  return answer === null || answer === '' || (Array.isArray(answer) && (answer.length === 0 || answer.some(item => String(item || '').trim() === '')));
}

function ReviewCard({ question, index, userAnswer }: { question: Question; index: number; userAnswer: unknown }) {
  return (
    <div className="bg-[var(--c-error-row-bg)] border border-[var(--c-error-row-border)] rounded-lg p-3 text-sm space-y-2">
      <div className="font-display text-xs text-[var(--c-error)]">错题 {index}</div>
      <div>
        <div className="font-body text-xs text-[var(--c-muted)]">原题题干</div>
        <p className="font-body font-semibold text-[var(--c-text)]">{question.content}</p>
      </div>
      <div>
        <div className="font-body text-xs text-[var(--c-muted)]">你的答案</div>
        <p className="font-body text-[var(--c-error)] whitespace-pre-wrap">{formatAnswer(question, userAnswer)}</p>
      </div>
      <div>
        <div className="font-body text-xs text-[var(--c-muted)]">标准答案</div>
        <p className="font-body text-[var(--c-success)] whitespace-pre-wrap">{formatAnswer(question, question.correct_answer)}</p>
      </div>
      {question.explanation && (
        <div>
          <div className="font-body text-xs text-[var(--c-muted)]">解析</div>
          <p className="font-body text-[var(--c-gold-dark)] italic">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="px-2.5 py-0.5 bg-[color-mix(in_srgb,var(--c-heading)_12%,transparent)] text-[var(--c-heading)] text-xs font-display rounded-full">{children}</span>;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    true_false: '判断',
    fill_in_blank: '填空',
    short_answer: '简答',
    writing: '写作',
    listening_single_choice: '听力单选',
    listening_multiple_choice: '听力多选',
    listening_fill_in_blank: '听力填空',
  };
  return map[type] || type;
}

function diffLabel(d: string): string {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return map[d] || d;
}

function formatAnswer(q: Question, answer: unknown): string {
  if (answer === undefined || answer === null || answer === '') return '未作答';
  if (q.type === 'true_false') return answer === 'true' || answer === true ? '正确 / Vrai' : '错误 / Faux';
  if ((q.type === 'single_choice' || q.type === 'listening_single_choice') && q.options) {
    const opt = q.options.find(o => o.label === answer);
    return opt ? `${opt.label}. ${opt.text}` : String(answer);
  }
  if ((q.type === 'multiple_choice' || q.type === 'listening_multiple_choice') && Array.isArray(answer) && q.options) {
    return answer.map(a => {
      const opt = q.options!.find(o => o.label === a);
      return opt ? `${opt.label}. ${opt.text}` : String(a);
    }).join('；');
  }
  if (Array.isArray(answer)) return answer.join('；');
  return String(answer);
}

function renderAnswerArea(
  question: Question,
  selected: string[],
  setSelected: (s: string[]) => void,
  input: string,
  setInput: (s: string) => void,
  blankInputs: string[],
  setBlankInputs: (s: string[]) => void,
  disabled: boolean,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
) {
  switch (question.type) {
    case 'single_choice':
    case 'listening_single_choice':
      return <ChoiceList question={question} selected={selected} setSelected={setSelected} disabled={disabled} multiple={false} />;
    case 'multiple_choice':
    case 'listening_multiple_choice':
      return <ChoiceList question={question} selected={selected} setSelected={setSelected} disabled={disabled} multiple />;
    case 'true_false':
      return (
        <div className="flex gap-3">
          {[['true', 'Vrai'], ['false', 'Faux']].map(([label, text]) => (
            <button key={label} onClick={() => !disabled && setSelected([label])} disabled={disabled} className={`select-card flex-1 px-4 py-3 text-center ${selected.includes(label) ? 'active' : ''} ${disabled ? 'opacity-60' : ''}`}>
              <span className="font-display text-[var(--c-heading)]">{text}</span>
            </button>
          ))}
        </div>
      );
    case 'fill_in_blank':
    case 'listening_fill_in_blank':
      if (question.blanks?.length || (question.type === 'listening_fill_in_blank' && Array.isArray(question.correct_answer) && question.correct_answer.length > 1)) {
        const blanks = question.blanks || (question.correct_answer as string[]).map((answer, index) => ({
          id: `blank-${index + 1}`,
          label: `空 ${index + 1}`,
          answer,
        }));
        return (
          <div className="space-y-3">
            {blanks.map((blank, index) => (
              <label key={blank.id} className="block font-body text-sm text-[var(--c-secondary)]">
                {blank.label || `空 ${index + 1}`}
                <input
                  ref={index === 0 ? inputRef as RefObject<HTMLInputElement> : undefined}
                  type="text"
                  value={blankInputs[index] || ''}
                  onChange={e => {
                    const next = [...blankInputs];
                    next[index] = e.target.value;
                    setBlankInputs(next);
                  }}
                  disabled={disabled}
                  placeholder="输入答案..."
                  className="input-medieval mt-1 w-full disabled:opacity-60"
                />
              </label>
            ))}
          </div>
        );
      }
      return <input ref={inputRef as RefObject<HTMLInputElement>} type="text" value={input} onChange={e => setInput(e.target.value)} disabled={disabled} placeholder="输入答案..." className="input-medieval w-full disabled:opacity-60" />;
    case 'short_answer':
      return <textarea ref={inputRef as RefObject<HTMLTextAreaElement>} value={input} onChange={e => setInput(e.target.value)} disabled={disabled} placeholder="输入简答..." rows={5} className="input-medieval w-full resize-none disabled:opacity-60" />;
    case 'writing':
      return (
        <div className="space-y-3">
          {question.writing_prompt && <div className="card-medieval p-4 border-l-4 border-[var(--c-gold)]"><p className="font-body text-sm text-[var(--c-secondary)] whitespace-pre-wrap">{question.writing_prompt}</p></div>}
          <textarea ref={inputRef as RefObject<HTMLTextAreaElement>} value={input} onChange={e => setInput(e.target.value)} disabled={disabled} placeholder="在这里写作..." rows={10} className="input-medieval w-full resize-y disabled:opacity-60" />
          <div className="flex items-center justify-between text-xs font-body text-[var(--c-muted)]">
            <span>{input.trim() ? input.trim().split(/\s+/).length : 0} words{question.word_limit ? ` / ${question.word_limit}` : ''}</span>
            {question.grading_criteria?.length ? <span>评分点：{question.grading_criteria.join(' · ')}</span> : null}
          </div>
        </div>
      );
    default:
      return null;
  }
}

function isListeningQuestion(question: Question): boolean {
  return question.type.startsWith('listening_');
}

function ChoiceList({
  question,
  selected,
  setSelected,
  disabled,
  multiple,
}: {
  question: Question;
  selected: string[];
  setSelected: (s: string[]) => void;
  disabled: boolean;
  multiple: boolean;
}) {
  return (
    <div className="space-y-2 stagger-children">
      {multiple && <p className="font-body text-xs text-[var(--c-muted)] italic">可多选</p>}
      {question.options?.map((opt, idx) => (
        <button
          key={opt.label}
          onClick={() => {
            if (disabled) return;
            if (!multiple) setSelected([opt.label]);
            else setSelected(selected.includes(opt.label) ? selected.filter(s => s !== opt.label) : [...selected, opt.label]);
          }}
          disabled={disabled}
          className={`select-card w-full text-left px-4 py-3 transition-all duration-300 ${selected.includes(opt.label) ? 'active' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="font-display text-sm text-[var(--c-gold)] mr-2">{opt.label}.</span>
          <span className="font-body text-[var(--c-text)]">{opt.text}</span>
          {!disabled && <span className="float-right font-display text-xs text-[var(--c-border)]">{idx + 1}</span>}
        </button>
      ))}
    </div>
  );
}
