import { apiService } from './api';
import type { User, UserRole } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  coach_id?: string; // Required when creating a client
}

export class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        // Set token in API service
        apiService.setToken(response.data.token);
        return response.data;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NetworkError') {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  // Register new user (Admin can create Coach/Admin accounts, Coach can create Client accounts)
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiService.get<User>('/auth/profile');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get profile');
  }

  // Get coach's clients (Coach/Admin only)
  async getCoachClients(coachId: string): Promise<Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    applicant_type: string;
    created_at: string;
  }>> {
    const response = await apiService.get<{
      coach: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      };
      clients: Array<{
        user_id: string;
        first_name: string;
        last_name: string;
        email: string;
        applicant_type: string;
        created_at: string;
      }>;
      total_clients: number;
    }>(`/auth/clients/${coachId}`);
    
    if (response.success && response.data) {
      console.log(response.data);
      return response.data.clients;
    }
    
    throw new Error(response.message || 'Failed to get clients');
  }

  // Get all coaches (Admin only)
  async getAllCoaches(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>> {
    try {
      const response = await apiService.get<Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      }>>('/user/users/COACH');
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Error fetching coaches:', error);
    }
    
    // Return empty array if endpoint fails
    return [];
  }

  // Get all clients (Admin only)
  async getAllClients(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>> {
    try {
      const response = await apiService.get<Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      }>>('/user/users/CLIENT');
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Error fetching clients:', error);
    }
    
    // Return empty array if endpoint fails
    return [];
  }

  // Refresh JWT token
  async refreshToken(currentToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/refresh', { token: currentToken });
    
    if (response.success && response.data) {
      const newToken = response.data.token;
      apiService.setToken(newToken);
      return response.data;
    }
    
    throw new Error(response.message || 'Token refresh failed');
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear token from API service
      apiService.clearToken();
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!apiService.getToken();
  }

  // Get all users (Admin only)
  async getAllUsers(): Promise<User[]> {
    const response = await apiService.get<User[]>('/users');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get users');
  }

  // Create new user (Admin only)
  async createUser(userData: RegisterRequest): Promise<User> {
    const response = await apiService.post<User>('/auth/register', userData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create user');
  }

  // Update user (Admin only)
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await apiService.put<User>(`/users/${userId}`, userData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update user');
  }

  // Extract role from JWT token (basic implementation)
  extractRoleFromToken(token: string): UserRole | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Error extracting role from token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 