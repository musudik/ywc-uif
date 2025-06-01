import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import { authService } from '../../services/authService';
import { formatDateForInput, formatDateForAPI } from '../../utils/dateUtils';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { ApplicantType } from '../../types';

export default function PersonalDetailsForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams(); // Optional ID parameter for editing
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id'); // Personal ID from URL params
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingPersonalId, setExistingPersonalId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<Array<{ 
    user_id: string; 
    first_name: string; 
    last_name: string; 
    email: string; 
    applicant_type: string; 
    created_at: string; 
  }>>([]);
  
  // Determine the correct coach_id based on user role
  const getCoachId = () => {
    if (!user) return '';
    
    switch (user.role) {
      case 'CLIENT':
        // For clients, use their assigned coach_id
        return user.coach_id || '';
      case 'COACH':
        // For coaches creating client details, use their own ID
        return user.id;
      case 'ADMIN':
        // For admins, they need to select a coach
        return '';
      default:
        return '';
    }
  };
  
  const [formData, setFormData] = useState({
    coach_id: getCoachId(),
    applicant_type: 'PrimaryApplicant' as ApplicantType,
    salutation: '',
    first_name: '',
    last_name: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    email: '',
    phone: '',
    whatsapp: '',
    marital_status: '',
    birth_date: '',
    birth_place: '',
    nationality: '',
    residence_permit: '',
    eu_citizen: false,
    tax_id: '',
    iban: '',
    housing: '',
  });

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const personalIdToLoad = id || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
      
      if (personalIdToLoad) {
        setDataLoading(true);
        try {
          // For all users, use the specific ID to load personal details
          const personalDetails = await formService.getPersonalDetailsById(personalIdToLoad);
          setFormData({
            coach_id: personalDetails.coach_id,
            applicant_type: personalDetails.applicant_type,
            salutation: personalDetails.salutation,
            first_name: personalDetails.first_name,
            last_name: personalDetails.last_name,
            street: personalDetails.street,
            house_number: personalDetails.house_number,
            postal_code: personalDetails.postal_code,
            city: personalDetails.city,
            email: personalDetails.email,
            phone: personalDetails.phone,
            whatsapp: personalDetails.whatsapp || '',
            marital_status: personalDetails.marital_status,
            birth_date: formatDateForInput(personalDetails.birth_date),
            birth_place: personalDetails.birth_place,
            nationality: personalDetails.nationality,
            residence_permit: personalDetails.residence_permit || '',
            eu_citizen: personalDetails.eu_citizen,
            tax_id: personalDetails.tax_id,
            iban: personalDetails.iban,
            housing: personalDetails.housing,
          });
          
          // For CLIENT users accessing their own data, use their user.id as personal_id
          if (user?.role === 'CLIENT' && !id && !personalIdFromParams) {
            setExistingPersonalId(user.id);
          } else {
            setExistingPersonalId(personalDetails.personal_id);
          }
          setIsEditMode(false); // Data exists, start in read-only mode
        } catch (error) {
          console.error('Failed to load personal details:', error);
          // If loading fails, continue with empty form (might be a new user)
          console.log('No existing personal details found, starting with empty form');
          // For CLIENT users, set their user_id as the personal_id for creation
          if (user?.role === 'CLIENT') {
            setExistingPersonalId(user.id);
          }
          // No data exists, start in edit mode
          setIsEditMode(true);
        } finally {
          setDataLoading(false);
        }
      } else {
        // No personalId available, start in edit mode for new users
        // For CLIENT users, set their user_id as the personal_id for creation
        if (user?.role === 'CLIENT') {
          setExistingPersonalId(user.id);
        }
        setIsEditMode(true);
      }
    };

    loadExistingData();
  }, [id, personalIdFromParams, user?.id, user?.role]);

  // Load available coaches for ADMIN users
  useEffect(() => {
    const loadCoaches = async () => {
      if (user?.role === 'ADMIN') {
        try {
          // For now, we'll use the getCoachClients endpoint to get coach info
          // In a real implementation, there should be a separate endpoint to get all coaches
          const coaches = await authService.getCoachClients();
          setAvailableCoaches(coaches);
        } catch (error) {
          console.log('Could not load available coaches:', error);
        }
      }
    };

    loadCoaches();
  }, [user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (existingPersonalId) {
      // If data exists, go back to read-only mode
      setIsEditMode(false);
      // Optionally reload data to reset any unsaved changes
    } else {
      // If no data exists, navigate away
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate coach_id is set
      if (!formData.coach_id) {
        if (user?.role === 'ADMIN') {
          showError(t('notifications.error'), 'Please select a coach to assign this client to.');
          return;
        } else if (user?.role === 'CLIENT' && !user?.coach_id) {
          showError(t('notifications.error'), 'Your account is not assigned to a coach. Please contact an administrator.');
          return;
        } else if (user?.role === 'COACH') {
          // Auto-assign coach for COACH users
          setFormData(prev => ({ ...prev, coach_id: user.id }));
        }
      }

      // Format date for API
      const formDataForAPI = {
        ...formData,
        birth_date: formatDateForAPI(formData.birth_date)
      };

      let personalDetails;
      
      if (existingPersonalId) {
        // Update existing record
        // For CLIENT users updating their own data, use their user.id as personal_id
        const personalIdToUpdate = user?.role === 'CLIENT' && !id && !personalIdFromParams 
          ? user.id 
          : existingPersonalId;
        
        personalDetails = await formService.updatePersonalDetails(personalIdToUpdate, formDataForAPI);
        showSuccess(t('forms.personalDetails.personalUpdated'), t('forms.personalDetails.personalUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode after successful update
      } else {
        // Create new record
        personalDetails = await formService.createPersonalDetails(formDataForAPI);
        showSuccess(t('forms.personalDetails.personalSaved'), t('forms.personalDetails.personalSavedMessage'));
        setExistingPersonalId(personalDetails.personal_id);
        setIsEditMode(false); // Return to read-only mode after successful creation
      }
      
      // Navigate based on user role, passing the personal_id
      if (user?.role === 'CLIENT') {
        navigate(`/dashboard/forms/family-details?personal_id=${personalDetails.personal_id}`);
      } else {
        // For coaches/admins, stay on the form in read-only mode
        // navigate('/dashboard');
      }
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save personal details');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center justify-center">
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
                {t('forms.personalDetails.title')} {existingPersonalId ? (isEditMode ? t('forms.personalDetails.editing') : t('forms.personalDetails.viewing')) : t('forms.personalDetails.new')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? existingPersonalId 
                    ? t('forms.personalDetails.updateInfo')
                    : t('forms.personalDetails.subtitle')
                  : t('forms.personalDetails.viewInfo')
                }
              </p>
            </div>
            {!isEditMode && existingPersonalId && (
              <Button onClick={handleEdit} variant="outline">
                {t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('forms.personalDetails.applicantType')} <span className="text-red-500">*</span>
              </label>
              <select
                name="applicant_type"
                value={formData.applicant_type}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
              >
                <option value="PrimaryApplicant">{t('forms.personalDetails.primaryApplicant')}</option>
                <option value="SecondaryApplicant">{t('forms.personalDetails.secondaryApplicant')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('forms.personalDetails.salutation')} <span className="text-red-500">*</span>
              </label>
              <select
                name="salutation"
                value={formData.salutation}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
              >
                <option value="">{t('forms.personalDetails.selectSalutation')}</option>
                <option value="Mr">Mr.</option>
                <option value="Mrs">Mrs.</option>
                <option value="Ms">Ms.</option>
                <option value="Dr">Dr.</option>
                <option value="Prof">Prof.</option>
              </select>
            </div>

            <TextInput
              label={t('forms.personalDetails.firstName')}
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder={t('placeholders.enterFirstName')}
            />

            <TextInput
              label={t('forms.personalDetails.lastName')}
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder={t('placeholders.enterLastName')}
            />

            <TextInput
              label={t('forms.personalDetails.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder={t('placeholders.enterEmail')}
            />

            <TextInput
              label={t('forms.personalDetails.phone')}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder={t('placeholders.enterPhone')}
            />

            <TextInput
              label={t('forms.personalDetails.whatsapp')}
              name="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={handleInputChange}
              disabled={!isEditMode}
              placeholder={t('placeholders.enterWhatsApp')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('forms.personalDetails.maritalStatus')} <span className="text-red-500">*</span>
              </label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
              >
                <option value="">{t('forms.personalDetails.selectMaritalStatus')}</option>
                <option value="single">{t('forms.personalDetails.single')}</option>
                <option value="married">{t('forms.personalDetails.married')}</option>
                <option value="divorced">{t('forms.personalDetails.divorced')}</option>
                <option value="widowed">{t('forms.personalDetails.widowed')}</option>
                <option value="separated">{t('forms.personalDetails.separated')}</option>
              </select>
            </div>
          </div>

          {/* Coach Assignment (for ADMIN users) */}
          {user?.role === 'ADMIN' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('forms.personalDetails.coachAssignment')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('forms.personalDetails.assignedCoach')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="coach_id"
                    value={formData.coach_id}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                  >
                    <option value="">{t('forms.personalDetails.selectCoach')}</option>
                    {availableCoaches.map((coach) => (
                      <option key={coach.user_id} value={coach.user_id}>
                        {coach.first_name} {coach.last_name}
                      </option>
                    ))}
                  </select>
                  {!formData.coach_id && isEditMode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Please select a coach to assign this client to.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('forms.personalDetails.addressInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label={t('forms.personalDetails.street')}
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder={t('placeholders.enterStreet')}
              />

              <TextInput
                label={t('forms.personalDetails.houseNumber')}
                name="house_number"
                value={formData.house_number}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder={t('placeholders.enterHouseNumber')}
              />

              <TextInput
                label={t('forms.personalDetails.postalCode')}
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder={t('placeholders.enterPostalCode')}
              />

              <TextInput
                label={t('forms.personalDetails.city')}
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder={t('placeholders.enterCity')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('forms.personalDetails.housingSituation')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="housing"
                  value={formData.housing}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                >
                  <option value="">{t('forms.personalDetails.selectHousingSituation')}</option>
                  <option value="Owner">{t('forms.personalDetails.owner')}</option>
                  <option value="Renter">{t('forms.personalDetails.renter')}</option>
                  <option value="Living with family">{t('forms.personalDetails.livingWithFamily')}</option>
                  <option value="Other">{t('forms.personalDetails.other')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Date of Birth"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
              />

              <TextInput
                label="Place of Birth"
                name="birth_place"
                value={formData.birth_place}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder="Enter your place of birth"
              />

              <TextInput
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder="Enter your nationality"
              />

              <TextInput
                label="Residence Permit"
                name="residence_permit"
                value={formData.residence_permit}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Enter residence permit number (if applicable)"
              />

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="eu_citizen"
                  name="eu_citizen"
                  checked={formData.eu_citizen}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                />
                <label htmlFor="eu_citizen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  EU Citizen
                </label>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Tax ID"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder="Enter your tax ID"
              />

              <TextInput
                label="IBAN"
                name="iban"
                value={formData.iban}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                placeholder="Enter your IBAN"
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
              {existingPersonalId && !isEditMode ? 'Back' : 'Cancel'}
            </Button>

            {isEditMode && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  size="sm"
                  className="px-4 py-2"
                >
                  {existingPersonalId ? 'Update' : 'Save'}
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
                    Save & Continue
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