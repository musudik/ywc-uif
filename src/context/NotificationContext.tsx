import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  autoClose?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' };

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Add notification
  const showNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      autoClose: true,
      duration: 5000,
      ...notification,
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Auto-remove notification if autoClose is enabled
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, newNotification.duration);
    }

    return id;
  }, [generateId]);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message?: string): string => {
    return showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string): string => {
    return showNotification({ 
      type: 'error', 
      title, 
      message, 
      duration: 7000, // Errors stay longer
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string): string => {
    return showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string): string => {
    return showNotification({ type: 'info', title, message });
  }, [showNotification]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const value: NotificationContextType = {
    notifications: state.notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Hook for API error handling
export function useApiErrorHandler() {
  const { showError } = useNotification();

  return useCallback((error: any, fallbackMessage = 'An unexpected error occurred') => {
    let title = 'Error';
    let message = fallbackMessage;

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Extract status-specific messages
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          title = 'Bad Request';
          break;
        case 401:
          title = 'Unauthorized';
          message = 'Please log in to continue';
          break;
        case 403:
          title = 'Forbidden';
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found';
          break;
        case 422:
          title = 'Validation Error';
          break;
        case 500:
          title = 'Server Error';
          message = 'An internal server error occurred. Please try again later.';
          break;
        default:
          title = `Error ${error.response.status}`;
      }
    }

    return showError(title, message);
  }, [showError]);
} 