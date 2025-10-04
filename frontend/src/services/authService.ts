import apiService from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    // Store token and user data
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Set auth token for future requests
    apiService.setAuthToken(response.token);
    
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    // Store token and user data
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Set auth token for future requests
    apiService.setAuthToken(response.token);
    
    return response;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiService.post('/auth/forgot-password', { email });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.removeAuthToken();
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'user';
  }
}

export default new AuthService();
