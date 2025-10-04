import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Checkbox,
  LinearProgress,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowBack,
  Save,
  Psychology,
  Edit,
  AutoAwesome,
  Upload,
  Description,
  Analytics,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingOverlay from '@/components/common/LoadingOverlay';
// Removed readFileAsText import since we only support PDF files now
import quizService from '@/services/quizService';

interface QuestionOption {
  text: string;
  is_correct: boolean;
}

const AddQuestion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [questionMethod, setQuestionMethod] = useState<'manual' | 'ai'>('manual');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'multiple_select' | 'true_false'>('mcq');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]);
  const [error, setError] = useState('');
  
  // Enhanced AI generation state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focusAreas, setFocusAreas] = useState('');
  const [distributionStrategy, setDistributionStrategy] = useState<'even' | 'weighted'>('weighted');
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);

  const addQuestionMutation = useMutation(
    ({ quizId, data }: { quizId: number; data: any }) => 
      quizService.createQuestion(quizId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quiz-details', id]);
        navigate(`/admin/quizzes/${id}`);
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to add question');
      },
    }
  );

  const generateQuestionsMutation = useMutation(
    ({ quizId, data }: { quizId: number; data: any }) => 
      quizService.generateQuestions(quizId, data),
    {
      onSuccess: (response: any) => {
        console.log('Generation response:', response);
        if (response.contentAnalysis) {
          setContentAnalysis(response.contentAnalysis);
        }
        queryClient.invalidateQueries(['quiz-details', id]);
        navigate(`/admin/quizzes/${id}`);
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to generate questions');
      },
    }
  );

  const handleAddOption = () => {
    setOptions([...options, { text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleCorrectOptionChange = (index: number, isCorrect: boolean) => {
    const newOptions = [...options];
    
    if (questionType === 'mcq' || questionType === 'true_false') {
      // For single-select questions, only one option can be correct
      newOptions.forEach((option, i) => {
        option.is_correct = i === index && isCorrect;
      });
    } else {
      // For multiple-select questions, multiple options can be correct
      newOptions[index].is_correct = isCorrect;
    }
    
    setOptions(newOptions);
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
      
      setSelectedFile(file);
      setError(''); // Clear any previous errors
    }
  };

  const handleGenerateQuestions = () => {
    if (!selectedFile && !questionText.trim()) {
      setError('Please provide content or upload a file for AI to analyze');
      return;
    }

    setError('');
    
    const generateData = {
      file: selectedFile || undefined,
      content: questionText || undefined,
      prompt: explanation,
      numberOfQuestions: marks,
      difficulty: difficulty,
      focusAreas: focusAreas,
      distributionStrategy: distributionStrategy
    };

    generateQuestionsMutation.mutate({
      quizId: parseInt(id!),
      data: generateData
    });
  };

  const handleSubmit = () => {
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (questionType !== 'true_false' && options.some(opt => !opt.text.trim())) {
      setError('All options must have text');
      return;
    }

    if (questionType !== 'true_false' && !options.some(opt => opt.is_correct)) {
      setError('At least one option must be correct');
      return;
    }

    if (questionType === 'true_false' && options.length !== 2) {
      setError('True/False questions must have exactly 2 options');
      return;
    }

    setError('');

    addQuestionMutation.mutate({
      quizId: parseInt(id!),
      data: {
        questionText: questionText,
        questionType: questionType,
        marks,
        correctExplanation: explanation,
        options: questionType === 'true_false' ? [
          { text: 'True', isCorrect: options[0]?.is_correct || false },
          { text: 'False', isCorrect: options[1]?.is_correct || false }
        ] : options.filter(opt => opt.text.trim()).map(opt => ({
          text: opt.text,
          isCorrect: opt.is_correct
        }))
      }
    });
  };

  const handleQuestionTypeChange = (type: 'mcq' | 'multiple_select' | 'true_false') => {
    setQuestionType(type);
    if (type === 'true_false') {
      setOptions([
        { text: 'True', is_correct: false },
        { text: 'False', is_correct: false }
      ]);
    } else {
      setOptions([
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]);
    }
  };

  return (
    <Layout>
      <LoadingOverlay 
        open={addQuestionMutation.isLoading || generateQuestionsMutation.isLoading}
        message={addQuestionMutation.isLoading ? "Adding question to quiz..." : " AI is analyzing and generating questions... This may take a few moments."}
        size={60}
      />
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate(`/admin/quizzes/${id}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Add Questions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Question Method Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How would you like to add questions?
            </Typography>
            <RadioGroup
              value={questionMethod}
              onChange={(e) => setQuestionMethod(e.target.value as 'manual' | 'ai')}
              row
            >
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Edit />
                    <Typography>Add manually</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="ai"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <AutoAwesome />
                    <Typography>Generate with AI</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </CardContent>
        </Card>

        {questionMethod === 'manual' ? (
          <Card>
            <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Question Text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  multiline
                  rows={3}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={questionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value as any)}
                  >
                    <MenuItem value="mcq">Multiple Choice</MenuItem>
                    <MenuItem value="multiple_select">Multiple Select</MenuItem>
                    <MenuItem value="true_false">True/False</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Marks"
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correct Explanation (Optional)"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Options
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {questionType === 'multiple_select' 
                    ? 'Check all correct options (multiple answers allowed)'
                    : 'Select the one correct option'
                  }
                </Typography>
                
                {options.map((option, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      disabled={questionType === 'true_false'}
                    />
                    <Box display="flex" alignItems="center" minWidth="120px">
                      {questionType === 'multiple_select' ? (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={option.is_correct}
                              onChange={(e) => handleCorrectOptionChange(index, e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Correct"
                        />
                      ) : (
                        <FormControlLabel
                          control={
                            <Radio
                              checked={option.is_correct}
                              onChange={(e) => handleCorrectOptionChange(index, e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Correct"
                        />
                      )}
                    </Box>
                    {options.length > 2 && questionType !== 'true_false' && (
                      <IconButton 
                        onClick={() => handleRemoveOption(index)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}

                {questionType !== 'true_false' && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddOption}
                    sx={{ mt: 1 }}
                  >
                    Add Option
                  </Button>
                )}
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
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                    disabled={addQuestionMutation.isLoading}
                  >
                    {addQuestionMutation.isLoading ? 'Adding...' : 'Add Question'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Questions with AI
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide content or upload a file, and AI will generate relevant questions for your quiz.
              </Typography>
              
              <Grid container spacing={3}>
                {/* File Upload Section */}
                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      border: '2px dashed #e0e0e0',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: '#f8fafc',
                      },
                    }}
                  >
                    <Box textAlign="center">
                      <Upload sx={{ fontSize: 48, color: '#6366f1', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Upload Document
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Upload a PDF file OR provide text content below (either one is required)
                      </Typography>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<Upload />}
                          sx={{ mr: 2 }}
                        >
                          Choose File
                        </Button>
                      </label>
                      {selectedFile && (
                        <Chip
                          icon={<Description />}
                          label={selectedFile.name}
                          onDelete={() => setSelectedFile(null)}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Content Input */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={selectedFile ? "Additional Context (Optional)" : "Content for AI to analyze"}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    multiline
                    rows={4}
                    placeholder={selectedFile ? 
                      "Add any additional context or specific instructions..." :
                      "Enter the content or topic you want questions generated for..."
                    }
                    helperText={selectedFile ? 
                      "Provide additional context to help AI generate better questions" :
                      "Describe the topic, paste text content, or provide context for question generation"
                    }
                    disabled={!!selectedFile && questionText === ''}
                  />
                </Grid>
                
                {/* Generation Parameters */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of Questions"
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 20 }}
                    helperText="How many questions to generate (1-20)"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty Level</InputLabel>
                    <Select
                      value={difficulty}
                      label="Difficulty Level"
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Focus Areas (Optional)"
                    value={focusAreas}
                    onChange={(e) => setFocusAreas(e.target.value)}
                    placeholder="e.g., algorithms, data structures, theory"
                    helperText="Comma-separated topics to focus on"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Question Distribution</InputLabel>
                    <Select
                      value={distributionStrategy}
                      label="Question Distribution"
                      onChange={(e) => setDistributionStrategy(e.target.value as 'even' | 'weighted')}
                    >
                      <MenuItem value="weighted">Weighted by Content</MenuItem>
                      <MenuItem value="even">Even Distribution</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Custom Instructions (Optional)"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="e.g., Focus on practical applications, include scenario-based questions, avoid memorization..."
                    helperText="Additional instructions for AI question generation"
                  />
                </Grid>
                
                {/* Progress Indicator */}
                {generateQuestionsMutation.isLoading && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, backgroundColor: '#f8fafc' }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Analytics color="primary" />
                        <Typography variant="h6">Analyzing Content & Generating Questions</Typography>
                      </Box>
                      <LinearProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile ? 
                          `Parsing "${selectedFile.name}" and generating ${marks} questions...` :
                          `Analyzing content and generating ${marks} questions...`
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Content Analysis Display */}
                {contentAnalysis && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <Typography variant="h6" gutterBottom color="success.main">
                        Content Analysis Complete
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">File</Typography>
                          <Typography variant="body1" fontWeight={500}>{contentAnalysis.fileName}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Sections</Typography>
                          <Typography variant="body1" fontWeight={500}>{contentAnalysis.sections}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Word Count</Typography>
                          <Typography variant="body1" fontWeight={500}>{contentAnalysis.wordCount}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Complexity</Typography>
                          <Chip 
                            label={contentAnalysis.complexity} 
                            size="small"
                            color={contentAnalysis.complexity === 'advanced' ? 'error' : contentAnalysis.complexity === 'intermediate' ? 'warning' : 'success'}
                          />
                        </Grid>
                        {contentAnalysis.topics && contentAnalysis.topics.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>Key Topics</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {contentAnalysis.topics.map((topic: string, index: number) => (
                                <Chip key={index} label={topic} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Enhanced AI Generation:</strong> Upload a file for intelligent content parsing and structured question generation. 
                      The AI will analyze document sections, identify key topics, and distribute questions strategically.
                    </Typography>
                  </Alert>
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
                      variant="contained"
                      size="large"
                      startIcon={generateQuestionsMutation.isLoading ? undefined : <AutoAwesome />}
                      onClick={handleGenerateQuestions}
                      disabled={generateQuestionsMutation.isLoading}
                      sx={{
                        px: 3,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        },
                        '&.Mui-disabled': {
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default AddQuestion;
