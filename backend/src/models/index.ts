import User from './User';
import Quiz from './Quiz';
import Question from './Question';
import QuestionOption from './QuestionOption';
import QuizQuestion from './QuizQuestion';
import UserQuiz from './UserQuiz';
import UserQuizQuestion from './UserQuizQuestion';
import UserAnswer from './UserAnswer';

// Define associations
// User associations
User.hasMany(Quiz, { foreignKey: 'created_by', as: 'createdQuizzes' });
User.hasMany(UserQuiz, { foreignKey: 'user_id', as: 'userQuizzes' });
User.hasMany(UserQuiz, { foreignKey: 'assigned_by', as: 'assignedQuizzes' });

// Quiz associations
Quiz.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'quizQuestions' });
Quiz.hasMany(UserQuiz, { foreignKey: 'quiz_id', as: 'userQuizzes' });
Quiz.belongsToMany(Question, { 
  through: QuizQuestion, 
  foreignKey: 'quiz_id', 
  otherKey: 'question_id',
  as: 'questions' 
});

// Question associations
Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'options' });
Question.hasMany(QuizQuestion, { foreignKey: 'question_id', as: 'quizQuestions' });
Question.hasMany(UserQuizQuestion, { foreignKey: 'question_id', as: 'userQuizQuestions' });
Question.hasMany(UserAnswer, { foreignKey: 'question_id', as: 'userAnswers' });
Question.belongsToMany(Quiz, { 
  through: QuizQuestion, 
  foreignKey: 'question_id', 
  otherKey: 'quiz_id',
  as: 'quizzes' 
});

// QuestionOption associations
QuestionOption.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// QuizQuestion associations
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
QuizQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// UserQuiz associations
UserQuiz.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserQuiz.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
UserQuiz.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedBy' });
UserQuiz.hasMany(UserQuizQuestion, { foreignKey: 'user_quiz_id', as: 'userQuizQuestions' });
UserQuiz.hasMany(UserAnswer, { foreignKey: 'user_quiz_id', as: 'userAnswers' });

// UserQuizQuestion associations
UserQuizQuestion.belongsTo(UserQuiz, { foreignKey: 'user_quiz_id', as: 'userQuiz' });
UserQuizQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// UserAnswer associations
UserAnswer.belongsTo(UserQuiz, { foreignKey: 'user_quiz_id', as: 'userQuiz' });
UserAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

export {
  User,
  Quiz,
  Question,
  QuestionOption,
  QuizQuestion,
  UserQuiz,
  UserQuizQuestion,
  UserAnswer
};

export default {
  User,
  Quiz,
  Question,
  QuestionOption,
  QuizQuestion,
  UserQuiz,
  UserQuizQuestion,
  UserAnswer
};
