import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TablePagination,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Assignment,
} from '@mui/icons-material';
import Layout from '@/components/common/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import quizService from '@/services/quizService';
import { User } from '@/types/auth';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery(
    ['admin-users', page + 1, rowsPerPage],
    () => quizService.getUsers(page + 1, rowsPerPage),
    { 
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true 
    }
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading users..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          Failed to load users. Please try again.
        </Alert>
      </Layout>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1, limit: 10 };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>

        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Registered Users
              </Typography>
              <Chip
                label={`Total: ${pagination.total}`}
                color="primary"
                variant="outlined"
              />
            </Box>

            {users.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No users registered yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Users will appear here once they register for the platform.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2,
                                  fontSize: '0.875rem',
                                  fontWeight: 'bold',
                                }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </Box>
                              <Typography variant="subtitle2">
                                {user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.phone || (
                              <Typography variant="caption" color="text.secondary">
                                Not provided
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              variant={user.role === 'admin' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : 'Unknown'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              title="View User Details"
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="View User's Quiz Results"
                              onClick={() => navigate(`/admin/users/${user.id}/results`)}
                            >
                              <Assignment />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={pagination.total}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Box mt={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Statistics
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  label={`Total Users: ${pagination.total}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Admins: ${users.filter(u => u.role === 'admin').length}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={`Regular Users: ${users.filter(u => u.role === 'user').length}`}
                  color="default"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
};

export default UserManagement;
