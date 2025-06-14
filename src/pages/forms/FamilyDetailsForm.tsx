import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { FamilyMember, FamilyRelation } from '../../types';
import { formatDateForInput } from '../../utils/dateUtils';

interface FamilyMemberFormData {
  user_id: string;
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
    user_id: '',
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
      user_id: '',
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
      user_id: member.user_id,
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
    navigate(`/dashboard/forms/employment?personal_id=${userIdToUse}`);
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
              {t('forms.familyDetails.title')}
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

      {/* Family Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.familyDetails.familyMembers')}
              </h3>
            </div>
            {!isEditMode && (
              <Button onClick={handleEdit} variant="outline">
                {t('forms.familyDetails.addMember')}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {familyMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('forms.familyDetails.noMembers')}
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((member, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                      {t('forms.familyDetails.name')}: {member.first_name} {member.last_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('forms.familyDetails.relation')}: {t(`forms.familyDetails.${member.relation.toLowerCase()}`)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('forms.familyDetails.birthDateRequired')}: {formatDateForInput(member.birth_date)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('forms.familyDetails.nationalityRequired')}: {member.nationality}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('forms.familyDetails.taxIdOptional')}: {member.tax_id}
                      </p>
                    </div>
                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMember(member.family_member_id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Family Member Form */}
      {isEditMode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {editingMemberId === null ? t('forms.familyDetails.addMember') : t('forms.familyDetails.editMember')}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.familyDetails.firstNameRequired')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.familyDetails.lastNameRequired')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.familyDetails.relation')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('forms.familyDetails.selectRelation')}</option>
                  <option value="Spouse">{t('forms.familyDetails.spouse')}</option>
                  <option value="Child">{t('forms.familyDetails.child')}</option>
                  <option value="Parent">{t('forms.familyDetails.parent')}</option>
                  <option value="Other">{t('forms.familyDetails.other')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.familyDetails.birthDateRequired')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t('forms.familyDetails.nationalityRequired')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 