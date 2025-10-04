import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';
import { UserQuiz } from '@/types/quiz';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(
    'user-assigned-quizzes',
    () => quizService.getAssignedQuizzes(),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load your quizzes. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quizzes = data?.quizzes || [];
  
  const assignedQuizzes = quizzes.filter(q => q.status === 'assigned');
  const inProgressQuizzes = quizzes.filter(q => q.status === 'in_progress');
  const completedQuizzes = quizzes.filter(q => q.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Assignment />;
      case 'in_progress': return <Schedule />;
      case 'completed': return <CheckCircle />;
      default: return <Assignment />;
    }
  };

  const handleViewQuizDetails = (quiz: UserQuiz) => {
    navigate(`/user/quiz/${quiz.quiz_id}/details`);
  };

  const handleViewResult = (quiz: UserQuiz) => {
    navigate(`/user/results/${quiz.quiz_id}`);
  };

  const stats = [
    {
      title: 'Assigned Quizzes',
      value: assignedQuizzes.length,
      icon: <Assignment />,
      color: 'primary',
    },
    {
      title: 'In Progress',
      value: inProgressQuizzes.length,
      icon: <Schedule />,
      color: 'warning',
    },
    {
      title: 'Completed',
      value: completedQuizzes.length,
      icon: <CheckCircle />,
      color: 'success',
    },
    {
      title: 'Average Score',
      value: completedQuizzes.length > 0 
        ? `${Math.round(completedQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / completedQuizzes.length)}%`
        : '0%',
      icon: <TrendingUp />,
      color: 'info',
    },
  ];

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box color={`${stat.color}.main`}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {assignedQuizzes.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => navigate('/user/my-quizzes')}
                    fullWidth
                    size="large"
                  >
                    Start New Quiz ({assignedQuizzes.length} available)
                  </Button>
                )}
                {inProgressQuizzes.length > 0 && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Schedule />}
                    onClick={() => navigate(`/user/quiz/${inProgressQuizzes[0].quiz_id}`)}
                    fullWidth
                    size="large"
                  >
                    Continue Quiz ({inProgressQuizzes.length} in progress)
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => navigate('/user/my-quizzes')}
                  fullWidth
                  size="large"
                >
                  View All My Quizzes
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {completedQuizzes.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No completed quizzes yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start your first quiz to see results here
                  </Typography>
                </Box>
              ) : (
                <List>
                  {completedQuizzes.slice(0, 3).map((userQuiz) => (
                    <ListItem
                      key={userQuiz.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => handleViewResult(userQuiz)}
                    >
                      <ListItemText
                        primary={userQuiz.quiz?.name}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip
                              label={`${userQuiz.percentage}%`}
                              size="small"
                              color={
                                (userQuiz.percentage || 0) >= (userQuiz.quiz?.cutoff || 0)
                                  ? 'success'
                                  : 'error'
                              }
                            />
                            <Typography variant="caption" color="text.secondary">
                              {userQuiz.end_time ? new Date(userQuiz.end_time).toLocaleDateString() : 'Recently completed'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {completedQuizzes.length > 3 && (
                    <Box textAlign="center" mt={2}>
                      <Button
                        variant="text"
                        onClick={() => navigate('/user/my-quizzes')}
                        size="small"
                      >
                        View All Results
                      </Button>
                    </Box>
                  )}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Urgent: In Progress Quizzes */}
          {inProgressQuizzes.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, backgroundColor: 'warning.light', border: 1, borderColor: 'warning.main' }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Schedule color="warning" />
                  <Typography variant="h6" color="warning.dark">
                    Attention: Quiz in Progress
                  </Typography>
                </Box>
                <Typography variant="body2" color="warning.dark" mb={2}>
                  You have {inProgressQuizzes.length} quiz(s) that you started but haven't completed yet.
                </Typography>
                <List>
                  {inProgressQuizzes.map((userQuiz) => (
                    <ListItem
                      key={userQuiz.id}
                      sx={{
                        border: 1,
                        borderColor: 'warning.main',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: 'background.paper',
                      }}
                    >
                      <ListItemText
                        primary={userQuiz.quiz?.name}
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Started: {userQuiz.start_time ? new Date(userQuiz.start_time).toLocaleString() : 'Unknown'}
                          </Typography>
                        }
                      />
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/user/quiz/${userQuiz.quiz_id}`)}
                        size="small"
                      >
                        Continue Now
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  );
};

export default UserDashboard;
