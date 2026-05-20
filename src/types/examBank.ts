export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'writing';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correct_answer: string | string[] | boolean;
  accept_keywords?: string[];
  scoring_keywords?: string[];
  explanation: string;
  knowledge_tags: string[];
  difficulty: QuestionDifficulty;
  // Writing-specific fields
  writing_prompt?: string;      // Detailed instructions for the writing task
  word_limit?: number;          // Suggested word count
  grading_criteria?: string[];  // Criteria for AI grading (e.g. ["语法准确性", "词汇丰富度"])
}

export interface ExamBank {
  id: string;
  exam_title: string;
  description: string;
  time_limit_minutes?: number;
  pass_score_percent?: number;
  questions: Question[];
}

export interface ExamResult {
  bankId: string;
  bankTitle: string;
  date: string;
  total: number;
  correct: number;
  score: number;
  answers: Record<string, { userAnswer: unknown; correct: boolean }>;
  /** Number of writing questions pending AI review */
  writingPending?: number;
}
