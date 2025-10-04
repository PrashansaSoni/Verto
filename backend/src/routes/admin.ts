import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { User, Quiz, Question, QuestionOption, QuizQuestion, UserQuiz, UserAnswer } from '../models';
import { upload, readFileContent, deleteFile, parseFileContent } from '../utils/fileUtils';
import { getGeminiService } from '../services/geminiService';
import { 
  createQuizSchema, 
  updateQuizSchema, 
  generateQuestionsSchema, 
  assignQuizSchema,
  createQuestionSchema,
  updateQuestionSchema 
} from '../validators/quiz';
import { Op } from 'sequelize';

const router = Router();

// Apply authentication and admin role to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req: AuthRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: { role: 'user' }, // Only show users, not admins
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user details with statistics
router.get('/users/:id/details', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user information
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user quiz statistics
    const userQuizzes = await UserQuiz.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate statistics
    const totalQuizzes = userQuizzes.length;
    const completedQuizzes = userQuizzes.filter(uq => uq.status === 'completed').length;
    const completedWithScores = userQuizzes.filter(uq => uq.status === 'completed' && uq.score !== null);
    const averageScore = completedWithScores.length > 0 
      ? completedWithScores.reduce((sum, uq) => sum + (uq.score || 0), 0) / completedWithScores.length 
      : 0;
    
    // Calculate total time spent (in seconds)
    const totalTimeSpent = userQuizzes
      .filter(uq => uq.start_time && uq.end_time)
      .reduce((sum, uq) => {
        const startTime = new Date(uq.start_time!).getTime();
        const endTime = new Date(uq.end_time!).getTime();
        return sum + (endTime - startTime) / 1000; // Convert to seconds
      }, 0);

    // Get recent quiz activity (last 5)
    const recentQuizzes = userQuizzes.slice(0, 5).map(uq => ({
      id: uq.id,
      quiz_name: uq.quiz?.name || 'Unknown Quiz',
      status: uq.status,
      score: uq.score,
      completed_at: uq.end_time
    }));

    const stats = {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      totalTimeSpent
    };

    res.json({
      user: user.toJSON(),
      stats,
      recentQuizzes
    });
  } catch (error) {
    next(error);
  }
});

// Create quiz
router.post('/quizzes', async (req: AuthRequest, res: Response, next) => {
  try {
    // Debug logging
    console.log('Quiz creation request body:', req.body);
    
    const { error, value } = createQuizSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Debug logging after validation
    console.log('Validated quiz data:', value);

    const quiz = await Quiz.create({
      name: value.name,
      description: value.description,
      weightage: value.weightage || 100,
      time_limit: value.timeLimit || null, // Map camelCase to snake_case, ensure null if undefined
      max_marks: 0, // Default value
      cutoff: value.cutoff || 0,
      credit: 1, // Default value
      negative_marking: value.negativeMarking || false, // Map camelCase to snake_case
      max_questions: value.maxQuestions || 10, // Map camelCase to snake_case
      answer_release_time: value.answerReleaseTime ? new Date(value.answerReleaseTime) : undefined, // Map camelCase to snake_case
      created_by: req.user!.id
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    next(error);
  }
});

// Get all quizzes created by admin
router.get('/quizzes', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { created_by: req.user!.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Debug logging
    console.log('Admin quizzes query result:', {
      count: quizzes.length,
      firstQuiz: quizzes[0] ? {
        id: quizzes[0].id,
        name: quizzes[0].name,
        time_limit: quizzes[0].time_limit,
        cutoff: quizzes[0].cutoff
      } : null
    });

    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
});

// Get specific quiz with questions
router.get('/quizzes/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);

    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id },
      include: [
        {
          model: Question,
          as: 'questions',
          through: { attributes: ['question_order'] },
          include: [
            {
              model: QuestionOption,
              as: 'options'
            }
          ]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ quiz });
  } catch (error) {
    next(error);
  }
});

// Get quiz details (alias for the above endpoint)
router.get('/quizzes/:id/details', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);

    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id },
      include: [
        {
          model: Question,
          as: 'questions',
          through: { attributes: ['question_order'] },
          include: [
            {
              model: QuestionOption,
              as: 'options'
            }
          ]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ 
      quiz: {
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        weightage: quiz.weightage,
        time_limit: quiz.time_limit,
        max_marks: quiz.max_marks,
        cutoff: quiz.cutoff,
        credit: quiz.credit,
        max_questions: quiz.max_questions,
        negative_marking: quiz.negative_marking,
        answer_release_time: quiz.answer_release_time,
        created_by: quiz.created_by,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at
      },
      questions: (quiz as any).questions || []
    });
  } catch (error) {
    next(error);
  }
});

