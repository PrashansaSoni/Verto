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
  IconButton,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  People,
  Analytics,
  Add,
  Visibility,
  Edit,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: quizzesData, isLoading: quizzesLoading } = useQuery(
    'admin-quizzes',
    () => quizService.getAdminQuizzes(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: usersData, isLoading: usersLoading } = useQuery(
    'admin-users',
    () => quizService.getUsers(1, 5),
    { staleTime: 5 * 60 * 1000 }
  );

  const quizzes = quizzesData?.quizzes || [];
  const users = usersData?.users || [];

  const stats = [
    {
      title: 'Total Quizzes',
      value: quizzes.length,
      icon: <QuizIcon />,
      color: 'primary',
      action: () => navigate('/admin/quizzes'),
    },
    {
      title: 'Total Users',
      value: users.length,
      icon: <People />,
      color: 'secondary',
      action: () => navigate('/admin/users'),
    },
    {
      title: 'Active Quizzes',
      value: quizzes.filter(q => q.max_questions > 0).length,
      icon: <Analytics />,
      color: 'success',
      action: () => navigate('/admin/results'),
    },
  ];

  if (quizzesLoading || usersLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                color: '#0f172a',
                mb: 1,
              }}
            >
              Welcome back! 👋
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: '1rem' }}
            >
              Here's what's happening with your quizzes today.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/admin/quizzes/create')}
            sx={{
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              },
            }}
          >
            Create Quiz
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={5}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: stat.color === 'primary' 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : stat.color === 'secondary'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  },
                }}
                onClick={stat.action}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ 
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography 
                        variant="h3" 
                        component="div"
                        sx={{ 
                          fontWeight: 700,
                          color: '#0f172a',
                          mb: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Click to view details
                      </Typography>
                    </Box>
                    <Box 
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: stat.color === 'primary' 
                          ? 'rgba(99, 102, 241, 0.1)'
                          : stat.color === 'secondary'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(16, 185, 129, 0.1)',
                        color: stat.color === 'primary' 
                          ? '#6366f1'
                          : stat.color === 'secondary'
                          ? '#f59e0b'
                          : '#10b981',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Quizzes */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Quizzes</Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/quizzes')}
                >
                  View All
                </Button>
              </Box>
              {quizzes.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    No quizzes created yet. Create your first quiz to get started!
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/admin/quizzes/create')}
                  >
                    Create Quiz
                  </Button>
                </Box>
              ) : (
                <List>
                  {quizzes.slice(0, 5).map((quiz) => (
                    <ListItem
                      key={quiz.id}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                          >
                            <Edit />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={quiz.name}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <Chip
                              label={`${quiz.max_questions} questions`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${quiz.cutoff}% cutoff`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {quiz.time_limit && (
                              <Chip
                                label={`${quiz.time_limit} min`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Recent Users */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Users</Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/users')}
                >
                  View All
                </Button>
              </Box>
              {users.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  No users registered yet.
                </Typography>
              ) : (
                <List dense>
                  {users.map((user) => (
                    <ListItem key={user.id}>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                            <Chip
                              label={user.role}
                              size="small"
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default AdminDashboard;
