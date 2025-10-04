import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Grid,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Email,
  Phone,
  CalendarToday,
  Assignment,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { User } from '@/types/auth';
import apiService from '@/services/api';

interface UserDetailsData {
  user: User;
  stats: {
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    totalTimeSpent: number;
  };
  recentQuizzes: Array<{
    id: number;
    quiz_name: string;
    status: string;
    score?: number;
    completed_at?: string;
  }>;
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<UserDetailsData>(
    ['admin-user-details', id],
    async (): Promise<UserDetailsData> => {
      const response = await apiService.get(`/admin/users/${id}/details`);
      return response as UserDetailsData;
    },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading user details..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load user details. Please try again.
        </Alert>
      </Layout>
    );
  }

  if (!data?.user) {
    return (
      <Layout>
        <Alert severity="warning">
          User not found.
        </Alert>
      </Layout>
    );
  }

  const { user, stats, recentQuizzes } = data;

  const handleViewAllResults = () => {
    navigate(`/admin/users/${id}/results`);
  };

  const handleBackToUsers = () => {
    navigate('/admin/users');
  };

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={handleBackToUsers}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            User Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* User Information Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {user.name || 'No Name Provided'}
                  </Typography>
                  <Chip
                    label={user.role}
                    size="medium"
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    variant={user.role === 'admin' ? 'filled' : 'outlined'}
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <List dense>
                  <ListItem>
                    <Email sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary="Email"
                      secondary={user.email}
                    />
                  </ListItem>
                  <ListItem>
                    <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary="Phone"
                      secondary={user.phone || 'Not provided'}
                    />
                  </ListItem>
                  <ListItem>
                    <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary="Joined"
                      secondary={
                        user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quiz Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {stats.totalQuizzes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Quizzes
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {stats.completedQuizzes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" color="warning.main">
                        {stats.averageScore.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Score
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <CalendarToday sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        {Math.round(stats.totalTimeSpent / 60)}m
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Spent
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Quizzes */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Recent Quiz Activity
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={handleViewAllResults}
                    size="small"
                  >
                    View All Results
                  </Button>
                </Box>

                {recentQuizzes.length > 0 ? (
                  <List>
                    {recentQuizzes.map((quiz: any, index: number) => (
                      <React.Fragment key={quiz.id}>
                        <ListItem>
                          <ListItemText
                            primary={quiz.quiz_name}
                            secondary={
                              <Box>
                                <Typography variant="body2" component="span">
                                  Status: {quiz.status}
                                  {quiz.score !== undefined && ` • Score: ${quiz.score}%`}
                                </Typography>
                                {quiz.completed_at && (
                                  <Typography variant="caption" display="block">
                                    Completed: {new Date(quiz.completed_at).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Chip
                            label={quiz.status}
                            size="small"
                            color={
                              quiz.status === 'completed' ? 'success' :
                              quiz.status === 'in_progress' ? 'warning' : 'default'
                            }
                            variant="outlined"
                          />
                        </ListItem>
                        {index < recentQuizzes.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No quiz activity found for this user.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default UserDetails;
