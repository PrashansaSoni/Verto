import Joi from 'joi';

export const createQuizSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  weightage: Joi.number().integer().min(1).max(1000).default(100),
  timeLimit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(480),
    Joi.string().allow('').optional()
  ).optional().custom((value, helpers) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = parseInt(value);
    if (isNaN(num)) {
      return helpers.error('number.base');
    }
    return num;
  }), // max 8 hours
  cutoff: Joi.number().integer().min(0).max(100).default(0),
  negativeMarking: Joi.boolean().default(false),
  maxQuestions: Joi.number().integer().min(1).max(100).default(10),
  answerReleaseTime: Joi.date().optional()
});

export const updateQuizSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  weightage: Joi.number().integer().min(1).max(1000).optional(),
  timeLimit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(480),
    Joi.string().allow('').optional()
  ).optional().custom((value, helpers) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = parseInt(value);
    if (isNaN(num)) {
      return helpers.error('number.base');
    }
    return num;
  }),
  cutoff: Joi.number().integer().min(0).max(100).optional(),
  negativeMarking: Joi.boolean().optional(),
  maxQuestions: Joi.number().integer().min(1).max(100).optional(),
  answerReleaseTime: Joi.date().optional()
});

export const generateQuestionsSchema = Joi.object({
  prompt: Joi.string().max(1000).default('Generate comprehensive questions covering the main topics'),
  numberOfQuestions: Joi.number().integer().min(1).max(20).default(5),
  content: Joi.string().min(10).required()
});

export const assignQuizSchema = Joi.object({
  quizId: Joi.number().integer().required(),
  userIds: Joi.array().items(Joi.number().integer()).min(1).required()
});

export const createQuestionSchema = Joi.object({
  questionText: Joi.string().min(5).required(),
  questionType: Joi.string().valid('mcq', 'multiple_select', 'true_false').default('mcq'),
  marks: Joi.number().integer().min(1).max(10).default(1),
  correctExplanation: Joi.string().max(500).optional(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().min(1).required(),
      isCorrect: Joi.boolean().required()
    })
  ).min(2).max(6).required()
});

export const updateQuestionSchema = Joi.object({
  questionText: Joi.string().min(5).optional(),
  questionType: Joi.string().valid('mcq', 'multiple_select', 'true_false').optional(),
  marks: Joi.number().integer().min(1).max(10).optional(),
  correctExplanation: Joi.string().max(500).optional(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().min(1).required(),
      isCorrect: Joi.boolean().required()
    })
  ).min(2).max(6).optional()
});
