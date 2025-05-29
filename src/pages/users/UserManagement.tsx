import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all system users including admins, coaches, and clients.
          </p>
        </div>
        <Link to="/dashboard/users/create">
          <Button>Create New User</Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            System User Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page will provide comprehensive user management capabilities including role assignment, permissions, and account management.
          </p>
          <div className="flex justify-center space-x-3">
            <Link to="/dashboard/users/create">
              <Button>Create User</Button>
            </Link>
            <Button variant="outline">Import Users</Button>
          </div>
        </div>
      </div>
    </div>
  );
} 