import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import { formatDateForInput, formatDateForAPI } from '../../utils/dateUtils';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { EmploymentType } from '../../types';

interface EmploymentFormData {
  user_id: string;
  employment_type: EmploymentType;
  occupation: string;
  contract_type: string;
  contract_duration: string;
  employer_name: string;
  employed_since: string;
  employer_address?: string;
  employer_phone?: string;
}

export default function EmploymentForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingEmploymentId, setExistingEmploymentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [formData, setFormData] = useState({
    user_id: '',
    employment_type: 'PrimaryEmployment' as EmploymentType,
    occupation: '',
    contract_type: '',
    contract_duration: '',
    employer_name: '',
    employed_since: '',
    employer_address: '',
    employer_phone: '',
  });

  const resetFormData = () => {
    setFormData({
      user_id: '',
      employment_type: 'PrimaryEmployment' as EmploymentType,
      occupation: '',
      contract_type: '',
      contract_duration: '',
      employer_name: '',
      employed_since: '',
      employer_address: '',
      employer_phone: '',
    });
  };

  useEffect(() => {
    loadExistingData(); 
  }, [user?.id, user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getUserId = () => {
    return formData.user_id || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
  };

  const loadExistingData = async () => {
    console.log('loadExistingData');
    // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
    const userId = getUserId();
    console.log('userId', userId);
    
    if (userId) {
      setDataLoading(true);
      try {
        const employmentDetails = await formService.getEmploymentById(userId);
        console.log('employmentDetails', employmentDetails);
        if (employmentDetails) {
          setFormData({
            user_id: employmentDetails.user_id,
            employment_type: employmentDetails.employment_type,
            occupation: employmentDetails.occupation,
            contract_type: employmentDetails.contract_type,
            contract_duration: employmentDetails.contract_duration,
            employer_name: employmentDetails.employer_name,
            employed_since: formatDateForInput(employmentDetails.employed_since),
            employer_address: employmentDetails.employer_address,
            employer_phone: employmentDetails.employer_phone,
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

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (existingEmploymentId) {
      setIsEditMode(false); // Go back to read-only mode
      resetFormData();
    } else {
      navigate(-1); // Navigate away if no data
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine the user_id to use
      const userIdToUse = formData.user_id;
      
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
      navigate(`/dashboard/forms/income?personal_id=${userIdToUse}`);
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('forms.employment.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <Button variant="outline" onClick={handleEdit}>
                {t('common.edit')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? t('common.saving') : t('common.save')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Employment Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.employment.employmentDetails')}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.employment.occupation')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.employment.occupationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.employment.contractType')} <span className="text-red-500">*</span>
              </label>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.employment.employerName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.employment.employerNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.employment.employedSince')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="employed_since"
                value={formData.employed_since}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 