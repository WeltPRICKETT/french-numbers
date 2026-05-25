export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer'
  | 'writing'
  | 'listening_single_choice'
  | 'listening_multiple_choice'
  | 'listening_fill_in_blank';
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
  audio_text?: string;          // Text spoken by TTS for listening questions
  listen_repeats?: number;      // Suggested number of plays, informational only
  blanks?: {
    id: string;
    label?: string;
    answer: string | string[];
  }[];                          // Multi-blank listening/fill-in questions
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

export type ExamSelectionMode = 'sequential' | 'random' | 'mistakes';
export type ExamExportMode = 'short_answer_only' | 'all_answered';

export interface ExamSessionOptions {
  questionCount: number;
  selectionMode: ExamSelectionMode;
  exportMode: ExamExportMode;
  questionIds?: string[];
}

export interface ExamResult {
  bankId: string;
  bankTitle: string;
  date: string;
  total: number;
  correct: number;
  score: number;
  answers: Record<string, { userAnswer: unknown; correct: boolean }>;
  questionIds?: string[];
  /** Number of writing questions pending AI review */
  writingPending?: number;
}
