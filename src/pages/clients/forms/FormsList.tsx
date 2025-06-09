import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/ui/Button';
import formSubmissionService, { type FormSubmissionList } from '../../../services/formSubmissionService';
import type { FormConfigurationList } from '../../../services/configToolService';

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

const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function FormsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<FormConfigurationList[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<FormSubmissionList[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');

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
        console.log('Available form configurations:', formsResponse.data);
        console.log('Form config IDs available:', formsResponse.data.map(form => ({
          id: form.id,
          config_id: form.config_id,
          name: form.name
        })));
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
      showError(t('common.error'), t('forms.dynamic.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = (formConfig: FormConfigurationList) => {
    // Check if user already has a submission for this form
    const existingSubmission = userSubmissions.find(sub => sub.form_config_id === formConfig.id);
    
    if (!existingSubmission) return; // No submission to edit
    
    // Check if this is a joint/dual applicant form
    if (formConfig.applicantconfig === 'joint') {
      // Navigate to new dual form with existing submission data for editing
      navigate(`/dashboard/forms/dual-applicant/edit/${existingSubmission.id}/${formConfig.id}`);
    } else {
      // Navigate to new single form with existing submission data for editing
      navigate(`/dashboard/forms/dynamic/edit/${existingSubmission.id}/${formConfig.id}`);
    }
  };

  const handleCreateNewForm = async (formConfig: FormConfigurationList) => {
    // Check if user already has a submission for this form
    const existingSubmission = userSubmissions.find(sub => sub.form_config_id === formConfig.id);
    
    if (existingSubmission) {
      try {
        // Delete the existing submission
        const deleteResponse = await formSubmissionService.deleteFormSubmission(existingSubmission.id);
        if (!deleteResponse.success) {
          showError(t('common.error'), t('forms.list.deleteError'));
          return;
        }
        
        // Refresh the data to reflect the deletion
        await loadData();
      } catch (error) {
        console.error('Error deleting existing submission:', error);
        showError(t('common.error'), t('forms.list.deleteError'));
        return;
      }
    }
    
    // Navigate to create new form
    if (formConfig.applicantconfig === 'joint') {
      navigate(`/dashboard/forms/dual-applicant/new/${formConfig.id}`);
    } else {
      navigate(`/dashboard/forms/dynamic/new/${formConfig.id}`);
    }
  };

  const handleFillForm = (formConfig: FormConfigurationList) => {
    // Check if user already has a submission for this form
    const existingSubmission = userSubmissions.find(sub => sub.form_config_id === formConfig.id);
    
    console.log("applicantconfig: " + formConfig.applicantconfig);
    console.log("Full form config:", formConfig);
    console.log("About to navigate with config_id:", formConfig.id);
    
    // Debug: Check if this config_id actually exists by trying to fetch it
    console.log("Testing if config_id exists by attempting to fetch it...");
    formSubmissionService.getFormConfiguration(formConfig.id).then(response => {
      if (response.success) {
        console.log("✅ Config ID exists:", formConfig.id);
      } else {
        console.error("❌ Config ID NOT found:", formConfig.id, response.message);
        console.log("Available form configs:", availableForms.map(f => ({
          name: f.name,
          config_id: f.id,
          id: f.id
        })));
      }
    });
    
    // Check if this is a joint/dual applicant form
    if (formConfig.applicantconfig === 'joint') {
      console.log("Redirecting to dual applicant form");
      if (existingSubmission) {
        // Navigate to edit existing dual submission
        navigate(`/dashboard/forms/dual-applicant/${existingSubmission.id}`);
      } else {
        // Navigate to create new dual submission
        navigate(`/dashboard/forms/dual-applicant/new/${formConfig.id}`);
      }
    } else {
      console.log("Redirecting to single applicant form");
      // Handle single applicant forms as before
      if (existingSubmission) {
        // Navigate to edit existing submission
        navigate(`/dashboard/forms/dynamic/${existingSubmission.id}`);
      } else {
        // Navigate to create new submission
        navigate(`/dashboard/forms/dynamic/new/${formConfig.id}`);
      }
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

  // Get selected form and its submission
  const selectedForm = availableForms.find(form => form.id === selectedFormId);
  const selectedFormSubmission = selectedForm ? userSubmissions.find(sub => sub.form_config_id === selectedForm.id) : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">{t('forms.list.loadingForms')}</span>
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
              {t('forms.list.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('forms.list.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <DocumentIcon className="w-5 h-5" />
              <span>{availableForms.length} {t('forms.list.formsAvailable')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              <span>{userSubmissions.length} {t('forms.list.submissions')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('forms.list.availableForms')}
          </h2>
        </div>
        <div className="p-6">
          {availableForms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DocumentIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('forms.list.noForms')}</h3>
              <p className="text-sm">{t('forms.list.noFormsMessage')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form Dropdown */}
              <div>
                <label htmlFor="form-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forms.list.selectForm')}
                </label>
                <div className="relative">
                  <select
                    id="form-select"
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="">{t('forms.list.selectFormPlaceholder')}</option>
                    {availableForms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDownIcon className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Selected Form Details and Actions */}
              {selectedForm && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {selectedForm.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {selectedForm.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full">
                          {selectedForm.form_type}
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 px-3 py-1 rounded-full">
                          v{selectedForm.version}
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full">
                          {selectedForm.sections.length} {t('forms.list.sections')}
                        </span>
                        {selectedForm.applicantconfig === 'joint' && (
                          <span className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400 px-3 py-1 rounded-full">
                            {t('forms.list.dualApplicant')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedFormSubmission ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{t('forms.list.status')}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFormSubmission.status)}`}>
                          {selectedFormSubmission.status.charAt(0).toUpperCase() + selectedFormSubmission.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{t('forms.list.created')} {new Date(selectedFormSubmission.created_at).toLocaleDateString()}</span>
                        {selectedFormSubmission.submitted_at && (
                          <span>{t('forms.list.submitted')} {new Date(selectedFormSubmission.submitted_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewSubmission(selectedFormSubmission)}
                          className="flex items-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          {t('forms.list.view')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCreateNewForm(selectedForm)}
                          className="flex items-center gap-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          {t('forms.list.createNew')}
                        </Button>
                        {selectedFormSubmission.status === 'draft' && (
                          <Button
                            onClick={() => handleFillForm(selectedForm)}
                            className="flex items-center gap-2"
                          >
                            <EditIcon className="w-4 h-4" />
                            {t('forms.list.continue')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        onClick={() => handleFillForm(selectedForm)}
                        className="flex items-center gap-2"
                        size="lg"
                      >
                        <PlusIcon className="w-5 h-5" />
                        {t('forms.list.createForm')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* My Submissions */}
      {userSubmissions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('forms.list.mySubmissions')} ({userSubmissions.length} {userSubmissions.length === 1 ? 'submission' : 'submissions'})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {userSubmissions.map((submission) => {
                // Find the corresponding form configuration
                const formConfig = availableForms.find(form => form.id === submission.form_config_id);
                const formName = formConfig?.name || `Form Submission (ID: ${submission.form_config_id})`;
                const formType = formConfig?.form_type || 'Unknown Form Type';
                

                
                return (
                  <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {formName}
                      </h3>
                      {formType && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formType}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{t('forms.list.created')} {new Date(submission.created_at).toLocaleDateString()}</span>
                        {submission.submitted_at && (
                          <span>{t('forms.list.submitted')} {new Date(submission.submitted_at).toLocaleDateString()}</span>
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
                      {t('forms.list.view')}
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Show message when no submissions */}
      {!loading && userSubmissions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('forms.list.mySubmissions')}
            </h2>
          </div>
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <DocumentIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Form Submissions</h3>
            <p className="text-sm">You haven't submitted any forms yet. Select a form above to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
} 