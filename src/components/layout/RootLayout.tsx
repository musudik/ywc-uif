import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme, getThemeCSSProperties } from '../../context/ThemeContext';
import ErrorBoundary from '../ui/ErrorBoundary';

export default function RootLayout() {
  const { colors } = useTheme();

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen transition-colors duration-200"
        style={getThemeCSSProperties(colors)}
      >
        <Outlet />
      </div>
    </ErrorBoundary>
  );
} 