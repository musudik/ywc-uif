import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `.trim();

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `
          text-white
          border border-transparent
          hover:opacity-90
          focus:ring-offset-2
        `;
      case 'secondary':
        return `
          text-gray-700 dark:text-gray-300
          bg-gray-100 dark:bg-gray-700
          border border-gray-300 dark:border-gray-600
          hover:bg-gray-200 dark:hover:bg-gray-600
          focus:ring-gray-500
        `;
      case 'outline':
        return `
          border-2
          bg-transparent
          hover:bg-opacity-10
          focus:ring-offset-2
        `;
      case 'ghost':
        return `
          text-gray-700 dark:text-gray-300
          bg-transparent
          border border-transparent
          hover:bg-gray-100 dark:hover:bg-gray-700
          focus:ring-gray-500
        `;
      case 'danger':
        return `
          text-white
          bg-red-600
          border border-transparent
          hover:bg-red-700
          focus:ring-red-500
          focus:ring-offset-2
        `;
      default:
        return '';
    }
  };

  const getStyleProps = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };
    }
    if (variant === 'outline') {
      return {
        borderColor: colors.primary,
        color: colors.primary,
      };
    }
    return {};
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
      style={getStyleProps()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
} 