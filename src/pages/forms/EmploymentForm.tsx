import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import { formatDateForInput, formatDateForAPI } from '../../utils/dateUtils';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { EmploymentType } from '../../types';

export default function EmploymentForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingEmploymentId, setExistingEmploymentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    employment_type: 'PrimaryEmployment' as EmploymentType,
    occupation: '',
    contract_type: '',
    contract_duration: '',
    employer_name: '',
    employed_since: '',
  });

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userId = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (userId) {
        setDataLoading(true);
        try {
          const employmentDetails = await formService.getEmploymentById(userId);
          console.log('employmentDetails', employmentDetails);
          if (employmentDetails) {
            setFormData({
              employment_type: employmentDetails.employment_type,
              occupation: employmentDetails.occupation,
              contract_type: employmentDetails.contract_type,
              contract_duration: employmentDetails.contract_duration,
              employer_name: employmentDetails.employer_name,
              employed_since: formatDateForInput(employmentDetails.employed_since),
            });
            setExistingEmploymentId(employmentDetails.employment_id);
            setIsEditMode(false); // Data exists, start in read-only mode
          } else {
            setIsEditMode(true); // No data exists, start in edit mode
          }
        } catch (error) {
          console.log('No existing employment details found, starting with empty form');
          setIsEditMode(true); // No data exists, start in edit mode
        } finally {
          setDataLoading(false);
        }
      } else {
        setIsEditMode(true); // No personalId available, start in edit mode
      }
    };

    loadExistingData();
  }, [user?.id, user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (existingEmploymentId) {
      setIsEditMode(false); // Go back to read-only mode
    } else {
      navigate(-1); // Navigate away if no data
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine the user_id to use
      const userIdToUse = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (!userIdToUse) {
        showError('Missing Information', 'Unable to determine user ID for employment record.');
        return;
      }

      // Format date for API and add user_id
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse,
        employed_since: formatDateForAPI(formData.employed_since)
      };

      let employmentDetails;
      
      if (existingEmploymentId) {
        // Update existing record
        employmentDetails = await formService.updateEmployment(existingEmploymentId, formDataForAPI);
        showSuccess(t('forms.employment.employmentUpdated'), t('forms.employment.employmentUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        employmentDetails = await formService.createEmployment(formDataForAPI);
        showSuccess(t('forms.employment.employmentSaved'), t('forms.employment.employmentSavedMessage'));
        setExistingEmploymentId(employmentDetails.employment_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      if (user?.role === 'CLIENT') {
        navigate(`/dashboard/forms/income?personal_id=${userIdToUse}`);
      }
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save employment details');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="animate-in">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('forms.employment.title')} {existingEmploymentId ? (isEditMode ? t('forms.employment.editing') : t('forms.employment.viewing')) : t('forms.employment.new')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? existingEmploymentId 
                    ? t('forms.employment.updateInfo')
                    : t('forms.employment.subtitle')
                  : t('forms.employment.viewInfo')
                }
              </p>
            </div>
            {!isEditMode && existingEmploymentId && (
              <Button onClick={handleEdit} variant="outline">
                {t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('forms.employment.employmentType')} <span className="text-red-500">*</span>
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
              >
                <option value="PrimaryEmployment">{t('forms.employment.primaryEmployment')}</option>
                <option value="SecondaryEmployment">{t('forms.employment.secondaryEmployment')}</option>
              </select>
            </div>

            <TextInput
              label={t('forms.employment.occupation')}
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder={t('placeholders.enterJobTitleOccupation')}
            />
          </div>

          {/* Job Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('forms.employment.jobDetails')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label={t('forms.employment.employerName')}
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder={t('placeholders.enterEmployersName')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forms.employment.contractType')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                >
                  <option value="">{t('forms.employment.selectContractType')}</option>
                  <option value="Permanent">{t('forms.employment.permanent')}</option>
                  <option value="Temporary">{t('forms.employment.temporary')}</option>
                  <option value="Fixed-term">{t('forms.employment.fixedTerm')}</option>
                  <option value="Freelance">{t('forms.employment.freelance')}</option>
                  <option value="Part-time">{t('forms.employment.partTime')}</option>
                  <option value="Full-time">{t('forms.employment.fullTime')}</option>
                </select>
              </div>

              <TextInput
                label={t('forms.employment.contractDuration')}
                name="contract_duration"
                value={formData.contract_duration}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('placeholders.enterContractDuration')}
              />

              <TextInput
                label={t('forms.employment.employedSince')}
                name="employed_since"
                type="date"
                value={formData.employed_since}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="px-4 py-2"
            >
              {existingEmploymentId && !isEditMode ? t('common.back') : t('common.cancel')}
            </Button>

            {isEditMode && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  size="sm"
                  className="px-4 py-2"
                >
                  {existingEmploymentId ? t('common.update') : t('common.save')}
                </Button>
                
                {user?.role === 'CLIENT' && (
                  <Button
                    type="submit"
                    loading={loading}
                    variant="secondary"
                    size="sm"
                    className="px-4 py-2"
                    onClick={() => {
                      // This will trigger form submission and then navigate to next form
                    }}
                  >
                    {t('placeholders.saveContinue')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 