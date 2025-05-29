import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { router } from './routes';
import NotificationContainer from './components/ui/NotificationContainer';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <RouterProvider router={router} />
            <NotificationContainer />
      </div>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