// Update quiz
router.put('/quizzes/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const { error, value } = updateQuizSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await quiz.update({
      name: value.name,
      description: value.description,
      weightage: value.weightage,
      time_limit: value.timeLimit, // Map camelCase to snake_case
      cutoff: value.cutoff,
      negative_marking: value.negativeMarking, // Map camelCase to snake_case
      max_questions: value.maxQuestions, // Map camelCase to snake_case
      answer_release_time: value.answerReleaseTime ? new Date(value.answerReleaseTime) : undefined, // Map camelCase to snake_case
    });

    res.json({
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    next(error);
  }
});

// Generate questions using AI - supports PDF file uploads or text content
router.post('/quizzes/:id/generate-questions', upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    let parsedContent = null;
    let rawContent = '';

    // Check if either file or content is provided
    if (!req.file && (!req.body.content || req.body.content.trim().length < 10)) {
      return res.status(400).json({ error: 'Either upload a PDF file or provide text content (minimum 10 characters) for question generation' });
    }

    // Ensure only one input method is used
    if (req.file && req.body.content && req.body.content.trim().length > 0) {
      return res.status(400).json({ error: 'Please use either file upload OR text content, not both' });
    }

    if (req.file) {
      // Handle PDF file upload
      try {
        console.log('Processing uploaded PDF file:', {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        });
        
        // Use enhanced file parsing for PDF
        parsedContent = await parseFileContent(req.file.path);
        rawContent = parsedContent.rawText;
        
        // Clean up uploaded file
        deleteFile(req.file.path);
        
        console.log('PDF parsed successfully:', {
          fileName: parsedContent.metadata.fileName,
          sections: parsedContent.sections.length,
          wordCount: parsedContent.wordCount,
          topics: parsedContent.metadata.topics,
          complexity: parsedContent.metadata.complexity,
          contentPreview: rawContent.substring(0, 200) + '...'
        });
        
        // Validate that we have meaningful content
        if (!rawContent || rawContent.trim().length < 50) {
          return res.status(400).json({ 
            error: 'The uploaded PDF does not contain sufficient readable content for question generation. Please ensure the PDF contains meaningful text.' 
          });
        }
        
      } catch (parseError) {
        console.error('PDF parsing failed:', parseError);
        deleteFile(req.file.path);
        
        // Return specific error message for content issues
        if (parseError instanceof Error && parseError.message.includes('insufficient content')) {
          return res.status(400).json({ error: parseError.message });
        }
        
        return res.status(400).json({ 
          error: 'Failed to parse the uploaded PDF file. Please ensure the file is a valid PDF with readable content.' 
        });
      }
    } else {
      // Handle text content
      console.log('Processing text content for question generation');
      rawContent = req.body.content.trim();
      
      // Create a simple parsed content structure for text input
      const wordCount = rawContent.split(/\s+/).length;
      parsedContent = {
        rawText: rawContent,
        sections: [{ content: rawContent, title: 'User Provided Content', type: 'paragraph' as const }],
        wordCount: wordCount,
        estimatedReadingTime: Math.ceil(wordCount / 200), // Assume 200 words per minute reading speed
        metadata: {
          fileName: 'text-content',
          fileType: 'text/plain',
          fileSize: rawContent.length,
          topics: [], // Will be determined by AI
          complexity: 'intermediate' as const
        }
      };
      
      console.log('Text content processed:', {
        wordCount: parsedContent.wordCount,
        contentPreview: rawContent.substring(0, 200) + '...'
      });
    }

    const { error, value } = generateQuestionsSchema.validate({
      ...req.body,
      content: rawContent
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify quiz exists and belongs to admin
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    let generatedQuestions;

    // Use enhanced generation only for file uploads with complex parsed content
    // For text input, use the simpler and more reliable method
    if (req.file && parsedContent && parsedContent.sections.length > 1) {
      console.log('Using enhanced generation for file upload with multiple sections');
      const generationParams = {
        numberOfQuestions: value.numberOfQuestions,
        difficulty: req.body.difficulty || 'medium',
        questionTypes: req.body.questionTypes || ['mcq'],
        focusAreas: req.body.focusAreas ? req.body.focusAreas.split(',').map((area: string) => area.trim()) : undefined,
        customPrompt: value.prompt,
        distributionStrategy: req.body.distributionStrategy || 'weighted'
      };

      generatedQuestions = await getGeminiService().generateQuestionsFromParsedContent(
        parsedContent,
        generationParams
      );
    } else {
      // Use simpler method for text input or simple file content
      console.log('Using simple generation method for text content');
      generatedQuestions = await getGeminiService().generateQuestionsFromText(
        value.content,
        value.prompt,
        value.numberOfQuestions
      );
    }

    // Save generated questions to database
    const savedQuestions = [];
    for (const gq of generatedQuestions) {
      const question = await Question.create({
        question_text: gq.questionText,
        question_type: 'mcq',
        marks: 1,
        correct_explanation: gq.correctExplanation
      });

      // Create options
      for (const option of gq.options) {
        await QuestionOption.create({
          question_id: question.id,
          option_text: option.text,
          is_correct: option.isCorrect
        });
      }

      // Add question to quiz
      await QuizQuestion.create({
        quiz_id: quizId,
        question_id: question.id
      });

      savedQuestions.push({
        ...question.toJSON(),
        sourceSection: gq.sourceSection,
        difficulty: gq.difficulty
      });
    }

    // Return enhanced response with parsing information
    const response = {
      message: `${generatedQuestions.length} questions generated successfully`,
      questions: savedQuestions,
      contentAnalysis: parsedContent ? {
        sections: parsedContent.sections.length,
        wordCount: parsedContent.wordCount,
        estimatedReadingTime: parsedContent.estimatedReadingTime,
        topics: parsedContent.metadata.topics,
        complexity: parsedContent.metadata.complexity,
        fileName: parsedContent.metadata.fileName
      } : null
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create question manually
router.post('/quizzes/:id/questions', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const { error, value } = createQuestionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify quiz exists and belongs to admin
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Validate options based on question type
    const { options, questionType } = value;
    const correctOptions = options.filter((opt: any) => opt.isCorrect);

    if (questionType === 'mcq' || questionType === 'true_false') {
      if (correctOptions.length !== 1) {
        return res.status(400).json({ 
          error: 'MCQ and True/False questions must have exactly one correct option' 
        });
      }
    } else if (questionType === 'multiple_select') {
      if (correctOptions.length < 1) {
        return res.status(400).json({ 
          error: 'Multiple select questions must have at least one correct option' 
        });
      }
    }

    // Create question
    const question = await Question.create({
      question_text: value.questionText,
      question_type: value.questionType,
      marks: value.marks,
      correct_explanation: value.correctExplanation
    });

    // Create options
    for (const option of value.options) {
      await QuestionOption.create({
        question_id: question.id,
        option_text: option.text,
        is_correct: option.isCorrect
      });
    }

    // Add question to quiz
    await QuizQuestion.create({
      quiz_id: quizId,
      question_id: question.id
    });

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Update question
router.put('/quizzes/:quizId/questions/:questionId', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const questionId = parseInt(req.params.questionId);
    const { error, value } = updateQuestionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify quiz belongs to admin
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify question belongs to quiz
    const quizQuestion = await QuizQuestion.findOne({
      where: { quiz_id: quizId, question_id: questionId }
    });

    if (!quizQuestion) {
      return res.status(404).json({ error: 'Question not found in this quiz' });
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update question
    if (value.questionText || value.questionType || value.marks || value.correctExplanation) {
      await question.update({
        question_text: value.questionText || question.question_text,
        question_type: value.questionType || question.question_type,
        marks: value.marks || question.marks,
        correct_explanation: value.correctExplanation || question.correct_explanation
      });
    }

    // Update options if provided
    if (value.options) {
      // Delete existing options
      await QuestionOption.destroy({ where: { question_id: questionId } });

      // Create new options
      for (const option of value.options) {
        await QuestionOption.create({
          question_id: questionId,
          option_text: option.text,
          is_correct: option.isCorrect
        });
      }
    }

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Assign quiz to users
router.post('/assign-quiz', async (req: AuthRequest, res: Response, next) => {
  try {
    const { error, value } = assignQuizSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { quizId, userIds } = value;

    // Verify quiz belongs to admin
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify all users exist
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } }
    });

    if (users.length !== userIds.length) {
      return res.status(400).json({ error: 'Some users not found' });
    }

    // Create user quiz assignments
    const assignments = [];
    for (const userId of userIds) {
      try {
        const assignment = await UserQuiz.create({
          user_id: userId,
          quiz_id: quizId,
          assigned_by: req.user!.id,
          status: 'assigned'
        });
        assignments.push(assignment);
      } catch (error: any) {
        // Skip if already assigned (unique constraint)
        if (error.name !== 'SequelizeUniqueConstraintError') {
          throw error;
        }
      }
    }

    res.json({
      message: `Quiz assigned to ${assignments.length} users`,
      assignments
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz results
router.get('/quizzes/:id/results', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);

    // Verify quiz belongs to admin
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const results = await UserQuiz.findAll({
      where: { quiz_id: quizId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['percentage', 'DESC']]
    });

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Debug endpoint to check user answers
router.get('/debug/user-answers/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const userAnswers = await UserAnswer.findAll({
      include: [
        {
          model: UserQuiz,
          as: 'userQuiz',
          where: { user_id: userId }
        }
      ]
    });

    const userQuizzes = await UserQuiz.findAll({
      where: { user_id: userId },
      attributes: ['id', 'quiz_id', 'status', 'score']
    });

    res.json({
      userAnswers: userAnswers.length,
      userQuizzes: userQuizzes.length,
      details: {
        answers: userAnswers,
        quizzes: userQuizzes
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's all quiz results
router.get('/users/:id/results', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.id);

    const results = await UserQuiz.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          where: { created_by: req.user!.id },
          attributes: ['id', 'name', 'description', 'cutoff']
        },
        {
          model: UserAnswer,
          as: 'userAnswers',
          required: false, // LEFT JOIN to include quizzes even without answers
          include: [
            {
              model: Question,
              as: 'question',
              attributes: ['id', 'question_text', 'question_type', 'marks'],
              include: [
                {
                  model: QuestionOption,
                  as: 'options',
                  attributes: ['id', 'option_text', 'is_correct']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Debug logging
    console.log('User results query:', {
      userId,
      resultsCount: results.length,
      firstResult: results[0] ? {
        id: results[0].id,
        status: results[0].status,
        userAnswersCount: results[0].userAnswers?.length || 0
      } : null
    });

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Delete quiz
router.delete('/quizzes/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);

    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await quiz.destroy();

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update question
router.put('/questions/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const questionId = parseInt(req.params.id);
    
    // Validate question ID
    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }
    
    const { question_text, question_type, marks, correct_explanation } = req.body;

    const question = await Question.findOne({
      where: { id: questionId },
      include: [
        {
          model: Quiz,
          as: 'quizzes',
          where: { created_by: req.user!.id }
        }
      ]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await question.update({
      question_text,
      question_type,
      marks,
      correct_explanation
    });

    // Fetch updated question with options
    const updatedQuestion = await Question.findOne({
      where: { id: questionId },
      include: [
        {
          model: QuestionOption,
          as: 'options'
        }
      ]
    });

    res.json({ 
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    next(error);
  }
});

// Delete question
router.delete('/questions/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const questionId = parseInt(req.params.id);
    
    // Validate question ID
    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const question = await Question.findOne({
      where: { id: questionId },
      include: [
        {
          model: Quiz,
          as: 'quizzes',
          where: { created_by: req.user!.id }
        }
      ]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await question.destroy();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add question to quiz
router.post('/quizzes/:id/questions', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const { question_text, question_type, marks, correct_explanation, options } = req.body;

    // Verify quiz exists and belongs to user
    const quiz = await Quiz.findOne({
      where: { id: quizId, created_by: req.user!.id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Create question
    const question = await Question.create({
      question_text,
      question_type,
      marks: marks || 1,
      correct_explanation
    });

    // Create options
    if (options && Array.isArray(options)) {
      for (const option of options) {
        await QuestionOption.create({
          question_id: question.id,
          option_text: option.text,
          is_correct: option.is_correct || false
        });
      }
    }

    // Add question to quiz using the association
    await (quiz as any).addQuestion(question);

    // Fetch the created question with options
    const createdQuestion = await Question.findOne({
      where: { id: question.id },
      include: [
        {
          model: QuestionOption,
          as: 'options'
        }
      ]
    });

    res.status(201).json({
      message: 'Question added successfully',
      question: createdQuestion
    });
  } catch (error) {
    next(error);
  }
});

export default router;
