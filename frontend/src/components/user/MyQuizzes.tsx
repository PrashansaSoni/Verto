import React, { useState } from 'react';
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
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Assignment,
  CheckCircle,
  Schedule,
  Search,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';
import { UserQuiz } from '@/types/quiz';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quiz-tabpanel-${index}`}
      aria-labelledby={`quiz-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MyQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery(
    'user-assigned-quizzes',
    () => quizService.getAssignedQuizzes(),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your quizzes..." />
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
  const expiredQuizzes = quizzes.filter(q => q.status === 'expired');

  const filterQuizzes = (quizList: UserQuiz[]) => {
    if (!searchTerm) return quizList;
    return quizList.filter(quiz =>
      quiz.quiz?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.quiz?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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

  const handleStartQuiz = (quiz: UserQuiz) => {
    navigate(`/user/quiz/${quiz.quiz_id}`);
  };

  const handleViewResult = (quiz: UserQuiz) => {
    navigate(`/user/results/${quiz.quiz_id}`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderQuizCard = (userQuiz: UserQuiz, showActions: boolean = true) => (
    <Card key={userQuiz.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom>
              {userQuiz.quiz?.name}
            </Typography>
            {userQuiz.quiz?.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {userQuiz.quiz.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={userQuiz.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(userQuiz.status)}
            icon={getStatusIcon(userQuiz.status)}
            size="small"
          />
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip
            label={`${userQuiz.quiz?.max_questions} questions`}
            size="small"
            variant="outlined"
          />
          {userQuiz.quiz?.time_limit && (
            <Chip
              label={`${userQuiz.quiz.time_limit} min`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          <Chip
            label={`${userQuiz.quiz?.cutoff}% to pass`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {userQuiz.quiz?.negative_marking && (
            <Chip
              label="Negative marking"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {userQuiz.status === 'completed' && (
          <Box mb={2}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2">
                Score: {userQuiz.score}/{userQuiz.quiz?.max_marks}
              </Typography>
              <Chip
                label={`${userQuiz.percentage}%`}
                size="small"
                color={
                  (userQuiz.percentage || 0) >= (userQuiz.quiz?.cutoff || 0)
                    ? 'success'
                    : 'error'
                }
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={userQuiz.percentage || 0}
              color={
                (userQuiz.percentage || 0) >= (userQuiz.quiz?.cutoff || 0)
                  ? 'success'
                  : 'error'
              }
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {userQuiz.status === 'in_progress' && userQuiz.start_time && (
          <Typography variant="body2" color="warning.main" mb={2}>
            Started: {new Date(userQuiz.start_time).toLocaleString()}
          </Typography>
        )}

        {showActions && (
          <Box display="flex" gap={1} flexWrap="wrap">
            {userQuiz.status === 'assigned' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => handleViewQuizDetails(userQuiz)}
                  size="small"
                >
                  View Details
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleStartQuiz(userQuiz)}
                  size="small"
                >
                  Start Quiz
                </Button>
              </>
            )}
            {userQuiz.status === 'in_progress' && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<PlayArrow />}
                onClick={() => handleStartQuiz(userQuiz)}
                size="small"
              >
                Continue Quiz
              </Button>
            )}
            {userQuiz.status === 'completed' && (
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => handleViewResult(userQuiz)}
                size="small"
              >
                View Results
              </Button>
            )}
            {userQuiz.status === 'expired' && (
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => handleViewQuizDetails(userQuiz)}
                size="small"
                disabled
              >
                Expired
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const tabCounts = [
    assignedQuizzes.length,
    inProgressQuizzes.length,
    completedQuizzes.length,
    expiredQuizzes.length,
  ];

  return (
    <Layout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            My Quizzes
          </Typography>
          <TextField
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label={`Assigned (${tabCounts[0]})`} />
            <Tab label={`In Progress (${tabCounts[1]})`} />
            <Tab label={`Completed (${tabCounts[2]})`} />
            <Tab label={`Expired (${tabCounts[3]})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {filterQuizzes(assignedQuizzes).length === 0 ? (
              <Box textAlign="center" py={4}>
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assigned quizzes
                </Typography>
                <Typography color="text.secondary">
                  {searchTerm ? 'No quizzes match your search.' : 'You have no new quizzes assigned.'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filterQuizzes(assignedQuizzes).map(quiz => renderQuizCard(quiz))}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {filterQuizzes(inProgressQuizzes).length === 0 ? (
              <Box textAlign="center" py={4}>
                <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No quizzes in progress
                </Typography>
                <Typography color="text.secondary">
                  {searchTerm ? 'No quizzes match your search.' : 'You have no quizzes currently in progress.'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filterQuizzes(inProgressQuizzes).map(quiz => renderQuizCard(quiz))}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {filterQuizzes(completedQuizzes).length === 0 ? (
              <Box textAlign="center" py={4}>
                <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No completed quizzes
                </Typography>
                <Typography color="text.secondary">
                  {searchTerm ? 'No quizzes match your search.' : 'You have not completed any quizzes yet.'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filterQuizzes(completedQuizzes).map(quiz => renderQuizCard(quiz))}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {filterQuizzes(expiredQuizzes).length === 0 ? (
              <Box textAlign="center" py={4}>
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expired quizzes
                </Typography>
                <Typography color="text.secondary">
                  {searchTerm ? 'No quizzes match your search.' : 'You have no expired quizzes.'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filterQuizzes(expiredQuizzes).map(quiz => renderQuizCard(quiz))}
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Layout>
  );
};

export default MyQuizzes;
