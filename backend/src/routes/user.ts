import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireUser } from '../middleware/auth';
import { User, Quiz, UserQuiz, UserQuizQuestion, Question, QuestionOption, UserAnswer } from '../models';
import { updateProfileSchema } from '../validators/auth';
import { Op } from 'sequelize';

const router = Router();

// Apply authentication to all user routes
router.use(authenticateToken);
router.use(requireUser);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res: Response, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update(value);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get assigned quizzes
router.get('/assigned-quizzes', async (req: AuthRequest, res: Response, next) => {
  try {
    const userQuizzes = await UserQuiz.findAll({
      where: { user_id: req.user!.id },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'name', 'description', 'time_limit', 'max_marks', 'cutoff', 'max_questions']
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    res.json({ quizzes: userQuizzes });
  } catch (error) {
    next(error);
  }
});

// Get quiz details for preview (before starting)
router.get('/quizzes/:id/details', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Check if user has access to this quiz
    const userQuiz = await UserQuiz.findOne({
      where: { user_id: userId, quiz_id: quizId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          include: [
            {
              model: Question,
              as: 'questions',
              through: { attributes: ['question_order'] },
              attributes: ['id', 'question_text', 'question_type', 'marks', 'correct_explanation']
            }
          ]
        }
      ]
    });

    if (!userQuiz) {
      return res.status(404).json({ error: 'Quiz not assigned to user' });
    }

    const quiz = userQuiz.quiz!;
    const questions = (quiz as any).questions || [];

    res.json({ 
      quiz: {
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        time_limit: quiz.time_limit,
        cutoff: quiz.cutoff,
        max_questions: quiz.max_questions,
        max_marks: questions.reduce((sum: number, q: any) => sum + q.marks, 0)
      },
      questions: questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        correct_explanation: q.correct_explanation
      })),
      userQuizStatus: userQuiz.status
    });
  } catch (error) {
    next(error);
  }
});

