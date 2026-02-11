// lib/types/test.types.ts

export type TestType = 'quiz' | 'midterm' | 'final_exam' | 'practice';
export type QuestionType = 'mcq' | 'true_false' | 'essay';
export type TestStatus = 'draft' | 'published' | 'archived';
export type AttemptStatus = 'in_progress' | 'completed' | 'expired';

// Test Interface
export interface Test {
  id: string;
  course_id?: string | null;
  created_by: string;
  title: string;
  description?: string | null;
  test_type: TestType;
  instructions?: string | null;
  total_marks: number;
  allocated_marks: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  pass_mark: number;
  max_attempts: number;
  access_cost: number;
  is_published: boolean;
  is_standalone: boolean;
  access_code?: string | null;
  display_course_code?: string | null;
  display_course_title?: string | null;
  created_at: string;
  updated_at: string;
}

// Question Interface
export interface Question {
  id: string;
  test_id: string;
  question_type: QuestionType;
  question_text: string;
  question_image_url?: string | null;
  marks: number;
  order_index: number;
  explanation?: string | null;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

// Question Option Interface
export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_image_url?: string | null;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

// Test Attempt Interface
export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string | null;
  time_taken_minutes?: number | null;
  total_score?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  status: AttemptStatus;
  answers?: any;
  created_at: string;
  updated_at: string;
}

// Student Answer Interface
export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids?: string[] | null;
  answer_text?: string | null;
  is_correct?: boolean | null;
  marks_awarded?: number | null;
  ai_feedback?: string | null;
  answered_at: string;
}

// Extended interfaces with relations
export interface TestWithDetails extends Test {
  course?: {
    id: string;
    course_code: string;
    course_title: string;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    title?: string;
  };
  questions_count?: number;
  attempts_count?: number;
  avg_score?: number;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export interface AttemptWithDetails extends TestAttempt {
  test?: TestWithDetails;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    matric_number?: string;
    email?: string;
    level?: number;
    department?: string;
  };
  answers?: StudentAnswerWithQuestion[];
}

export interface StudentAnswerWithQuestion extends StudentAnswer {
  question?: QuestionWithOptions;
}

// Form data types for creation
export interface CreateTestData {
  title: string;
  description?: string;
  test_type: TestType;
  instructions?: string;
  total_marks: number;
  allocated_marks: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_results_immediately?: boolean;
  allow_review?: boolean;
  pass_mark: number;
  max_attempts?: number;
  access_cost?: number;
  course_id?: string;
  is_standalone?: boolean;
  display_course_code?: string;
  display_course_title?: string;
}

export interface CreateQuestionData {
  question_type: QuestionType;
  question_text: string;
  question_image_url?: string;
  marks: number;
  explanation?: string;
  options?: CreateQuestionOptionData[];
}

export interface CreateQuestionOptionData {
  option_text: string;
  option_image_url?: string;
  is_correct: boolean;
}

export interface SubmitAnswerData {
  attempt_id: string;
  question_id: string;
  selected_option_ids?: string[];
  answer_text?: string;
}

// CSV Question Import
export interface CSVQuestionRow {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'essay';
  marks: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_answer: string; // 'A', 'B', 'C', 'D', 'E', or 'True', 'False'
  explanation?: string;
}

// Test Statistics
export interface TestStatistics {
  total_attempts: number;
  completed_attempts: number;
  in_progress_attempts: number;
  average_score: number;
  pass_rate: number;
  average_time_taken: number;
  highest_score: number;
  lowest_score: number;
}

// Student Test Status
export interface StudentTestStatus {
  test: TestWithDetails;
  can_start: boolean;
  can_continue: boolean;
  attempts_used: number;
  attempts_remaining: number;
  best_score?: number;
  last_attempt?: TestAttempt;
  reason?: string; // Why can't start (expired, max attempts, etc.)
}

// Export result data
export interface TestResultExport {
  student_name: string;
  matric_number: string;
  email: string;
  attempt_number: number;
  score: number;
  percentage: number;
  passed: boolean;
  time_taken_minutes: number;
  submitted_at: string;
  status: string;
}