import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { FamilyMember, FamilyRelation } from '../../types';

interface FamilyMemberFormData {
  first_name: string;
  last_name: string;
  relation: FamilyRelation;
  birth_date: string;
  nationality: string;
  tax_id: string;
}

export default function FamilyDetailsForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<FamilyMemberFormData>({
    first_name: '',
    last_name: '',
    relation: 'Spouse',
    birth_date: '',
    nationality: '',
    tax_id: '',
  });

  const relationOptions = [
    { value: 'Spouse', label: t('forms.familyDetails.spouse') },
    { value: 'Child', label: t('forms.familyDetails.child') },
    { value: 'Parent', label: t('forms.familyDetails.parent') },
    { value: 'Other', label: t('forms.familyDetails.other') },
  ];

  useEffect(() => {
    loadFamilyMembers();
  }, [personalId, personalIdFromParams, user?.id, user?.role]);

  const getUserId = () => {
    return personalId || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
  };

  const loadFamilyMembers = async () => {
    const userIdToLoad = getUserId();
    
    if (userIdToLoad) {
      setDataLoading(true);
      try {
        const members = await formService.getFamilyMembersByUserId(userIdToLoad);
        setFamilyMembers(members);
        setIsEditMode(members.length === 0); // Start in edit mode if no members exist
      } catch (error) {
        console.log('No existing family members found');
        setFamilyMembers([]);
        setIsEditMode(true); // No data exists, start in edit mode
      } finally {
        setDataLoading(false);
      }
    } else {
      setIsEditMode(true); // No personalId available, start in edit mode
    }
  };

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
    if (familyMembers.length > 0) {
      setIsEditMode(false); // Go back to read-only mode
      setShowAddForm(false);
      setEditingMemberId(null);
      resetForm();
    } else {
      navigate(-1); // Navigate away if no data
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      relation: 'Spouse',
      birth_date: '',
      nationality: '',
      tax_id: '',
    });
  };

  const handleAddMember = () => {
    setShowAddForm(true);
    setEditingMemberId(null);
    resetForm();
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMemberId(member.family_member_id);
    setShowAddForm(true);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      relation: member.relation,
      birth_date: member.birth_date.split('T')[0], // Convert to YYYY-MM-DD format
      nationality: member.nationality,
      tax_id: member.tax_id || '',
    });
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm(t('forms.familyDetails.confirmDelete'))) {
      try {
        await formService.deleteFamilyMember(memberId);
        showSuccess(t('forms.familyDetails.familyMemberDeleted'), t('forms.familyDetails.familyMemberDeletedMessage'));
        loadFamilyMembers(); // Reload the list
      } catch (error) {
        showError(t('notifications.deleteFailed'), error instanceof Error ? error.message : 'Failed to delete family member');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userIdToUse = getUserId();
      
      if (!userIdToUse) {
        showError(t('forms.familyDetails.missingInfo'), 'Unable to determine user ID for family member record.');
        return;
      }

      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.nationality) {
        showError(t('forms.familyDetails.missingInfo'), t('forms.familyDetails.fillRequiredFields'));
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse,
        tax_id: formData.tax_id || undefined, // Convert empty string to undefined
      };

      if (editingMemberId) {
        // Update existing family member
        await formService.updateFamilyMember(editingMemberId, formDataForAPI);
        showSuccess(t('forms.familyDetails.familyMemberUpdated'), t('forms.familyDetails.familyMemberUpdatedMessage'));
      } else {
        // Create new family member
        await formService.createFamilyMember(formDataForAPI);
        showSuccess(t('forms.familyDetails.familyMemberAdded'), t('forms.familyDetails.familyMemberAddedMessage'));
      }
      
      setShowAddForm(false);
      setEditingMemberId(null);
      resetForm();
      loadFamilyMembers(); // Reload the list
      
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save family member details');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setIsEditMode(false);
    
    // Navigate to the next form based on user role
    const userIdToUse = getUserId();
    if (user?.role === 'CLIENT') {
      navigate(`/dashboard/forms/employment?personal_id=${userIdToUse}`);
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
                {t('forms.familyDetails.title')} {familyMembers.length > 0 ? (isEditMode ? t('forms.familyDetails.editing') : t('forms.familyDetails.viewing')) : t('forms.familyDetails.new')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? t('forms.familyDetails.subtitle')
                  : t('forms.familyDetails.viewSubtitle')
                }
              </p>
            </div>
            {!isEditMode && familyMembers.length > 0 && (
              <Button onClick={handleEdit} variant="outline">
                {t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Family Members List */}
          {familyMembers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Family Members ({familyMembers.length})
              </h3>
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.family_member_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Relation: {member.relation}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Birth Date: {new Date(member.birth_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Nationality: {member.nationality}
                            </p>
                          </div>
                          <div>
                            {member.tax_id && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tax ID: {member.tax_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {isEditMode && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMember(member)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMember(member.family_member_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Family Member Button */}
          {isEditMode && !showAddForm && (
            <div className="mb-6">
              <Button onClick={handleAddMember} variant="outline" className="w-full">
                + Add Family Member
              </Button>
            </div>
          )}

          {/* Add/Edit Family Member Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="space-y-6 border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingMemberId ? 'Edit Family Member' : 'Add New Family Member'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="First Name *"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                />

                <TextInput
                  label="Last Name *"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                />

                <div className="md:col-span-2">
                  <label htmlFor="relation" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Relation *
                  </label>
                  <select
                    id="relation"
                    name="relation"
                    value={formData.relation}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                  >
                    {relationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <TextInput
                  label="Birth Date *"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  required
                />

                <TextInput
                  label="Nationality *"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter nationality"
                />

                <TextInput
                  label="Tax ID"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  placeholder="Enter tax ID (optional)"
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" loading={loading}>
                  {editingMemberId ? 'Update Member' : 'Add Member'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMemberId(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              {familyMembers.length > 0 && !isEditMode ? 'Back' : 'Cancel'}
            </Button>

            {!isEditMode && familyMembers.length > 0 && (
              <Button onClick={handleContinue}>
                Continue to Employment Details
              </Button>
            )}

            {isEditMode && !showAddForm && familyMembers.length > 0 && (
              <Button onClick={handleContinue}>
                Save & Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 