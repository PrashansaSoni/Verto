import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Sequelize } from 'sequelize';
import Question from '../models/Question';
import QuestionOption from '../models/QuestionOption';
import Quiz from '../models/Quiz';
import User from '../models/User';
import UserQuiz from '../models/UserQuiz';
import UserAnswer from '../models/UserAnswer';

// Test database setup
let sequelize: Sequelize;

beforeAll(async () => {
  // Create in-memory SQLite database for testing
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
  });

  // Define models
  User.init(User.getAttributes(), { sequelize, modelName: 'User', tableName: 'users' });
  Quiz.init(Quiz.getAttributes(), { sequelize, modelName: 'Quiz', tableName: 'quizzes' });
  Question.init(Question.getAttributes(), { sequelize, modelName: 'Question', tableName: 'questions' });
  QuestionOption.init(QuestionOption.getAttributes(), { sequelize, modelName: 'QuestionOption', tableName: 'question_options' });
  UserQuiz.init(UserQuiz.getAttributes(), { sequelize, modelName: 'UserQuiz', tableName: 'user_quizzes' });
  UserAnswer.init(UserAnswer.getAttributes(), { sequelize, modelName: 'UserAnswer', tableName: 'user_answers' });

  // Set up associations
  Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'options' });
  QuestionOption.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
  
  Quiz.belongsToMany(User, { through: UserQuiz, foreignKey: 'quiz_id', as: 'users' });
  User.belongsToMany(Quiz, { through: UserQuiz, foreignKey: 'user_id', as: 'quizzes' });
  
  UserQuiz.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
  UserQuiz.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  UserQuiz.hasMany(UserAnswer, { foreignKey: 'user_quiz_id', as: 'userAnswers' });
  
  UserAnswer.belongsTo(UserQuiz, { foreignKey: 'user_quiz_id', as: 'userQuiz' });
  UserAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

// Helper function to simulate scoring logic
function calculateScore(
  answers: Array<{ questionId: number; selectedOptionIds: number[] }>,
  questions: Array<{
    id: number;
    marks: number;
    question_type: 'mcq' | 'multiple_select' | 'true_false';
    options: Array<{ id: number; is_correct: boolean }>;
  }>,
  negativeMarking: boolean
): {
  totalScore: number;
  totalMarks: number;
  percentage: number;
  results: Array<{ questionId: number; isCorrect: boolean; marksObtained: number }>;
} {
  let totalScore = 0;
  let totalMarks = 0;
  const results: Array<{ questionId: number; isCorrect: boolean; marksObtained: number }> = [];

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const correctOptions = question.options.filter((opt) => opt.is_correct);
    const selectedOptionIds = answer.selectedOptionIds || [];

    let isCorrect = false;
    let marksObtained = 0;

    // Check if answer is correct
    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      // Single correct answer
      isCorrect =
        selectedOptionIds.length === 1 &&
        correctOptions.some((opt) => opt.id === selectedOptionIds[0]);
    } else if (question.question_type === 'multiple_select') {
      // Multiple correct answers
      const correctIds = correctOptions.map((opt) => opt.id).sort();
      const selectedIds = selectedOptionIds.sort();
      isCorrect =
        correctIds.length === selectedIds.length &&
        correctIds.every((id, index) => id === selectedIds[index]);
    }

    if (isCorrect) {
      marksObtained = question.marks;
      totalScore += marksObtained;
    } else if (negativeMarking) {
      marksObtained = -0.25 * question.marks; // 25% negative marking
      totalScore += marksObtained;
    }

    totalMarks += question.marks;
    results.push({ questionId: question.id, isCorrect, marksObtained });
  }

  const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

  return {
    totalScore,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    results,
  };
}

