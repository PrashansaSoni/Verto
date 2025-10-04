import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const ResultsAnalytics: React.FC = () => {
  const { data: quizzesData, isLoading } = useQuery(
    'admin-quizzes',
    () => quizService.getAdminQuizzes(),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading analytics..." />
      </Layout>
    );
  }

  const quizzes = quizzesData?.quizzes || [];

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Results & Analytics
        </Typography>

        {quizzes.length === 0 ? (
          <Alert severity="info">
            No quizzes available for analytics. Create some quizzes first.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Overview Cards */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Quizzes
                  </Typography>
                  <Typography variant="h4" component="div">
                    {quizzes.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Quizzes
                  </Typography>
                  <Typography variant="h4" component="div">
                    {quizzes.filter(q => q.max_questions > 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Average Cutoff
                  </Typography>
                  <Typography variant="h4" component="div">
                    {quizzes.length > 0
                      ? Math.round(quizzes.reduce((sum, q) => sum + q.cutoff, 0) / quizzes.length)
                      : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quiz List */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Quiz Overview
                </Typography>
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">{quiz.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {quiz.description || 'No description'}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2">
                            Max Questions: {quiz.max_questions}
                          </Typography>
                          <Typography variant="body2">
                            Cutoff: {quiz.cutoff}%
                          </Typography>
                          <Typography variant="body2">
                            Time Limit: {quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Layout>
  );
};

export default ResultsAnalytics;
