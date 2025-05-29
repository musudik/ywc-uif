import { apiService } from './api';
import type { User, UserRole, ApiResponse } from '../types';

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
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Set token in API service
      apiService.setToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.message || 'Login failed');
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
  async getCoachClients(): Promise<Array<{
    personal_id: string;
    first_name: string;
    last_name: string;
    email: string;
    applicant_type: string;
    created_at: string;
  }>> {
    const response = await apiService.get<Array<{
      personal_id: string;
      first_name: string;
      last_name: string;
      email: string;
      applicant_type: string;
      created_at: string;
    }>>('/auth/me/clients');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get clients');
  }

  // Get all coaches (Admin only) - for now we'll simulate this by getting all users with role COACH
  // This is a temporary solution until a proper /coaches endpoint is available
  async getAllCoaches(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>> {
    // For now, we'll return mock data since there's no dedicated coaches endpoint
    // In a real implementation, this would call a /users?role=COACH endpoint
    try {
      // Try to get users with COACH role - this endpoint may not exist yet
      const response = await apiService.get<Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      }>>('/users?role=COACH');
      
      if (response.success && response.data) {
        return response.data.filter(user => user.role === 'COACH');
      }
    } catch (error) {
      console.log('No dedicated coaches endpoint available, using fallback');
    }
    
    // Fallback: Return mock coaches for now
    return [
      { id: 'coach-1', first_name: 'John', last_name: 'Smith', email: 'john.smith@ywc.com' },
      { id: 'coach-2', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@ywc.com' },
      { id: 'coach-3', first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@ywc.com' },
    ];
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