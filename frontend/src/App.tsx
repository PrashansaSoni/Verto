import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Components
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Auth Components
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';

// Admin Components
import AdminDashboard from '@/components/admin/Dashboard';
import QuizManagement from '@/components/admin/QuizManagement';
import QuizCreation from '@/components/admin/QuizCreation';
import QuizEdit from '@/components/admin/QuizEdit';
import QuizAssign from '@/components/admin/QuizAssign';
import QuizDetails from '@/components/admin/QuizDetails';
import AddQuestion from '@/components/admin/AddQuestion';
import UserManagement from '@/components/admin/UserManagement';
import UserDetails from '@/components/admin/UserDetails';
import ResultsAnalytics from '@/components/admin/ResultsAnalytics';
import QuizSpecificResults from '@/components/admin/QuizSpecificResults';
import UserSpecificResults from '@/components/admin/UserSpecificResults';

// User Components
import UserDashboard from '@/components/user/Dashboard';
import MyQuizzes from '@/components/user/MyQuizzes';
import UserQuizDetails from '@/components/user/QuizDetails';
import QuizTaking from '@/components/user/QuizTaking';
import QuizResults from '@/components/user/QuizResults';
import Profile from '@/components/user/Profile';

const App: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />
          ) : (
            <Login />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />
          ) : (
            <Register />
          )
        } 
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="quizzes" element={<QuizManagement />} />
              <Route path="quizzes/create" element={<QuizCreation />} />
              <Route path="quizzes/:id" element={<QuizDetails />} />
              <Route path="quizzes/:id/edit" element={<QuizEdit />} />
              <Route path="quizzes/:id/assign" element={<QuizAssign />} />
              <Route path="quizzes/:id/questions/add" element={<AddQuestion />} />
              <Route path="quizzes/:id/results" element={<QuizSpecificResults />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="users/:id/results" element={<UserSpecificResults />} />
              <Route path="results" element={<ResultsAnalytics />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* User Routes */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute requiredRole="user">
            <Routes>
              <Route index element={<UserDashboard />} />
              <Route path="my-quizzes" element={<MyQuizzes />} />
              <Route path="quiz/:id/details" element={<UserQuizDetails />} />
              <Route path="quiz/:id" element={<QuizTaking />} />
              <Route path="results/:id" element={<QuizResults />} />
              <Route path="profile" element={<Profile />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
