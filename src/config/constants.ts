// Application Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
} as const;

export const APP_CONFIG = {
  NAME: 'Your Wealth Coach',
  SHORT_NAME: 'YWC',
  DESCRIPTION: 'Professional Financial Coaching & Wealth Management Platform',
  VERSION: '1.0.0',
  WEBSITE: 'yourwealth.coach',
  SUPPORT_EMAIL: 'support@yourwealth.coach',
  COMPANY: 'Your Wealth Coach',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_MODE: 'light' as const,
  STORAGE_KEY: 'themeMode',
  ROLES: {
    ADMIN: {
      primary: '#3B82F6',    // Blue
      secondary: '#1E40AF',
      accent: '#60A5FA',
    },
    COACH: {
      primary: '#10B981',    // Green
      secondary: '#047857',
      accent: '#34D399',
    },
    CLIENT: {
      primary: '#F59E0B',    // Orange
      secondary: '#D97706',
      accent: '#FBBF24',
    },
    GUEST: {
      primary: '#6B7280',    // Gray
      secondary: '#4B5563',
      accent: '#9CA3AF',
    },
  },
} as const;

// Pagination Defaults
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Form Configuration
export const FORM_CONFIG = {
  AUTO_SAVE_DELAY: 1000, // ms
  VALIDATION_DEBOUNCE: 300, // ms
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000, // ms
  ERROR_DURATION: 7000, // ms
  MAX_NOTIFICATIONS: 5,
} as const; 