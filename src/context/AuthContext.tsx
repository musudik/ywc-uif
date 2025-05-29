import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import type { User } from '../types';

// Auth State Interface
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Auth Context Interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
}

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user profile
          const user = await authService.getProfile();
          dispatch({ type: 'SET_USER', payload: user });
        }
      } catch (error) {
        // Token might be expired or invalid
        console.warn('Failed to initialize auth:', error);
        await authService.logout();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const { user, token } = await authService.login({ email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update profile
  const updateProfile = async (): Promise<void> => {
    try {
      const user = await authService.getProfile();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    updateProfile,
    hasRole,
    hasAnyRole,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based access control hook
export function useRoleGuard(allowedRoles: UserRole[]): boolean {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(allowedRoles);
}

// Permission checking utilities
export const rolePermissions = {
  [UserRole.ADMIN]: [
    'MANAGE_USERS',
    'CREATE_COACHES',
    'MANAGE_ROLES',
    'MANAGE_CLIENTS',
    'MANAGE_COACHES',
    'MANAGE_CONTENT',
    'VIEW_REPORTS',
  ],
  [UserRole.COACH]: [
    'CREATE_CLIENTS',
    'MANAGE_OWN_CLIENTS',
    'VIEW_CLIENT_DATA',
    'CREATE_REPORTS',
  ],
  [UserRole.CLIENT]: [
    'VIEW_OWN_DATA',
    'UPDATE_PROFILE',
    'REQUEST_SERVICES',
  ],
  [UserRole.GUEST]: [
    'VIEW_PUBLIC_CONTENT',
  ],
};

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
} 