import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import formSubmissionService, { type FormSubmissionList } from '../../services/formSubmissionService';
import type { FormConfigurationData } from '../../services/configToolService';

// Icon components
const DocumentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function FormsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<FormConfigurationData[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<FormSubmissionList[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load available form configurations
      const formsResponse = await formSubmissionService.getAvailableFormConfigurations();
      if (formsResponse.success && formsResponse.data) {
        setAvailableForms(formsResponse.data);
      } else {
        console.error('Failed to load available forms:', formsResponse.message);
        setAvailableForms([]);
      }

      // Load user's existing submissions
      const submissionsResponse = await formSubmissionService.getUserFormSubmissions(user.id);
      if (submissionsResponse.success && submissionsResponse.data) {
        setUserSubmissions(submissionsResponse.data);
      } else {
        console.error('Failed to load user submissions:', submissionsResponse.message);
        setUserSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error', 'Failed to load forms data');
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = (formConfig: FormConfigurationData) => {
    // Check if user already has a submission for this form
    const existingSubmission = userSubmissions.find(sub => sub.form_config_id === formConfig.config_id);
    
    if (existingSubmission) {
      // Navigate to edit existing submission
      navigate(`/dashboard/forms/dynamic/${existingSubmission.id}`);
    } else {
      // Navigate to create new submission
      navigate(`/dashboard/forms/dynamic/new/${formConfig.config_id}`);
    }
  };

  const handleViewSubmission = (submission: FormSubmissionList) => {
    navigate(`/dashboard/forms/dynamic/${submission.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading forms...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Available Forms
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Fill out forms and track your submissions
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <DocumentIcon className="w-5 h-5" />
              <span>{availableForms.length} forms available</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              <span>{userSubmissions.length} submissions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Forms */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Forms
          </h2>
        </div>
        <div className="p-6">
          {availableForms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DocumentIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No forms available</h3>
              <p className="text-sm">Contact your administrator to configure forms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableForms.map((form) => {
                const existingSubmission = userSubmissions.find(sub => sub.form_config_id === form.config_id);
                
                return (
                  <div key={form.config_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {form.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {form.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                            {form.form_type}
                          </span>
                          <span className="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 px-2 py-1 rounded">
                            v{form.version}
                          </span>
                          <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                            {form.sections.length} sections
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {existingSubmission ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(existingSubmission.status)}`}>
                            {existingSubmission.status.charAt(0).toUpperCase() + existingSubmission.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(existingSubmission)}
                            className="flex-1"
                          >
                            <EyeIcon className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {existingSubmission.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleFillForm(form)}
                              className="flex-1"
                            >
                              Continue
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleFillForm(form)}
                        className="w-full"
                        size="sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Fill Form
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My Submissions */}
      {userSubmissions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Submissions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {userSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {submission.config_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {new Date(submission.created_at).toLocaleDateString()}</span>
                      {submission.submitted_at && (
                        <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 