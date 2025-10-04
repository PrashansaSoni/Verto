import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Assignment,
  Analytics,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';
import { Quiz } from '@/types/quiz';

const QuizManagement: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery(
    'admin-quizzes',
    () => quizService.getAdminQuizzes(),
    { staleTime: 5 * 60 * 1000 }
  );

  const deleteQuizMutation = useMutation(quizService.deleteQuiz, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-quizzes');
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete quiz');
    },
  });

  const handleDeleteClick = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (quizToDelete) {
      deleteQuizMutation.mutate(quizToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quizzes..." />
      </Layout>
    );
  }

  if (queryError) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quizzes. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quizzes = data?.quizzes || [];

  // Debug logging
  console.log('Quiz data:', {
    data,
    quizzes,
    firstQuiz: quizzes[0],
    timeLimit: quizzes[0]?.time_limit
  });

  return (
    <Layout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Quiz Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/quizzes/create')}
          >
            Create Quiz
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {quizzes.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No quizzes created yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create your first quiz to get started with the quiz management system.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/admin/quizzes/create')}
                >
                  Create Your First Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quiz Name</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Time Limit</TableCell>
                  <TableCell>Cutoff</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizzes.map((quiz) => (
                  <TableRow key={quiz.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {quiz.name}
                        </Typography>
                        {quiz.description && (
                          <Typography variant="caption" color="text.secondary">
                            {quiz.description.length > 50
                              ? `${quiz.description.substring(0, 50)}...`
                              : quiz.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Max ${quiz.max_questions}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {quiz.time_limit && quiz.time_limit > 0 ? `${quiz.time_limit} min` : 'No limit'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${quiz.cutoff}%`}
                        size="small"
                        color={quiz.cutoff >= 60 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={quiz.max_questions > 0 ? 'Active' : 'Draft'}
                        size="small"
                        color={quiz.max_questions > 0 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(quiz.created_at!).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                        title="Edit Quiz"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/assign`)}
                        title="Assign to Users"
                      >
                        <Assignment />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/results`)}
                        title="View Results"
                      >
                        <Analytics />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(quiz)}
                        title="Delete Quiz"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Quiz</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{quizToDelete?.name}"? This action cannot be undone.
              All associated questions, user assignments, and results will also be deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteQuizMutation.isLoading}
            >
              {deleteQuizMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default QuizManagement;
