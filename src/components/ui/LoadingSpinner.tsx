import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  fullScreen = false,
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]}`}
        style={{ borderTopColor: colors.primary }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    );
  }

  return spinner;
} 