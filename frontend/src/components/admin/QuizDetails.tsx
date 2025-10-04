import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Delete,
  Add,
  ArrowBack,
  Save,
  Analytics,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import quizService from '@/services/quizService';
import { Question } from '@/types/quiz';

const QuizDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const { data, isLoading, error } = useQuery(
    ['quiz-details', id],
    () => quizService.getQuizDetails(parseInt(id!)),
    { enabled: !!id }
  );

  const updateQuestionMutation = useMutation(
    ({ questionId, data }: { questionId: number; data: any }) => 
      quizService.updateQuestion(questionId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quiz-details', id]);
        setEditDialogOpen(false);
        setEditingQuestion(null);
      },
    }
  );

  const deleteQuestionMutation = useMutation(quizService.deleteQuestion, {
    onSuccess: () => {
      queryClient.invalidateQueries(['quiz-details', id]);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    },
  });

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        questionId: editingQuestion.id,
        data: {
          question_text: editingQuestion.question_text,
          question_type: editingQuestion.question_type,
          marks: editingQuestion.marks,
          correct_explanation: editingQuestion.correct_explanation,
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete.id);
    }
  };

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
        open={updateQuestionMutation.isLoading || deleteQuestionMutation.isLoading}
        message={updateQuestionMutation.isLoading ? 'Updating question...' : 'Deleting question...'}
      />
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/admin/quizzes')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            {quiz.name}
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quiz Information
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
              <Chip label={`${questions.length} Questions`} color="primary" />
              <Chip label={quiz.time_limit ? `${quiz.time_limit} minutes` : 'No time limit'} variant="outlined" />
              <Chip label={`${quiz.cutoff}% cutoff`} variant="outlined" />
            </Box>
            {quiz.description && (
              <Typography variant="body2" color="text.secondary">
                {quiz.description}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Questions ({questions.length})
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Analytics />}
              onClick={() => navigate(`/admin/quizzes/${id}/results`)}
            >
              View Results
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/admin/quizzes/${id}/questions/add`)}
            >
              Add Question
            </Button>
          </Box>
        </Box>

        {questions.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No questions added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Add questions to make this quiz functional.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate(`/admin/quizzes/${id}/questions/add`)}
                >
                  Add First Question
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {questions.map((question, index) => (
              <Accordion key={question.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Typography variant="subtitle1">
                      Q{index + 1}: {question.question_text}
                    </Typography>
                    <Box display="flex" gap={1} ml="auto">
                      <Chip
                        label={question.question_type.replace('_', ' ').toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${question.marks} marks`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box width="100%">
                    <Typography variant="subtitle2" gutterBottom>
                      Options:
                    </Typography>
                    <List dense>
                      {question.options.map((option) => (
                        <ListItem key={option.id}>
                          <ListItemText
                            primary={option.option_text}
                            sx={{
                              color: option.is_correct ? 'success.main' : 'text.primary',
                              fontWeight: option.is_correct ? 'bold' : 'normal'
                            }}
                          />
                          {option.is_correct && (
                            <Chip label="Correct" size="small" color="success" />
                          )}
                        </ListItem>
                      ))}
                    </List>
                    
                    {question.correct_explanation && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Explanation:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {question.correct_explanation}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditQuestion(question)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteQuestion(question)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Edit Question Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogContent>
            {editingQuestion && (
              <Box>
                <TextField
                  fullWidth
                  label="Question Text"
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question_text: e.target.value
                  })}
                  margin="normal"
                  multiline
                  rows={3}
                />
                
                <TextField
                  fullWidth
                  label="Marks"
                  type="number"
                  value={editingQuestion.marks}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    marks: parseInt(e.target.value) || 1
                  })}
                  margin="normal"
                />


                <TextField
                  fullWidth
                  label="Correct Explanation"
                  value={editingQuestion.correct_explanation || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    correct_explanation: e.target.value
                  })}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              variant="contained"
              startIcon={<Save />}
              disabled={updateQuestionMutation.isLoading}
            >
              {updateQuestionMutation.isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Question Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Question</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this question? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteQuestionMutation.isLoading}
            >
              {deleteQuestionMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default QuizDetails;
