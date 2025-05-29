import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UserRole } from '../types';
import { useAuth } from './AuthContext';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface RoleThemes {
  [UserRole.ADMIN]: ThemeColors;
  [UserRole.COACH]: ThemeColors;
  [UserRole.CLIENT]: ThemeColors;
  [UserRole.GUEST]: ThemeColors;
}

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  roleThemes: RoleThemes;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  getCurrentTheme: () => ThemeColors;
}

// Light mode themes
const lightThemes: RoleThemes = {
  [UserRole.ADMIN]: {
    primary: '#3B82F6', // Blue
    primaryHover: '#2563EB',
    primaryLight: '#DBEAFE',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  [UserRole.COACH]: {
    primary: '#10B981', // Green
    primaryHover: '#059669',
    primaryLight: '#D1FAE5',
    secondary: '#6B7280',
    accent: '#3B82F6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  [UserRole.CLIENT]: {
    primary: '#F59E0B', // Orange
    primaryHover: '#D97706',
    primaryLight: '#FEF3C7',
    secondary: '#6B7280',
    accent: '#8B5CF6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  [UserRole.GUEST]: {
    primary: '#6B7280', // Gray
    primaryHover: '#4B5563',
    primaryLight: '#F3F4F6',
    secondary: '#6B7280',
    accent: '#3B82F6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

// Dark mode themes
const darkThemes: RoleThemes = {
  [UserRole.ADMIN]: {
    primary: '#60A5FA', // Blue
    primaryHover: '#3B82F6',
    primaryLight: '#1E3A8A',
    secondary: '#9CA3AF',
    accent: '#34D399',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
  [UserRole.COACH]: {
    primary: '#34D399', // Green
    primaryHover: '#10B981',
    primaryLight: '#064E3B',
    secondary: '#9CA3AF',
    accent: '#60A5FA',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
  [UserRole.CLIENT]: {
    primary: '#FBBF24', // Orange
    primaryHover: '#F59E0B',
    primaryLight: '#78350F',
    secondary: '#9CA3AF',
    accent: '#A78BFA',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
  [UserRole.GUEST]: {
    primary: '#9CA3AF', // Gray
    primaryHover: '#6B7280',
    primaryLight: '#374151',
    secondary: '#9CA3AF',
    accent: '#60A5FA',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load theme mode from localStorage on initialization
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setModeState(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setModeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme mode to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleMode = () => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const getCurrentTheme = (): ThemeColors => {
    const userRole = user?.role || UserRole.GUEST;
    const themes = mode === 'light' ? lightThemes : darkThemes;
    return themes[userRole];
  };

  const colors = getCurrentTheme();
  const roleThemes = mode === 'light' ? lightThemes : darkThemes;

  const value: ThemeContextType = {
    mode,
    colors,
    roleThemes,
    toggleMode,
    setMode,
    getCurrentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to get CSS custom properties for the current theme
export function getThemeCSSProperties(colors: ThemeColors): Record<string, string> {
  return {
    '--color-primary': colors.primary,
    '--color-primary-hover': colors.primaryHover,
    '--color-primary-light': colors.primaryLight,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-surface-hover': colors.surfaceHover,
    '--color-text': colors.text,
    '--color-text-secondary': colors.textSecondary,
    '--color-border': colors.border,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-error': colors.error,
  };
} 