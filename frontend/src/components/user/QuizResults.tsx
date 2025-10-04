import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  Home,
  Refresh,
  TrendingUp,
  Timer,
  Assignment,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const QuizResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = parseInt(id!);

  const { data, isLoading, error } = useQuery(
    ['quiz-result', quizId],
    () => quizService.getQuizResult(quizId),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your results..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quiz results. Please try again.
        </Alert>
      </Layout>
    );
  }

  const result = data?.result;
  const answers = data?.answers;
  const message = data?.message;

  if (!result) {
    return (
      <Layout>
        <Alert severity="warning">
          No results found for this quiz.
        </Alert>
      </Layout>
    );
  }

  const isPassed = result.passed;
  const percentage = result.percentage || 0;
  const score = result.score || 0;

  const getTimeTaken = () => {
    if (result.start_time && result.end_time) {
      const start = new Date(result.start_time);
      const end = new Date(result.end_time);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      return `${diffMins}m ${diffSecs}s`;
    }
    return 'Unknown';
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Quiz Results
        </Typography>

        {/* Result Summary Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box textAlign="center">
                  <Typography variant="h2" component="div" color={isPassed ? 'success.main' : 'error.main'}>
                    {Math.round(percentage)}%
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Final Score
                  </Typography>
                  <Chip
                    label={isPassed ? 'PASSED' : 'FAILED'}
                    color={isPassed ? 'success' : 'error'}
                    size="large"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {result.quiz?.name}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Assignment />
                      <Typography>
                        Score: {score} / {result.quiz?.max_marks || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp />
                      <Typography>
                        Required: {result.quiz?.cutoff}% to pass
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timer />
                      <Typography>
                        Time taken: {getTimeTaken()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box mt={3}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={isPassed ? 'success' : 'error'}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {percentage >= 90 ? '🏆' : percentage >= 70 ? '👍' : percentage >= 50 ? '👌' : '📚'}
                  </Typography>
                  <Typography variant="subtitle2">
                    {percentage >= 90 ? 'Excellent!' : 
                     percentage >= 70 ? 'Good Job!' : 
                     percentage >= 50 ? 'Not Bad!' : 'Keep Learning!'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {Math.round(percentage)}%
                  </Typography>
                  <Typography variant="subtitle2">
                    Accuracy
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {getTimeTaken()}
                  </Typography>
                  <Typography variant="subtitle2">
                    Time Taken
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Detailed Answers */}
        {answers ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Review
              </Typography>
              {answers.map((answer: any, index: number) => (
                <Accordion key={answer.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      {answer.is_correct ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Cancel color="error" />
                      )}
                      <Typography sx={{ flexGrow: 1 }}>
                        Question {index + 1}
                      </Typography>
                      <Chip
                        label={`${answer.marks_obtained} marks`}
                        size="small"
                        color={answer.is_correct ? 'success' : 'error'}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {answer.question?.question_text}
                      </Typography>
                      
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Options:
                      </Typography>
                      <List dense>
                        {answer.question?.options?.map((option: any) => {
                          const isSelected = JSON.parse(answer.selected_option_ids || '[]').includes(option.id);
                          const isCorrect = option.is_correct;
                          
                          return (
                            <ListItem key={option.id}>
                              <ListItemIcon>
                                {isCorrect ? (
                                  <CheckCircle color="success" />
                                ) : isSelected ? (
                                  <Cancel color="error" />
                                ) : null}
                              </ListItemIcon>
                              <ListItemText
                                primary={option.option_text}
                                sx={{
                                  color: isCorrect ? 'success.main' : 
                                         isSelected && !isCorrect ? 'error.main' : 
                                         'text.primary'
                                }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>

                      {answer.question?.correct_explanation && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="info.dark">
                            Explanation:
                          </Typography>
                          <Typography variant="body2" color="info.dark">
                            {answer.question.correct_explanation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ) : message && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/user')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh Results
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default QuizResults;