describe('Scoring Logic Tests', () => {
  describe('MCQ (Single Correct Answer) Scoring', () => {
    test('should award full marks for correct MCQ answer', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(5);
      expect(result.totalMarks).toBe(5);
      expect(result.percentage).toBe(100);
      expect(result.results[0].isCorrect).toBe(true);
      expect(result.results[0].marksObtained).toBe(5);
    });

    test('should award zero marks for incorrect MCQ answer without negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [2] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(0);
      expect(result.totalMarks).toBe(5);
      expect(result.percentage).toBe(0);
      expect(result.results[0].isCorrect).toBe(false);
      expect(result.results[0].marksObtained).toBe(0);
    });

    test('should deduct marks for incorrect MCQ answer with negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [2] }];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(-1); // -0.25 * 4 = -1
      expect(result.totalMarks).toBe(4);
      expect(result.percentage).toBe(-25);
      expect(result.results[0].isCorrect).toBe(false);
      expect(result.results[0].marksObtained).toBe(-1);
    });

    test('should mark as incorrect if multiple options selected for MCQ', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1, 2] }];

      const result = calculateScore(answers, questions, false);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.totalScore).toBe(0);
    });

    test('should mark as incorrect if no option selected for MCQ', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [] }];

      const result = calculateScore(answers, questions, false);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('True/False Question Scoring', () => {
    test('should award full marks for correct true/false answer', () => {
      const questions = [
        {
          id: 1,
          marks: 2,
          question_type: 'true_false' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(2);
      expect(result.percentage).toBe(100);
      expect(result.results[0].isCorrect).toBe(true);
    });

    test('should deduct marks for incorrect true/false with negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 2,
          question_type: 'true_false' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [2] }];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(-0.5); // -0.25 * 2
      expect(result.results[0].marksObtained).toBe(-0.5);
    });
  });

  describe('Multiple Select Question Scoring', () => {
    test('should award full marks when all correct options are selected', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
            { id: 3, is_correct: false },
            { id: 4, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1, 2] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.results[0].isCorrect).toBe(true);
    });

    test('should award full marks when all correct options selected regardless of order', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [3, 1, 2] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(10);
      expect(result.results[0].isCorrect).toBe(true);
    });

    test('should mark as incorrect if only some correct options selected', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, false);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.totalScore).toBe(0);
    });

    test('should mark as incorrect if correct and incorrect options both selected', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1, 2, 3] }];

      const result = calculateScore(answers, questions, false);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.totalScore).toBe(0);
    });

    test('should deduct marks for incorrect multiple select with negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 8,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
            { id: 3, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(-2); // -0.25 * 8
      expect(result.results[0].marksObtained).toBe(-2);
    });

    test('should mark as incorrect if no options selected for multiple select', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: true },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [] }];

      const result = calculateScore(answers, questions, false);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('Mixed Question Types Scoring', () => {
    test('should correctly calculate score for mix of question types', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 3,
          question_type: 'true_false' as const,
          options: [
            { id: 3, is_correct: false },
            { id: 4, is_correct: true },
          ],
        },
        {
          id: 3,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: true },
            { id: 7, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] }, // Correct MCQ
        { questionId: 2, selectedOptionIds: [4] }, // Correct True/False
        { questionId: 3, selectedOptionIds: [5, 6] }, // Correct Multiple Select
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(18); // 5 + 3 + 10
      expect(result.totalMarks).toBe(18);
      expect(result.percentage).toBe(100);
    });

    test('should correctly calculate partial score with some correct and incorrect answers', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 2,
          question_type: 'true_false' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] }, // Correct
        { questionId: 2, selectedOptionIds: [4] }, // Incorrect
        { questionId: 3, selectedOptionIds: [5] }, // Correct
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(6); // 4 + 0 + 2
      expect(result.totalMarks).toBe(10);
      expect(result.percentage).toBe(60);
    });

    test('should handle negative marking across mixed question types', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 8,
          question_type: 'multiple_select' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: true },
            { id: 5, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [2] }, // Incorrect (-1)
        { questionId: 2, selectedOptionIds: [3] }, // Incorrect (-2)
      ];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(-3); // -1 + -2
      expect(result.totalMarks).toBe(12);
      expect(result.percentage).toBe(-25);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty answers array', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers: Array<{ questionId: number; selectedOptionIds: number[] }> = [];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(0);
      expect(result.totalMarks).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.results.length).toBe(0);
    });

    test('should handle answer for non-existent question', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] },
        { questionId: 999, selectedOptionIds: [1] }, // Non-existent question
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(5);
      expect(result.totalMarks).toBe(5);
      expect(result.results.length).toBe(1);
    });

    test('should correctly calculate percentage with decimal precision', () => {
      const questions = [
        {
          id: 1,
          marks: 3,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 3,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 3,
          question_type: 'mcq' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] }, // Correct
        { questionId: 2, selectedOptionIds: [4] }, // Incorrect
        { questionId: 3, selectedOptionIds: [5] }, // Correct
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(6);
      expect(result.totalMarks).toBe(9);
      expect(result.percentage).toBe(66.67); // (6/9)*100 = 66.6666... rounded to 66.67
    });

    test('should handle questions with different marks values', () => {
      const questions = [
        {
          id: 1,
          marks: 1,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 10,
          question_type: 'multiple_select' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: true },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] },
        { questionId: 2, selectedOptionIds: [3] },
        { questionId: 3, selectedOptionIds: [5, 6] },
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(16);
      expect(result.totalMarks).toBe(16);
      expect(result.percentage).toBe(100);
    });

    test('should handle zero marks question', () => {
      const questions = [
        {
          id: 1,
          marks: 0,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(0);
      expect(result.totalMarks).toBe(0);
      expect(result.percentage).toBe(0);
    });

    test('should not apply negative marking to correct answers', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(4);
      expect(result.results[0].marksObtained).toBe(4);
    });

    test('should calculate percentage as 0 when total marks is 0', () => {
      const questions: Array<{
        id: number;
        marks: number;
        question_type: 'mcq' | 'multiple_select' | 'true_false';
        options: Array<{ id: number; is_correct: boolean }>;
      }> = [];

      const answers: Array<{ questionId: number; selectedOptionIds: number[] }> = [];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(0);
      expect(result.totalMarks).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('Negative Marking Scenarios', () => {
    test('should calculate net score with mix of correct and incorrect answers with negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] }, // Correct: +4
        { questionId: 2, selectedOptionIds: [4] }, // Incorrect: -1
        { questionId: 3, selectedOptionIds: [5] }, // Correct: +4
      ];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(7); // 4 - 1 + 4
      expect(result.totalMarks).toBe(12);
      expect(result.percentage).toBe(58.33); // (7/12)*100
    });

    test('should allow negative total score with heavy negative marking', () => {
      const questions = [
        {
          id: 1,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 4,
          question_type: 'mcq' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [2] }, // Incorrect: -1
        { questionId: 2, selectedOptionIds: [4] }, // Incorrect: -1
        { questionId: 3, selectedOptionIds: [6] }, // Incorrect: -1
      ];

      const result = calculateScore(answers, questions, true);

      expect(result.totalScore).toBe(-3);
      expect(result.totalMarks).toBe(12);
      expect(result.percentage).toBe(-25);
    });

    test('should apply 25% negative marking formula correctly', () => {
      const questions = [
        {
          id: 1,
          marks: 10,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [2] }];

      const result = calculateScore(answers, questions, true);

      expect(result.results[0].marksObtained).toBe(-2.5); // -0.25 * 10
      expect(result.totalScore).toBe(-2.5);
    });
  });

  describe('Percentage Calculation', () => {
    test('should round percentage to 2 decimal places', () => {
      const questions = [
        {
          id: 1,
          marks: 7,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
        {
          id: 2,
          marks: 7,
          question_type: 'mcq' as const,
          options: [
            { id: 3, is_correct: true },
            { id: 4, is_correct: false },
          ],
        },
        {
          id: 3,
          marks: 7,
          question_type: 'mcq' as const,
          options: [
            { id: 5, is_correct: true },
            { id: 6, is_correct: false },
          ],
        },
      ];

      const answers = [
        { questionId: 1, selectedOptionIds: [1] }, // Correct
        { questionId: 2, selectedOptionIds: [3] }, // Correct
        { questionId: 3, selectedOptionIds: [6] }, // Incorrect
      ];

      const result = calculateScore(answers, questions, false);

      expect(result.totalScore).toBe(14);
      expect(result.totalMarks).toBe(21);
      // (14/21)*100 = 66.666... should round to 66.67
      expect(result.percentage).toBe(66.67);
    });

    test('should handle 100% score correctly', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [1] }];

      const result = calculateScore(answers, questions, false);

      expect(result.percentage).toBe(100);
    });

    test('should handle 0% score correctly', () => {
      const questions = [
        {
          id: 1,
          marks: 5,
          question_type: 'mcq' as const,
          options: [
            { id: 1, is_correct: true },
            { id: 2, is_correct: false },
          ],
        },
      ];

      const answers = [{ questionId: 1, selectedOptionIds: [2] }];

      const result = calculateScore(answers, questions, false);

      expect(result.percentage).toBe(0);
    });
  });
});

