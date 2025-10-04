import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import { ArrowBack, Assignment, People } from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import quizService from '@/services/quizService';
import { User } from '@/types/auth';

const QuizAssign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch quiz details
  const { data: quizData, isLoading: quizLoading, error: quizError } = useQuery(
    ['quiz-assign', id],
    () => quizService.getQuizById(parseInt(id!)),
    { enabled: !!id }
  );

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    'admin-users-assign',
    () => quizService.getUsers(1, 50), // Get more users for assignment
    { staleTime: 5 * 60 * 1000 }
  );

  const assignQuizMutation = useMutation(
    (data: { quizId: number; userIds: number[] }) => quizService.assignQuiz(data),
    {
      onSuccess: () => {
        setSuccess(`Quiz assigned to ${selectedUsers.length} user(s) successfully!`);
        setError('');
        setSelectedUsers([]);
        queryClient.invalidateQueries('admin-users-assign');
        
        // Navigate back to quiz details after a short delay
        setTimeout(() => {
          navigate(`/admin/quizzes/${id}`);
        }, 2000);
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to assign quiz');
        setSuccess('');
      },
    }
  );

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUserIds = users.map(user => user.id);
    setSelectedUsers(
      selectedUsers.length === users.length ? [] : allUserIds
    );
  };

  const handleAssignQuiz = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to assign the quiz to');
      return;
    }

    setError('');
    setSuccess('');
    assignQuizMutation.mutate({
      quizId: parseInt(id!),
      userIds: selectedUsers
    });
  };

  if (quizLoading || usersLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quiz and users..." />
      </Layout>
    );
  }

  if (quizError || usersError) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quiz or users data. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quiz = quizData?.quiz;
  const allUsers = usersData?.users || [];
  // Filter to only show users with 'user' role (exclude admins)
  const users = allUsers.filter(user => user.role === 'user');

  if (!quiz) {
    return (
      <Layout>
        <Alert severity="warning">
          Quiz not found.
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingOverlay 
        open={assignQuizMutation.isLoading}
        message="Assigning quiz to users..."
      />
      
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate(`/admin/quizzes/${id}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Assign Quiz: {quiz.name}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quiz Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {quiz.name}
                  </Typography>
                  {quiz.description && (
                    <Typography variant="body2">
                      <strong>Description:</strong> {quiz.description}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Weightage:</strong> {quiz.weightage} points
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time Limit:</strong> {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No limit'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cutoff:</strong> {quiz.cutoff}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Max Questions:</strong> {quiz.max_questions}
                  </Typography>
                  <Box mt={1}>
                    <Chip 
                      label={quiz.negative_marking ? 'Negative Marking' : 'No Negative Marking'} 
                      size="small"
                      color={quiz.negative_marking ? 'warning' : 'success'}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6">
                      Select Users ({selectedUsers.length} selected)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Only users with 'User' role are shown (Admin users excluded)
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<People />}
                    onClick={handleSelectAll}
                    size="small"
                    disabled={users.length === 0}
                  >
                    {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                            checked={users.length > 0 && selectedUsers.length === users.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                            />
                          </TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              size="small"
                              color={user.role === 'admin' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {users.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {allUsers.length === 0 
                      ? 'No users found in the system.' 
                      : 'No users with "User" role available for assignment. Only non-admin users can be assigned quizzes.'
                    }
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/admin/quizzes/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={handleAssignQuiz}
            disabled={assignQuizMutation.isLoading || selectedUsers.length === 0}
          >
            {assignQuizMutation.isLoading ? 'Assigning...' : `Assign to ${selectedUsers.length} User(s)`}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default QuizAssign;
