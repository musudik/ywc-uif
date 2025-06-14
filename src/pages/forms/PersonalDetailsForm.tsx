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
    user_id: '',
    personal_id: '',
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
      let personalIdToLoad = id || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
      
      // If personalIdToLoad is null, check if URL contains a UUID in the path
      // This handles cases where ADMIN/COACHES are editing client details via direct URL
      if (!personalIdToLoad && (user?.role === 'ADMIN' || user?.role === 'COACH')) {
        const currentPath = window.location.pathname;
        // Extract UUID pattern from URL: /dashboard/forms/personal-details/[UUID]
        const uuidRegex = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i;
        const uuidMatch = currentPath.match(uuidRegex);
        if (uuidMatch) {
          personalIdToLoad = uuidMatch[1];
          console.log('Extracted UUID from URL path:', personalIdToLoad);
        }
      }
      
      console.log('Personal ID to load:', personalIdToLoad);
      if (personalIdToLoad) {
        setDataLoading(true);
        try {
          // For all users, use the specific ID to load personal details
          const personalDetails = await formService.getPersonalDetailsById(personalIdToLoad);
          setFormData({
            user_id: personalDetails.user_id,
            personal_id: personalDetails.personal_id,
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
            setExistingPersonalId(personalDetails.user_id);
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

      let personalDetails = await formService.getPersonalDetailsById(formData.user_id);
      
      if (personalDetails.user_id) {
        // Update existing record
        // For CLIENT users updating their own data, use their user.id as personal_id
        const personalIdToUpdate = user?.role === 'CLIENT' && !id && !personalIdFromParams 
          ? user.id 
          : existingPersonalId;
        
        await formService.updatePersonalDetails(personalIdToUpdate, formDataForAPI);
        showSuccess(t('forms.personalDetails.personalUpdated'), t('forms.personalDetails.personalUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode after successful update
      } else {
        // Create new record
        await formService.createPersonalDetails(formDataForAPI);
        showSuccess(t('forms.personalDetails.personalSaved'), t('forms.personalDetails.personalSavedMessage'));
        setExistingPersonalId(formData.user_id);
        setIsEditMode(false); // Return to read-only mode after successful creation
      }
      
      // Navigate based on user role, passing the user_id
      navigate(`/dashboard/forms/family-details?personal_id=${formData.user_id}`);

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
    <div className="container mx-auto p-6 space-y-6">

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('forms.personalDetails.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('forms.personalDetails.basicInformation')}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.salutation')}
                </label>
                <select
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('forms.personalDetails.selectSalutation')}</option>
                  <option value="Mr">{t('forms.personalDetails.mr')}</option>
                  <option value="Ms">{t('forms.personalDetails.ms')}</option>
                  <option value="Dr">{t('forms.personalDetails.dr')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.firstName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.whatsapp')}
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('forms.personalDetails.addressInformation')}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.street')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.houseNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="house_number"
                  value={formData.house_number}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.postalCode')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.city')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.housingSituation')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="housing"
                  value={formData.housing}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Personal Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('forms.personalDetails.personalInformation')}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.dateOfBirth')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.placeOfBirth')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.nationality')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.maritalStatus')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('forms.personalDetails.selectMaritalStatus')}</option>
                  <option value="single">{t('forms.personalDetails.single')}</option>
                  <option value="married">{t('forms.personalDetails.married')}</option>
                  <option value="divorced">{t('forms.personalDetails.divorced')}</option>
                  <option value="widowed">{t('forms.personalDetails.widowed')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.residencePermit')}
                </label>
                <input
                  type="text"
                  name="residence_permit"
                  value={formData.residence_permit}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="eu_citizen"
                  checked={formData.eu_citizen}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.euCitizen')}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('forms.personalDetails.financialInformation')}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.taxId')}
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.personalDetails.iban')}
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
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
    </div>
  );
} 