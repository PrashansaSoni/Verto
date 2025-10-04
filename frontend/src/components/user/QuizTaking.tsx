import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  FormGroup,
  LinearProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Send,
  Timer,
  Warning,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTimer } from '@/hooks/useTimer';
import quizService from '@/services/quizService';
import { Question } from '@/types/quiz';

const QuizTaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = parseInt(id!);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  // Start quiz mutation
  const startQuizMutation = useMutation(
    () => quizService.startQuiz(quizId),
    {
      onSuccess: (data) => {
        console.log('Quiz start data:', data);
        console.log('Quiz time_limit:', data.userQuiz.quiz?.time_limit);
        setQuestions(data.questions);
        setQuizStarted(true);
        if (data.userQuiz.quiz?.time_limit) {
          const timeLimitInSeconds = data.userQuiz.quiz.time_limit * 60;
          console.log('Setting time limit to:', timeLimitInSeconds, 'seconds');
          setTimeLimit(timeLimitInSeconds); // Convert to seconds
        }
      },
      onError: (error: any) => {
        console.error('Failed to start quiz:', error);
      },
    }
  );

  // Submit quiz mutation
  const submitQuizMutation = useMutation(
    (answersData: { questionId: number; selectedOptionIds: number[] }[]) =>
      quizService.submitQuiz(quizId, answersData),
    {
      onSuccess: () => {
        navigate(`/user/results/${quizId}`);
      },
      onError: (error: any) => {
        console.error('Failed to submit quiz:', error);
      },
    }
  );

  // Timer hook
  const { timeRemaining, isActive, formatTime, start: startTimer } = useTimer({
    initialTime: timeLimit || 0,
    onTimeUp: handleTimeUp,
    autoStart: false,
  });

  function handleTimeUp() {
    handleSubmitQuiz();
  }

  useEffect(() => {
    if (quizStarted && timeLimit) {
      startTimer();
    }
  }, [quizStarted, timeLimit, startTimer]);

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleAnswerChange = (questionId: number, optionId: number, isMultiple: boolean) => {
    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(optionId)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, optionId]
          };
        }
      } else {
        return {
          ...prev,
          [questionId]: [optionId]
        };
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const answersData = Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
      questionId: parseInt(questionId),
      selectedOptionIds,
    }));

    submitQuizMutation.mutate(answersData);
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return currentQuestion && answers[currentQuestion.id];
  };

  if (!quizStarted) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Ready to Start Quiz?
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Click the button below to begin your quiz. Make sure you have a stable internet connection.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartQuiz}
                disabled={startQuizMutation.isLoading}
                sx={{ mt: 2 }}
              >
                {startQuizMutation.isLoading ? 'Starting Quiz...' : 'Start Quiz'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quiz questions..." />
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Layout>
      <Box>
        {/* Header with Timer and Progress */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Answered: {getAnsweredQuestionsCount()} / {questions.length}
              </Typography>
            </Box>
            {timeLimit && (
              <Box display="flex" alignItems="center" gap={1}>
                <Timer color={timeRemaining < 300 ? 'error' : 'primary'} />
                <Typography
                  variant="h6"
                  color={timeRemaining < 300 ? 'error' : 'primary'}
                >
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1, height: 8, borderRadius: 4 }}
          />
        </Paper>

        {/* Question Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Chip
                label={`${currentQuestion.marks} ${currentQuestion.marks === 1 ? 'mark' : 'marks'}`}
                color="primary"
                size="small"
              />
              <Chip
                label={currentQuestion.question_type.replace('_', ' ').toUpperCase()}
                variant="outlined"
                size="small"
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              {currentQuestion.question_text}
            </Typography>

            <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
              {currentQuestion.question_type === 'multiple_select' ? (
                <FormGroup>
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={(answers[currentQuestion.id] || []).includes(option.id)}
                          onChange={() =>
                            handleAnswerChange(currentQuestion.id, option.id, true)
                          }
                        />
                      }
                      label={option.option_text}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </FormGroup>
              ) : (
                <RadioGroup
                  value={(answers[currentQuestion.id] || [])[0] || ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, parseInt(e.target.value), false)
                  }
                >
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={option.option_text}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              )}
            </FormControl>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box display="flex" gap={2}>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<Send />}
                onClick={() => setShowSubmitDialog(true)}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<NavigateNext />}
                onClick={handleNextQuestion}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
          <DialogTitle>Submit Quiz</DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Warning color="warning" />
              <Typography>
                Are you sure you want to submit your quiz?
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              You have answered {getAnsweredQuestionsCount()} out of {questions.length} questions.
              Once submitted, you cannot make any changes.
            </Typography>
            {getAnsweredQuestionsCount() < questions.length && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You have {questions.length - getAnsweredQuestionsCount()} unanswered questions.
                These will be marked as incorrect.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuiz}
              variant="contained"
              color="success"
              disabled={submitQuizMutation.isLoading}
            >
              {submitQuizMutation.isLoading ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default QuizTaking;