// Start a quiz
router.post('/quizzes/:id/start', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Find user quiz assignment
    const userQuiz = await UserQuiz.findOne({
      where: { user_id: userId, quiz_id: quizId },
      include: [{ model: Quiz, as: 'quiz' }]
    });

    if (!userQuiz) {
      return res.status(404).json({ error: 'Quiz not assigned to user' });
    }

    if (userQuiz.status === 'completed') {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Check if user already has questions assigned
    let userQuizQuestions = await UserQuizQuestion.findAll({
      where: { user_quiz_id: userQuiz.id },
      include: [
        {
          model: Question,
          as: 'question',
          include: [
            {
              model: QuestionOption,
              as: 'options',
              attributes: ['id', 'option_text'] // Don't include is_correct for users
            }
          ]
        }
      ],
      order: [['question_order', 'ASC']]
    });

    // If no questions assigned yet, randomly select questions
    if (userQuizQuestions.length === 0) {
      // Get random questions from quiz pool
      const randomQuestions = await Question.findAll({
        include: [
          {
            model: Quiz,
            as: 'quizzes',
            where: { id: quizId },
            through: { attributes: [] }
          },
          {
            model: QuestionOption,
            as: 'options',
            attributes: ['id', 'option_text']
          }
        ],
        order: [['id', 'ASC']], // We'll randomize in JavaScript for SQLite compatibility
        limit: userQuiz.quiz!.max_questions
      });

      // Shuffle questions for randomization
      const shuffledQuestions = randomQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffledQuestions.slice(0, userQuiz.quiz!.max_questions);

      // Create user quiz questions
      const userQuizQuestionsData = selectedQuestions.map((question, index) => ({
        user_quiz_id: userQuiz.id,
        question_id: question.id,
        question_order: index + 1
      }));

      await UserQuizQuestion.bulkCreate(userQuizQuestionsData);

      // Fetch the created assignments with questions
      userQuizQuestions = await UserQuizQuestion.findAll({
        where: { user_quiz_id: userQuiz.id },
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              {
                model: QuestionOption,
                as: 'options',
                attributes: ['id', 'option_text']
              }
            ]
          }
        ],
        order: [['question_order', 'ASC']]
      });
    }

    // Update quiz status and start time
    await userQuiz.update({
      status: 'in_progress',
      start_time: new Date()
    });

    res.json({
      message: 'Quiz started successfully',
      userQuiz: {
        id: userQuiz.id,
        status: userQuiz.status,
        start_time: userQuiz.start_time,
        quiz: userQuiz.quiz
      },
      questions: userQuizQuestions.map(uqq => ({
        id: uqq.question!.id,
        question_text: uqq.question!.question_text,
        question_type: uqq.question!.question_type,
        marks: uqq.question!.marks,
        options: uqq.question!.options,
        order: uqq.question_order
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz questions (for ongoing quiz)
router.get('/quizzes/:id/questions', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user!.id;

    const userQuiz = await UserQuiz.findOne({
      where: { user_id: userId, quiz_id: quizId }
    });

    if (!userQuiz) {
      return res.status(404).json({ error: 'Quiz not assigned to user' });
    }

    const userQuizQuestions = await UserQuizQuestion.findAll({
      where: { user_quiz_id: userQuiz.id },
      include: [
        {
          model: Question,
          as: 'question',
          include: [
            {
              model: QuestionOption,
              as: 'options',
              attributes: ['id', 'option_text']
            }
          ]
        }
      ],
      order: [['question_order', 'ASC']]
    });

    res.json({
      questions: userQuizQuestions.map(uqq => ({
        id: uqq.question!.id,
        question_text: uqq.question!.question_text,
        question_type: uqq.question!.question_type,
        marks: uqq.question!.marks,
        options: uqq.question!.options,
        order: uqq.question_order
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Submit quiz
router.post('/quizzes/:id/submit', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { answers } = req.body;

    const userQuiz = await UserQuiz.findOne({
      where: { user_id: userId, quiz_id: quizId },
      include: [{ model: Quiz, as: 'quiz' }]
    });

    if (!userQuiz) {
      return res.status(404).json({ error: 'Quiz not assigned to user' });
    }

    if (userQuiz.status === 'completed') {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Process answers and calculate score
    let totalScore = 0;
    let totalMarks = 0;

    for (const answer of answers) {
      const question = await Question.findByPk(answer.questionId, {
        include: [{ model: QuestionOption, as: 'options' }]
      });

      if (!question) continue;

      const correctOptions = question.options!.filter((opt: any) => opt.is_correct);
      const selectedOptionIds = answer.selectedOptionIds || [];
      
      let isCorrect = false;
      let marksObtained = 0;

      // Check if answer is correct
      if (question.question_type === 'mcq' || question.question_type === 'true_false') {
        // Single correct answer
        isCorrect = selectedOptionIds.length === 1 && 
                   correctOptions.some((opt: any) => opt.id === selectedOptionIds[0]);
      } else if (question.question_type === 'multiple_select') {
        // Multiple correct answers
        const correctIds = correctOptions.map((opt: any) => opt.id).sort();
        const selectedIds = selectedOptionIds.sort();
        isCorrect = correctIds.length === selectedIds.length && 
                   correctIds.every((id: any, index: number) => id === selectedIds[index]);
      }

      if (isCorrect) {
        marksObtained = question.marks;
        totalScore += marksObtained;
      } else if (userQuiz.quiz!.negative_marking) {
        marksObtained = -0.25 * question.marks; // 25% negative marking
        totalScore += marksObtained;
      }

      totalMarks += question.marks;

      // Save user answer
      await UserAnswer.create({
        user_quiz_id: userQuiz.id,
        question_id: question.id,
        selected_option_ids: JSON.stringify(selectedOptionIds),
        is_correct: isCorrect,
        marks_obtained: marksObtained
      });
    }

    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    // Update user quiz with final score
    await userQuiz.update({
      status: 'completed',
      end_time: new Date(),
      score: totalScore,
      percentage: Math.round(percentage * 100) / 100
    });

    res.json({
      message: 'Quiz submitted successfully',
      score: totalScore,
      totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      passed: percentage >= userQuiz.quiz!.cutoff
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz result
router.get('/quizzes/:id/result', async (req: AuthRequest, res: Response, next) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = req.user!.id;

    const userQuiz = await UserQuiz.findOne({
      where: { user_id: userId, quiz_id: quizId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'name', 'description', 'cutoff', 'answer_release_time']
        },
        {
          model: UserAnswer,
          as: 'userAnswers',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                {
                  model: QuestionOption,
                  as: 'options'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!userQuiz) {
      return res.status(404).json({ error: 'Quiz result not found' });
    }

    if (userQuiz.status !== 'completed') {
      return res.status(400).json({ error: 'Quiz not completed yet' });
    }

    // Check if answers should be released
    const now = new Date();
    const showAnswers = !userQuiz.quiz!.answer_release_time || 
                       now >= userQuiz.quiz!.answer_release_time;

    res.json({
      result: {
        score: userQuiz.score,
        percentage: userQuiz.percentage,
        passed: userQuiz.percentage! >= userQuiz.quiz!.cutoff,
        start_time: userQuiz.start_time,
        end_time: userQuiz.end_time,
        quiz: userQuiz.quiz
      },
      answers: showAnswers ? userQuiz.userAnswers : null,
      message: showAnswers ? null : 'Detailed answers will be available after the release time'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
