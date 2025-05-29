import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleRoutes } from '../../routes';
import Button from '../../components/ui/Button';

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth();
  
  const homeLink = isAuthenticated && user ? roleRoutes[user.role] : '/auth/login';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link to={homeLink}>
            <Button fullWidth>
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" fullWidth>
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
} 