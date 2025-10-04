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
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const QuizSpecificResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quizData, isLoading: quizLoading, error: quizError } = useQuery(
    ['quiz-details', id],
    () => quizService.getQuizDetails(parseInt(id!)),
    { enabled: !!id }
  );

  const { data: resultsData, isLoading: resultsLoading, error: resultsError } = useQuery(
    ['quiz-results', id],
    () => quizService.getQuizResults(parseInt(id!)),
    { enabled: !!id }
  );

  if (quizLoading || resultsLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quiz results..." />
      </Layout>
    );
  }

  if (quizError || resultsError) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quiz results. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quiz = quizData?.quiz;
  const results = resultsData?.results || [];

  if (!quiz) {
    return (
      <Layout>
        <Alert severity="warning">
          Quiz not found.
        </Alert>
      </Layout>
    );
  }

  // Calculate statistics
  const totalAttempts = results.length;
  const completedAttempts = results.filter(r => r.status === 'completed').length;
  const passedAttempts = results.filter(r => r.status === 'completed' && r.score >= quiz.cutoff).length;
  const averageScore = completedAttempts > 0 
    ? Math.round(results.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.score || 0), 0) / completedAttempts)
    : 0;

  return (
    <Layout>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/admin/quizzes')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Results: {quiz.name}
          </Typography>
        </Box>

        {/* Statistics Cards */}
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

        {/* Results Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Individual Results
            </Typography>
            
            {results.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No attempts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This quiz hasn't been attempted by any users yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Started At</TableCell>
                      <TableCell>Completed At</TableCell>
                      <TableCell>Time Taken</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => {
                      const timeTaken = result.end_time && result.start_time
                        ? Math.round((new Date(result.end_time).getTime() - new Date(result.start_time).getTime()) / (1000 * 60))
                        : null;
                      
                      const passed = result.status === 'completed' && (result.score || 0) >= quiz.cutoff;

                      return (
                        <TableRow key={result.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {result.user?.name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {result.user?.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                              size="small"
                              color={result.status === 'completed' ? 'success' : result.status === 'in_progress' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {result.status === 'completed' ? `${result.score || 0}%` : '-'}
                          </TableCell>
                          <TableCell>
                            {result.status === 'completed' ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                {passed ? (
                                  <>
                                    <CheckCircle color="success" fontSize="small" />
                                    <Typography variant="body2" color="success.main">
                                      Pass
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Cancel color="error" fontSize="small" />
                                    <Typography variant="body2" color="error.main">
                                      Fail
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {result.start_time ? new Date(result.start_time).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {result.end_time ? new Date(result.end_time).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {timeTaken ? `${timeTaken} min` : '-'}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/users/${result.user_id}/results`)}
                              title="View User Results"
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default QuizSpecificResults;
