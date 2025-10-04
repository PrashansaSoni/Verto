import apiService from './api';
import { 
  Quiz, 
  CreateQuizData, 
  GenerateQuestionsData, 
  AssignQuizData,
  CreateQuestionData,
  UserQuiz,
  Question
} from '@/types/quiz';
import { User } from '@/types/auth';

class QuizService {
  // Admin Quiz Management
  async createQuiz(data: CreateQuizData): Promise<{ message: string; quiz: Quiz }> {
    return apiService.post('/admin/quizzes', data);
  }

  async getAdminQuizzes(): Promise<{ quizzes: Quiz[] }> {
    return apiService.get('/admin/quizzes');
  }

  async getQuizById(id: number): Promise<{ quiz: Quiz }> {
    return apiService.get(`/admin/quizzes/${id}`);
  }

  async getQuizDetails(id: number): Promise<{ quiz: Quiz; questions: Question[] }> {
    return apiService.get(`/admin/quizzes/${id}/details`);
  }

  // User Quiz Management
  async getUserQuizDetails(id: number): Promise<{ quiz: Quiz; questions: Question[]; userQuizStatus: string }> {
    return apiService.get(`/user/quizzes/${id}/details`);
  }

  async updateQuiz(id: number, data: Partial<CreateQuizData>): Promise<{ message: string; quiz: Quiz }> {
    return apiService.put(`/admin/quizzes/${id}`, data);
  }

  async deleteQuiz(id: number): Promise<{ message: string }> {
    return apiService.delete(`/admin/quizzes/${id}`);
  }

  // Question Generation - Only supports PDF file uploads
  async generateQuestions(quizId: number, data: GenerateQuestionsData): Promise<{ message: string; questions: Question[] }> {
    // Only support PDF file uploads for question generation
    const formData = new FormData();
    
    if (data.file) {
      formData.append('file', data.file);
    }
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.prompt) {
      formData.append('prompt', data.prompt);
    }
    if (data.numberOfQuestions) {
      formData.append('numberOfQuestions', data.numberOfQuestions.toString());
    }
    if (data.difficulty) {
      formData.append('difficulty', data.difficulty);
    }
    if (data.focusAreas) {
      formData.append('focusAreas', data.focusAreas);
    }
    if (data.distributionStrategy) {
      formData.append('distributionStrategy', data.distributionStrategy);
    }

    return apiService.postFormData(`/admin/quizzes/${quizId}/generate-questions`, formData);
  }

  // Manual Question Creation
  async createQuestion(quizId: number, data: CreateQuestionData): Promise<{ message: string; question: Question }> {
    return apiService.post(`/admin/quizzes/${quizId}/questions`, data);
  }

  async updateQuestion(questionId: number, data: Partial<CreateQuestionData>): Promise<{ message: string; question: Question }> {
    return apiService.put(`/admin/questions/${questionId}`, data);
  }

  async deleteQuestion(questionId: number): Promise<{ message: string }> {
    return apiService.delete(`/admin/questions/${questionId}`);
  }

  // Quiz Assignment
  async assignQuiz(data: AssignQuizData): Promise<{ message: string; assignments: UserQuiz[] }> {
    return apiService.post('/admin/assign-quiz', data);
  }

  // Results and Analytics
  async getQuizResults(quizId: number): Promise<{ results: UserQuiz[] }> {
    return apiService.get(`/admin/quizzes/${quizId}/results`);
  }

  async getUserResults(userId: number): Promise<{ results: UserQuiz[] }> {
    return apiService.get(`/admin/users/${userId}/results`);
  }

  // User Management
  async getUsers(page = 1, limit = 10): Promise<{ users: User[]; pagination: any }> {
    return apiService.get(`/admin/users?page=${page}&limit=${limit}`);
  }

  // User Quiz Operations
  async getAssignedQuizzes(): Promise<{ quizzes: UserQuiz[] }> {
    return apiService.get('/user/assigned-quizzes');
  }

  async startQuiz(quizId: number): Promise<{ message: string; userQuiz: UserQuiz; questions: Question[] }> {
    return apiService.post(`/user/quizzes/${quizId}/start`);
  }

  async getQuizQuestions(quizId: number): Promise<{ questions: Question[] }> {
    return apiService.get(`/user/quizzes/${quizId}/questions`);
  }

  async submitQuiz(quizId: number, answers: { questionId: number; selectedOptionIds: number[] }[]): Promise<{
    message: string;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
  }> {
    return apiService.post(`/user/quizzes/${quizId}/submit`, { answers });
  }

  async getQuizResult(quizId: number): Promise<{
    result: {
      score?: number;
      percentage?: number;
      passed: boolean;
      start_time?: string;
      end_time?: string;
      quiz?: Quiz;
    };
    answers?: any[];
    message?: string;
  }> {
    return apiService.get(`/user/quizzes/${quizId}/result`);
  }
}

export default new QuizService();
