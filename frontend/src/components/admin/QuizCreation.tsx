import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
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
  ToggleButton,
  ToggleButtonGroup,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Save, AutoAwesome, Upload, Add } from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { CreateQuizData, GenerateQuestionsData } from '@/types/quiz';
import quizService from '@/services/quizService';
// Removed readFileAsText import since we only support PDF files now

const steps = ['Quiz Details', 'Generate Questions', 'Review & Save'];

const QuizCreation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register: registerQuiz,
    handleSubmit: handleQuizSubmit,
    formState: { errors: quizErrors },
    watch,
  } = useForm<CreateQuizData>();

  const {
    register: registerQuestions,
    handleSubmit: handleQuestionsSubmit,
    formState: { errors: questionErrors },
    setValue: setQuestionValue,
    watch: watchQuestions,
  } = useForm<GenerateQuestionsData>();

  const createQuizMutation = useMutation(quizService.createQuiz, {
    onSuccess: (data) => {
      setQuizId(data.quiz.id);
      setSuccess('Quiz created successfully!');
      setActiveStep(1);
      queryClient.invalidateQueries('admin-quizzes');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create quiz');
    },
  });

  const generateQuestionsMutation = useMutation(
    ({ quizId, data }: { quizId: number; data: GenerateQuestionsData }) =>
      quizService.generateQuestions(quizId, data),
    {
      onSuccess: (data) => {
        setSuccess(`${data.questions.length} questions generated successfully!`);
        setActiveStep(2);
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to generate questions');
      },
    }
  );

  const onQuizSubmit = (data: CreateQuizData) => {
    setError('');
    createQuizMutation.mutate(data);
  };

  const onQuestionsSubmit = (data: GenerateQuestionsData) => {
    if (!quizId) return;
    setError('');
    generateQuestionsMutation.mutate({ quizId, data });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Only allow PDF files
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed for question generation.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      setQuestionValue('file', file);
      setQuestionValue('content', '');
      setError(''); // Clear any previous errors
    }
  };

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'text' | 'file') => {
    if (newMode !== null) {
      setInputMode(newMode);
      // Clear both inputs when switching modes
      setQuestionValue('file', undefined);
      setQuestionValue('content', '');
      setError('');
    }
  };

  const handleFinish = () => {
    navigate('/admin/quizzes');
  };

  const renderQuizDetailsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quiz Configuration
        </Typography>
        <Box component="form" onSubmit={handleQuizSubmit(onQuizSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quiz Name"
                required
                {...registerQuiz('name', {
                  required: 'Quiz name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' },
                })}
                error={!!quizErrors.name}
                helperText={quizErrors.name?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                {...registerQuiz('description')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                {...registerQuiz('timeLimit', {
                  min: { value: 1, message: 'Time limit must be at least 1 minute' },
                  max: { value: 480, message: 'Time limit cannot exceed 8 hours' },
                })}
                error={!!quizErrors.timeLimit}
                helperText={quizErrors.timeLimit?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Questions per User"
                type="number"
                defaultValue={10}
                {...registerQuiz('maxQuestions', {
                  required: 'Maximum questions is required',
                  min: { value: 1, message: 'Must have at least 1 question' },
                  max: { value: 100, message: 'Cannot exceed 100 questions' },
                })}
                error={!!quizErrors.maxQuestions}
                helperText={quizErrors.maxQuestions?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passing Cutoff (%)"
                type="number"
                defaultValue={60}
                {...registerQuiz('cutoff', {
                  min: { value: 0, message: 'Cutoff cannot be negative' },
                  max: { value: 100, message: 'Cutoff cannot exceed 100%' },
                })}
                error={!!quizErrors.cutoff}
                helperText={quizErrors.cutoff?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weightage"
                type="number"
                defaultValue={100}
                {...registerQuiz('weightage', {
                  min: { value: 1, message: 'Weightage must be at least 1' },
                })}
                error={!!quizErrors.weightage}
                helperText={quizErrors.weightage?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch {...registerQuiz('negativeMarking')} />}
                label="Enable Negative Marking (25% deduction for wrong answers)"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={createQuizMutation.isLoading}
                fullWidth
              >
                {createQuizMutation.isLoading ? 'Creating Quiz...' : 'Create Quiz'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );

  const renderQuestionsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Generate Questions with AI
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose how you want to provide content for AI question generation.
        </Typography>

        {/* Mode Selector */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Content Input Method
          </Typography>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={handleModeChange}
            aria-label="content input method"
            size="small"
          >
            <ToggleButton value="text" aria-label="text content">
              📝 Text Content
            </ToggleButton>
            <ToggleButton value="file" aria-label="file upload">
              📄 PDF Upload
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box component="form" onSubmit={handleQuestionsSubmit(onQuestionsSubmit)}>
          <Grid container spacing={3}>
            {inputMode === 'file' && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload PDF Document
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    style={{ marginBottom: '16px' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Upload a PDF file for AI to analyze and generate questions
                  </Typography>
                </Paper>
              </Grid>
            )}

            {inputMode === 'text' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Text Content / Topic"
                  multiline
                  rows={6}
                  placeholder="Enter the topic or content you want to create questions about... (e.g., 'Create a quiz on ReactJS' or paste detailed content)"
                  {...registerQuestions('content', {
                    validate: (value) => {
                      if (inputMode === 'text' && (!value || value.trim().length < 10)) {
                        return 'Please provide content or topic (minimum 10 characters)';
                      }
                      return true;
                    },
                  })}
                  error={!!questionErrors.content}
                  helperText={questionErrors.content?.message}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Questions"
                type="number"
                defaultValue={5}
                {...registerQuestions('numberOfQuestions', {
                  min: { value: 1, message: 'Must generate at least 1 question' },
                  max: { value: 20, message: 'Cannot generate more than 20 questions at once' },
                })}
                error={!!questionErrors.numberOfQuestions}
                helperText={questionErrors.numberOfQuestions?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Instructions (Optional)"
                multiline
                rows={2}
                placeholder="e.g., Focus on key concepts, include practical examples, vary difficulty levels..."
                {...registerQuestions('prompt')}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={generateQuestionsMutation.isLoading ? undefined : <AutoAwesome />}
                disabled={generateQuestionsMutation.isLoading}
                fullWidth
                size="large"
                sx={{ 
                  py: 1.5,
                  position: 'relative',
                  '&.Mui-disabled': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    opacity: 0.8
                  }
                }}
              >
                {generateQuestionsMutation.isLoading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    Generating Questions from PDF...
                  </Box>
                ) : (
                  'Generate Questions'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quiz Created Successfully!
        </Typography>
        <Typography variant="body1" paragraph>
          Your quiz has been created and questions have been generated. You can now:
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button
            variant="contained"
            onClick={() => navigate(`/admin/quizzes/${quizId}`)}
            startIcon={<Add />}
          >
            Review & Edit Questions
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/users')}
          >
            Assign Quiz to Users
          </Button>
          
          <Button
            variant="text"
            onClick={handleFinish}
          >
            Back to Quiz Management
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Next Steps:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>Review and edit the generated questions</li>
            <li>Add more questions manually if needed</li>
            <li>Assign the quiz to users</li>
            <li>Monitor quiz results and analytics</li>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Quiz
        </Typography>

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

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderQuizDetailsStep()}
        {activeStep === 1 && renderQuestionsStep()}
        {activeStep === 2 && renderReviewStep()}
      </Box>
      
      <LoadingOverlay 
        open={generateQuestionsMutation.isLoading}
        message="AI is analyzing and generating questions... This may take a few moments."
        size={60}
      />
    </Layout>
  );
};

export default QuizCreation;
