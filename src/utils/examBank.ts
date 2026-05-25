import type { ExamBank, ExamResult, ExamExportMode, Question } from '../types/examBank';

const BANKS_KEY = 'french-exam-banks';
const RESULTS_KEY = 'french-exam-results';

export function loadBanks(): ExamBank[] {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveBanks(banks: ExamBank[]): void {
  localStorage.setItem(BANKS_KEY, JSON.stringify(banks));
}

export function addBank(bank: ExamBank): void {
  const banks = loadBanks();
  const existing = banks.findIndex(b => b.id === bank.id);
  if (existing >= 0) {
    banks[existing] = bank;
  } else {
    banks.push(bank);
  }
  saveBanks(banks);
}

export function removeBank(id: string): void {
  const banks = loadBanks().filter(b => b.id !== id);
  saveBanks(banks);
}

export function validateBank(data: unknown): string | null {
  if (!data || typeof data !== 'object') return '题库必须是一个 JSON 对象。';
  const bank = data as Record<string, unknown>;
  if (!bank.exam_title) return '缺少 exam_title 字段。';
  if (!Array.isArray(bank.questions)) return '缺少 questions 数组。';
  if (!bank.questions.length) return '题库至少需要包含 1 道题。';

  const validTypes = [
    'single_choice',
    'multiple_choice',
    'true_false',
    'fill_in_blank',
    'short_answer',
    'writing',
    'listening_single_choice',
    'listening_multiple_choice',
    'listening_fill_in_blank',
  ];
  const validDifficulties = ['easy', 'medium', 'hard'];

  for (const q of bank.questions as Record<string, unknown>[]) {
    if (!q.id || !q.type || !q.content) return `题目 ${q.id || '未命名'} 缺少必要字段 (id/type/content)。`;
    if (!validTypes.includes(q.type as string)) return `题目 ${q.id} 的 type "${q.type}" 不支持。`;
    if (q.difficulty && !validDifficulties.includes(q.difficulty as string)) return `题目 ${q.id} 的 difficulty 必须是 easy/medium/hard。`;
    if ((q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'listening_single_choice' || q.type === 'listening_multiple_choice') && !Array.isArray(q.options)) return `题目 ${q.id} 必须提供 options 数组。`;
    if (String(q.type).startsWith('listening_') && typeof q.audio_text !== 'string') return `听力题 ${q.id} 必须提供 audio_text 字段。`;
  }

  return null;
}

export function parseBank(data: Record<string, unknown>): ExamBank {
  return {
    id: (data.id as string) || `bank-${Date.now()}`,
    exam_title: (data.exam_title as string) || '未命名题库',
    description: (data.description as string) || '',
    time_limit_minutes: data.time_limit_minutes as number | undefined,
    pass_score_percent: data.pass_score_percent as number | undefined,
    questions: (data.questions as Question[]) || [],
  };
}

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();
}

export function checkAnswer(question: Question, userAnswer: unknown): boolean {
  switch (question.type) {
    case 'single_choice':
    case 'listening_single_choice':
      return userAnswer === question.correct_answer;

    case 'multiple_choice':
    case 'listening_multiple_choice': {
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correct_answer)) return false;
      const sorted = [...userAnswer].sort().join('|');
      const correct = [...question.correct_answer].sort().join('|');
      return sorted === correct;
    }

    case 'true_false':
      return userAnswer === question.correct_answer || String(userAnswer) === String(question.correct_answer);

    case 'fill_in_blank':
    case 'listening_fill_in_blank': {
      if (question.blanks?.length) {
        if (!Array.isArray(userAnswer)) return false;
        return question.blanks.every((blank, index) => {
          const userText = normalizeText(String(userAnswer[index] || ''));
          const accepted = Array.isArray(blank.answer) ? blank.answer : [blank.answer];
          return userText.length > 0 && accepted.some(answer => normalizeText(answer) === userText);
        });
      }

      if (Array.isArray(userAnswer) && Array.isArray(question.correct_answer)) {
        return question.correct_answer.every((answer, index) => (
          normalizeText(String(userAnswer[index] || '')) === normalizeText(String(answer))
        ));
      }

      const userText = normalizeText(String(userAnswer || ''));
      if (!userText) return false;
      const keywords = question.accept_keywords
        || (Array.isArray(question.correct_answer) ? question.correct_answer : [String(question.correct_answer)]);
      return keywords.some(k => normalizeText(k) === userText || userText.includes(normalizeText(k)));
    }

    case 'short_answer': {
      const text = normalizeText(String(userAnswer || ''));
      if (!text) return false;
      const kws = question.scoring_keywords || [];
      if (kws.length === 0) return normalizeText(String(question.correct_answer)) === text;
      const matched = kws.filter(k => text.includes(normalizeText(k)));
      return matched.length >= Math.ceil(kws.length * 0.5);
    }

    case 'writing':
      return String(userAnswer || '').trim().length > 0;

    default:
      return false;
  }
}

export function loadResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveResult(result: ExamResult): void {
  const results = loadResults();
  results.unshift(result);
  if (results.length > 50) results.length = 50;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

export function getMissedQuestionIds(bankId: string): string[] {
  const missed = new Set<string>();
  const recovered = new Set<string>();

  for (const result of loadResults().filter(r => r.bankId === bankId).reverse()) {
    for (const [questionId, answer] of Object.entries(result.answers)) {
      if (answer.correct) {
        recovered.add(questionId);
        missed.delete(questionId);
      } else if (!recovered.has(questionId)) {
        missed.add(questionId);
      }
    }
  }

  return [...missed];
}

export function buildGradingPackage(
  bank: ExamBank,
  answers: ExamResult['answers'],
  mode: ExamExportMode = 'short_answer_only',
): string {
  const exportableTypes = mode === 'short_answer_only'
    ? new Set<Question['type']>(['short_answer', 'writing'])
    : null;

  const exportQuestions = bank.questions.filter(q => {
    if (!answers[q.id]) return false;
    return !exportableTypes || exportableTypes.has(q.type);
  });
  if (exportQuestions.length === 0) return '';

  const submissions = exportQuestions.map(q => ({
    id: q.id,
    type: q.type,
    question: q.content,
    options: q.options || null,
    writing_prompt: q.writing_prompt || null,
    word_limit: q.word_limit || null,
    grading_criteria: q.grading_criteria || null,
    reference_answer: q.correct_answer || null,
    blanks: q.blanks || null,
    student_answer: answers[q.id]?.userAnswer ?? '',
    auto_correct: answers[q.id]?.correct ?? null,
    explanation: q.explanation || null,
  }));

  const pkg = {
    type: mode,
    version: 2,
    exam_title: bank.exam_title,
    date: new Date().toISOString(),
    total_questions: submissions.length,
    submissions,
    grading_instructions: `请作为专业法语教师批改以下答题记录。请逐题提供：
1. 得分 (0-100)
2. 语法纠错：指出错误并给出修正
3. 词汇评价：评价用词准确性和丰富度
4. 表达改进：给出更自然的法语表达
5. 总评：整体评价和下一步建议

请用中文回复，法语原文和修正保留法语。输出格式为 JSON 数组，每个元素对应一道题：
[
  {
    "id": "题目ID",
    "score": 85,
    "grammar_corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
    "vocabulary_notes": "...",
    "improved_version": "改进后的完整法语文本",
    "comment": "总评..."
  }
]`,
  };

  return JSON.stringify(pkg, null, 2);
}
