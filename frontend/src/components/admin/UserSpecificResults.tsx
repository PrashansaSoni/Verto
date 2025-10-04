import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Grid,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Visibility,
  Person,
  ExpandMore,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const UserSpecificResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: resultsData, isLoading: resultsLoading, error: resultsError } = useQuery(
    ['user-results', id],
    () => quizService.getUserResults(parseInt(id!)),
    { enabled: !!id }
  );

  const { data: usersData, isLoading: usersLoading } = useQuery(
    'admin-users',
    () => quizService.getUsers(1, 1000), // Get all users to find the specific user
    { staleTime: 5 * 60 * 1000 }
  );

  if (resultsLoading || usersLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading user results..." />
      </Layout>
    );
  }

  if (resultsError) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load user results. Please try again.
        </Alert>
      </Layout>
    );
  }

  const results = resultsData?.results || [];
  const users = usersData?.users || [];
  const user = users.find(u => u.id === parseInt(id!));

  // Debug logging
  console.log('User results data:', {
    resultsData,
    results,
    firstResult: results[0],
    userAnswers: results[0]?.userAnswers
  });

  if (!user) {
    return (
      <Layout>
        <Alert severity="warning">
          User not found.
        </Alert>
      </Layout>
    );
  }

  // Calculate statistics
  const totalAttempts = results.length;
  const completedAttempts = results.filter(r => r.status === 'completed').length;
  const passedAttempts = results.filter(r => r.status === 'completed' && r.quiz && r.score >= r.quiz.cutoff).length;
  const averageScore = completedAttempts > 0 
    ? Math.round(results.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.score || 0), 0) / completedAttempts)
    : 0;

  return (
    <Layout>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/admin/users')}>
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              {user.name}'s Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        {/* User Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Attempts
                </Typography>
                <Typography variant="h4" component="div">
                  {totalAttempts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" component="div">
                  {completedAttempts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pass Rate
                </Typography>
                <Typography variant="h4" component="div">
                  {completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 100) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4" component="div">
                  {averageScore}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quiz Attempts with Detailed Answers */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quiz Attempts & Detailed Answers
            </Typography>
            
            {results.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No quiz attempts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This user hasn't attempted any quizzes yet.
                </Typography>
              </Box>
            ) : (
              <Box>
                {results.map((result) => {
                  const timeTaken = result.end_time && result.start_time
                    ? Math.round((new Date(result.end_time).getTime() - new Date(result.start_time).getTime()) / (1000 * 60))
                    : null;
                  
                  const passed = result.status === 'completed' && result.quiz && (result.score || 0) >= result.quiz.cutoff;

                  return (
                    <Accordion key={result.id} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Box>
                            <Typography variant="h6">
                              {result.quiz?.name || 'Unknown Quiz'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {result.quiz?.description || 'No description'}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                                size="small"
                                color={result.status === 'completed' ? 'success' : result.status === 'in_progress' ? 'warning' : 'default'}
                              />
                              {result.status === 'completed' && (
                                <Chip
                                  label={`Score: ${result.score || 0}%`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                              {result.status === 'completed' && result.quiz && (
                                <Chip
                                  label={passed ? 'PASS' : 'FAIL'}
                                  size="small"
                                  color={passed ? 'success' : 'error'}
                                  icon={passed ? <CheckCircle /> : <Cancel />}
                                />
                              )}
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            {result.start_time && (
                              <Typography variant="body2" color="text.secondary">
                                Started: {new Date(result.start_time).toLocaleString()}
                              </Typography>
                            )}
                            {result.end_time && (
                              <Typography variant="body2" color="text.secondary">
                                Completed: {new Date(result.end_time).toLocaleString()}
                              </Typography>
                            )}
                            {timeTaken && (
                              <Typography variant="body2" color="text.secondary">
                                Time: {timeTaken} minutes
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {/* Debug information */}
                          <Box mb={2} p={1} bgcolor="grey.100" borderRadius={1}>
                            <Typography variant="caption" color="text.secondary">
                              Debug Info: Status={result.status}, UserAnswers={result.userAnswers?.length || 0}, 
                              QuizId={result.quiz_id}, ResultId={result.id}
                            </Typography>
                          </Box>
                          {result.status === 'completed' ? (
                            result.userAnswers && result.userAnswers.length > 0 ? (
                            <Box>
                              <Typography variant="subtitle1" gutterBottom>
                                Question-by-Question Analysis
                              </Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              {result.userAnswers.map((answer, index) => {
                                const selectedOptionIds = JSON.parse(answer.selected_option_ids || '[]');
                                const question = answer.question;
                                
                                return (
                                  <Card key={answer.id} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                      <Box display="flex" alignItems="flex-start" gap={2}>
                                        <Typography variant="h6" color="primary">
                                          Q{index + 1}
                                        </Typography>
                                        <Box flex={1}>
                                          <Typography variant="subtitle1" gutterBottom>
                                            {question?.question_text}
                                          </Typography>
                                          
                                          <Box display="flex" gap={1} mb={2}>
                                            <Chip
                                              label={`${question?.marks} marks`}
                                              size="small"
                                              variant="outlined"
                                            />
                                            <Chip
                                              label={answer.is_correct ? 'Correct' : 'Incorrect'}
                                              size="small"
                                              color={answer.is_correct ? 'success' : 'error'}
                                              icon={answer.is_correct ? <CheckCircle /> : <Cancel />}
                                            />
                                            <Chip
                                              label={`${answer.marks_obtained} marks`}
                                              size="small"
                                              color={answer.marks_obtained > 0 ? 'success' : 'error'}
                                            />
                                          </Box>

                                          <Typography variant="subtitle2" gutterBottom>
                                            Options:
                                          </Typography>
                                          <List dense>
                                            {question?.options?.map((option) => {
                                              const isSelected = selectedOptionIds.includes(option.id);
                                              const isCorrect = option.is_correct;
                                              
                                              return (
                                                <ListItem 
                                                  key={option.id}
                                                  sx={{
                                                    bgcolor: isSelected 
                                                      ? (isCorrect ? 'success.light' : 'error.light')
                                                      : (isCorrect ? 'warning.light' : 'transparent'),
                                                    borderRadius: 1,
                                                    mb: 0.5,
                                                    border: isSelected ? 2 : 1,
                                                    borderColor: isSelected 
                                                      ? (isCorrect ? 'success.main' : 'error.main')
                                                      : 'divider'
                                                  }}
                                                >
                                                  <ListItemText
                                                    primary={
                                                      <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography
                                                          sx={{
                                                            fontWeight: isSelected ? 'bold' : 'normal',
                                                            color: isSelected 
                                                              ? (isCorrect ? 'success.dark' : 'error.dark')
                                                              : 'text.primary'
                                                          }}
                                                        >
                                                          {option.option_text}
                                                        </Typography>
                                                        {isSelected && (
                                                          <Chip
                                                            label="Selected"
                                                            size="small"
                                                            color={isCorrect ? 'success' : 'error'}
                                                          />
                                                        )}
                                                        {isCorrect && !isSelected && (
                                                          <Chip
                                                            label="Correct Answer"
                                                            size="small"
                                                            color="warning"
                                                          />
                                                        )}
                                                      </Box>
                                                    }
                                                  />
                                                </ListItem>
                                              );
                                            })}
                                          </List>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>
                            ) : (
                              <Box textAlign="center" py={2}>
                                <Alert severity="warning">
                                  <Typography variant="body2">
                                    Quiz completed but no detailed answers found.
                                  </Typography>
                                  <Typography variant="caption" display="block" mt={1}>
                                    This might happen if:
                                    • The quiz was completed before the detailed tracking was implemented
                                    • There was an issue during quiz submission
                                    • The answers were not properly saved
                                  </Typography>
                                </Alert>
                              </Box>
                            )
                          ) : (
                            <Box textAlign="center" py={2}>
                              <Alert severity="info">
                                <Typography variant="body2">
                                  Quiz status: {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                                </Typography>
                                <Typography variant="caption" display="block" mt={1}>
                                  Detailed answers are only available for completed quizzes.
                                </Typography>
                              </Alert>
                            </Box>
                          )}
                          
                          <Box display="flex" justifyContent="flex-end" mt={2}>
                            {result.quiz_id && (
                              <Button
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => navigate(`/admin/quizzes/${result.quiz_id}/results`)}
                              >
                                View All Quiz Results
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default UserSpecificResults;
