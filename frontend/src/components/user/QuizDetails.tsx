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
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  ArrowBack,
  Timer,
  Assignment,
  TrendingUp,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';

const UserQuizDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(
    ['user-quiz-details', id],
    () => quizService.getUserQuizDetails(parseInt(id!)),
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quiz details..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quiz details. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quiz = data?.quiz;
  const questions = data?.questions || [];
  const userQuizStatus = data?.userQuizStatus;

  if (!quiz) {
    return (
      <Layout>
        <Alert severity="warning">
          Quiz not found.
        </Alert>
      </Layout>
    );
  }

  const handleStartQuiz = () => {
    navigate(`/user/quiz/${id}`);
  };

  const handleViewResults = () => {
    navigate(`/user/results/${id}`);
  };

  const getActionButton = () => {
    switch (userQuizStatus) {
      case 'completed':
        return (
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircle />}
            onClick={handleViewResults}
            sx={{
              backgroundColor: 'success.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'success.dark',
              },
            }}
          >
            View Results
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartQuiz}
            sx={{
              backgroundColor: 'warning.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'warning.dark',
              },
            }}
          >
            Continue Quiz
          </Button>
        );
      default: // 'assigned'
        return (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartQuiz}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            Start Quiz
          </Button>
        );
    }
  };

  const handleBackToDashboard = () => {
    navigate('/user');
  };

  return (
    <Layout>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Box>

        {/* Quiz Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              {quiz.name}
            </Typography>
            {quiz.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {quiz.description}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Quiz Information */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Quiz Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Questions"
                      secondary={`${questions.length} questions`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Timer color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Time Limit"
                      secondary={quiz.time_limit ? `${quiz.time_limit} minutes` : 'No time limit'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Passing Score"
                      secondary={`${quiz.cutoff}% or higher`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Marks"
                      secondary={`${questions.reduce((sum, q) => sum + q.marks, 0)} marks`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} color="warning" />
                  Instructions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem>
                    <Typography variant="body2">
                      • Read each question carefully before selecting your answer
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      • You can navigate between questions using the Next/Previous buttons
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      • Make sure to submit your quiz before the time limit expires
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      • Once submitted, you cannot modify your answers
                    </Typography>
                  </ListItem>
                  {quiz.time_limit && (
                    <ListItem>
                      <Typography variant="body2" color="warning.main">
                        • The quiz will auto-submit when time runs out
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Quiz Stats & Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Questions
                    </Typography>
                    <Chip label={questions.length} color="primary" size="small" />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Time Limit
                    </Typography>
                    <Chip 
                      label={quiz.time_limit ? `${quiz.time_limit}m` : 'No limit'} 
                      color="secondary" 
                      size="small" 
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Pass Mark
                    </Typography>
                    <Chip label={`${quiz.cutoff}%`} color="success" size="small" />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Total Marks
                    </Typography>
                    <Chip 
                      label={questions.reduce((sum, q) => sum + q.marks, 0)} 
                      color="info" 
                      size="small" 
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              backgroundColor: userQuizStatus === 'completed' ? 'success.light' : 
                             userQuizStatus === 'in_progress' ? 'warning.light' : 'primary.light' 
            }}>
              <Typography variant="h6" gutterBottom color="primary.contrastText">
                {userQuizStatus === 'completed' ? 'Quiz Completed!' :
                 userQuizStatus === 'in_progress' ? 'Continue Your Quiz' : 'Ready to Start?'}
              </Typography>
              <Typography variant="body2" paragraph color="primary.contrastText">
                {userQuizStatus === 'completed' ? 'View your results and performance.' :
                 userQuizStatus === 'in_progress' ? 'You have an ongoing quiz session.' :
                 'Make sure you have enough time to complete the quiz.'}
              </Typography>
              {getActionButton()}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default UserQuizDetails;
