import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import { Save, Person } from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

interface ProfileFormData {
  name: string;
  phone: string;
}

const Profile: React.FC = () => {
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const { data: profileData, isLoading } = useQuery(
    'user-profile',
    () => apiService.get<{ user: any }>('/user/profile'),
    {
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        reset({
          name: data.user.name,
          phone: data.user.phone || '',
        });
      },
    }
  );

  const updateProfileMutation = useMutation(
    (data: ProfileFormData) => apiService.put('/user/profile', data),
    {
      onSuccess: (data: any) => {
        setSuccess('Profile updated successfully!');
        setError('');
        queryClient.invalidateQueries('user-profile');
        
        // Update user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to update profile');
        setSuccess('');
      },
    }
  );

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading profile..." />
      </Layout>
    );
  }

  const userProfile = profileData?.user || user;

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Info Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {userProfile?.name?.charAt(0).toUpperCase() || <Person />}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {userProfile?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {userProfile?.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: userProfile?.role === 'admin' ? 'primary.light' : 'grey.200',
                    color: userProfile?.role === 'admin' ? 'primary.dark' : 'text.secondary',
                    borderRadius: 1,
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                  }}
                >
                  {userProfile?.role}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box textAlign="left">
                  <Typography variant="subtitle2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Profile Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Edit Profile
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        required
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={userProfile?.email || ''}
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        type="tel"
                        required
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[+]?[\d\s\-()]+$/,
                            message: 'Invalid phone number format',
                          },
                        })}
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userProfile?.role || ''}
                        disabled
                        helperText="Role cannot be changed"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={updateProfileMutation.isLoading}
                        size="large"
                      >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Profile;
