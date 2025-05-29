import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleRoutes } from '../../routes';
import Button from '../../components/ui/Button';

export default function UnauthorizedPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const homeLink = isAuthenticated && user ? roleRoutes[user.role] : '/auth/login';

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Insufficient Permissions
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                {user && (
                  <>
                    You are logged in as a <strong>{user.role}</strong>. 
                    This page requires higher privileges.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link to={homeLink}>
            <Button fullWidth>
              {isAuthenticated ? 'Go to My Dashboard' : 'Go to Login'}
            </Button>
          </Link>
          
          <button onClick={() => window.history.back()}>
            <Button variant="outline" fullWidth>
              Go Back
            </Button>
          </button>

          {isAuthenticated && (
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/10"
            >
              Sign Out
            </Button>
          )}
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe you should have access, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
} 