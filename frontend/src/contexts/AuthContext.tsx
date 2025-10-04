import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, AuthContextType } from '@/types/auth';
import authService from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_FAILURE' }
  | { type: 'INITIALIZE'; payload: { user: User; token: string } | null };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
      };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };

    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload?.user || null,
        token: action.payload?.token || null,
        isLoading: false,
        isAuthenticated: !!action.payload,
      };

    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = authService.getToken();
    const user = authService.getCurrentUser();

    if (token && user) {
      dispatch({ type: 'INITIALIZE', payload: { user, token } });
    } else {
      dispatch({ type: 'INITIALIZE', payload: null });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.login(credentials);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'REGISTER_START' });
      const response = await authService.register(userData);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE' });
      throw error;
    }
  };

  const logout = (): void => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
