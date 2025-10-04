import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { CreateQuizData } from '@/types/quiz';
import quizService from '@/services/quizService';

const QuizEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateQuizData>();

  // Fetch quiz details
  const { data: quizData, isLoading, error: fetchError } = useQuery(
    ['quiz-edit', id],
    () => quizService.getQuizById(parseInt(id!)),
    { 
      enabled: !!id,
      onSuccess: (data) => {
        // Populate form with existing quiz data
        const formData = {
          name: data.quiz.name || '',
          description: data.quiz.description || '',
          weightage: data.quiz.weightage || 100,
          timeLimit: data.quiz.time_limit || '',
          cutoff: data.quiz.cutoff || 0,
          negativeMarking: data.quiz.negative_marking || false,
          maxQuestions: data.quiz.max_questions || 10,
        };
        reset(formData);
      }
    }
  );

  const updateQuizMutation = useMutation(
    (data: CreateQuizData) => quizService.updateQuiz(parseInt(id!), data),
    {
      onSuccess: () => {
        setSuccess('Quiz updated successfully!');
        setError('');
        queryClient.invalidateQueries(['quiz-edit', id]);
        queryClient.invalidateQueries(['quiz-details', id]);
        queryClient.invalidateQueries('admin-quizzes');
        
        // Navigate back to quiz details after a short delay
        setTimeout(() => {
          navigate(`/admin/quizzes/${id}`);
        }, 1500);
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to update quiz');
        setSuccess('');
      },
    }
  );

  const onSubmit = (data: CreateQuizData) => {
    setError('');
    setSuccess('');
    updateQuizMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading quiz details..." />
      </Layout>
    );
  }

  if (fetchError) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load quiz details. Please try again.
        </Alert>
      </Layout>
    );
  }

  const quiz = quizData?.quiz;

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
        open={updateQuizMutation.isLoading}
        message="Updating quiz..."
      />
      
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate(`/admin/quizzes/${id}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit Quiz: {quiz.name}
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

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quiz Details
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Quiz Name"
                    value={watch('name') || ''}
                    {...register('name', { 
                      required: 'Quiz name is required',
                      minLength: { value: 3, message: 'Quiz name must be at least 3 characters' }
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description (Optional)"
                    value={watch('description') || ''}
                    {...register('description')}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Weightage"
                    value={watch('weightage') || ''}
                    {...register('weightage', { 
                      required: 'Weightage is required',
                      min: { value: 1, message: 'Weightage must be at least 1' },
                      max: { value: 1000, message: 'Weightage cannot exceed 1000' }
                    })}
                    error={!!errors.weightage}
                    helperText={errors.weightage?.message || 'Points value for this quiz'}
                    inputProps={{ min: 1, max: 1000 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Time Limit (minutes)"
                    value={watch('timeLimit') || ''}
                    {...register('timeLimit', {
                      min: { value: 1, message: 'Time limit must be at least 1 minute' },
                      max: { value: 480, message: 'Time limit cannot exceed 8 hours (480 minutes)' }
                    })}
                    error={!!errors.timeLimit}
                    helperText={errors.timeLimit?.message || 'Leave empty for no time limit'}
                    inputProps={{ min: 1, max: 480 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cutoff Percentage"
                    value={watch('cutoff') || ''}
                    {...register('cutoff', { 
                      required: 'Cutoff percentage is required',
                      min: { value: 0, message: 'Cutoff cannot be negative' },
                      max: { value: 100, message: 'Cutoff cannot exceed 100%' }
                    })}
                    error={!!errors.cutoff}
                    helperText={errors.cutoff?.message || 'Minimum percentage to pass'}
                    inputProps={{ min: 0, max: 100 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Questions"
                    value={watch('maxQuestions') || ''}
                    {...register('maxQuestions', { 
                      required: 'Maximum questions is required',
                      min: { value: 1, message: 'Must have at least 1 question' },
                      max: { value: 100, message: 'Cannot exceed 100 questions' }
                    })}
                    error={!!errors.maxQuestions}
                    helperText={errors.maxQuestions?.message || 'Questions to show per attempt'}
                    inputProps={{ min: 1, max: 100 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        {...register('negativeMarking')}
                        checked={watch('negativeMarking') || false}
                      />
                    }
                    label="Enable Negative Marking"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Deduct points for incorrect answers
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/admin/quizzes/${id}`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={updateQuizMutation.isLoading}
                    >
                      {updateQuizMutation.isLoading ? 'Updating...' : 'Update Quiz'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default QuizEdit;
