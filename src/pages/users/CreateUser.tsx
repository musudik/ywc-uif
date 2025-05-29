import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function CreateUser() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New User
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Add a new user to the system with appropriate role and permissions.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Create User Form
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This form will allow you to create new system users and assign them roles (Admin, Coach, or Client).
          </p>
          <Button onClick={() => navigate('/dashboard/users')}>
            Back to User Management
          </Button>
        </div>
      </div>
    </div>
  );
} 