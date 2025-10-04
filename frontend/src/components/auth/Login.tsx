import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import { LoginCredentials } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Watch form values to clear error when user starts typing
  const watchedValues = watch();
  
  useEffect(() => {
    // Clear error when user starts typing in any field
    if (error && (watchedValues.email || watchedValues.password)) {
      setError('');
    }
  }, [watchedValues.email, watchedValues.password, error]);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setError('');
      setIsLoading(true);
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.5rem',
                mx: 'auto',
                mb: 3,
              }}
            >
              V
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#334155' }}>
              Sign in to Verto Quiz
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Enter your credentials to access your account
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                },
                '& .MuiAlert-icon': {
                  fontSize: '1.25rem',
                },
                borderRadius: 2,
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
              }}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }} 
            noValidate
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 4, 
                mb: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box textAlign="center" mb={3}>
              <Link
                to="/register"
                style={{ 
                  textDecoration: 'none',
                  color: '#6366f1',
                  fontWeight: 500,
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>

          
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
