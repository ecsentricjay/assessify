// lib/types/question.ts
// Unified type for extracted questions from AI services
// This prevents type conflicts between claude.service and gemini.service

export interface ExtractedQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer?: string; // Made optional instead of string | null
  marks?: number;
  explanation?: string;
}

export interface QuestionOption {
  id: string;
  option_text: string;
  option_image_url?: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  test_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  question_text: string;
  question_image_url?: string;
  marks: number;
  order_index: number;
  explanation?: string;
  options?: QuestionOption[];
  created_at?: string;
  updated_at?: string;
}