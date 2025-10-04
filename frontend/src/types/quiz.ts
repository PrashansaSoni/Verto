export interface Quiz {
  id: number;
  name: string;
  description?: string;
  weightage: number;
  time_limit?: number;
  max_marks: number;
  cutoff: number;
  credit: number;
  max_questions: number;
  negative_marking: boolean;
  answer_release_time?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'true_false';
  marks: number;
  correct_explanation?: string;
  options: QuestionOption[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  created_at?: string;
}

export interface UserQuiz {
  id: number;
  user_id: number;
  quiz_id: number;
  assigned_by?: number;
  assigned_at?: string;
  start_time?: string;
  end_time?: string;
  score?: number;
  percentage?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  quiz?: Quiz;
  created_at?: string;
  updated_at?: string;
}

export interface UserAnswer {
  id: number;
  user_quiz_id: number;
  question_id: number;
  selected_option_ids: string;
  is_correct?: boolean;
  marks_obtained: number;
  answered_at?: string;
  question?: Question;
}

export interface QuizResult {
  score?: number;
  percentage?: number;
  passed: boolean;
  start_time?: string;
  end_time?: string;
  quiz?: Quiz;
}

export interface CreateQuizData {
  name: string;
  description?: string;
  weightage?: number;
  timeLimit?: number;
  cutoff?: number;
  negativeMarking?: boolean;
  maxQuestions?: number;
  answerReleaseTime?: string;
}

export interface GenerateQuestionsData {
  prompt?: string;
  numberOfQuestions?: number;
  content?: string;
  file?: File;
  difficulty?: string;
  focusAreas?: string;
  distributionStrategy?: string;
}

export interface CreateQuestionData {
  questionText: string;
  questionType?: 'mcq' | 'multiple_select' | 'true_false';
  marks?: number;
  correctExplanation?: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

export interface AssignQuizData {
  quizId: number;
  userIds: number[];
}
