import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detailed view of client: {clientId}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back to Clients
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Client Profile Details
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Complete client profile with financial information and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
} 