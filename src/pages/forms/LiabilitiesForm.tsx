import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { Liability, LoanType } from '../../types';

export default function LiabilitiesForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    loan_type: 'PersonalLoan' as LoanType,
    loan_bank: '',
    loan_amount: 0,
    loan_monthly_rate: 0,
    loan_interest: 0,
  });

  const getUserId = () => {
    return personalId || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
  };

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userIdToLoad = getUserId();
      
      if (userIdToLoad) {
        setDataLoading(true);
        try {
          const liabilitiesDetailsList = await formService.getLiabilitiesByUserId(userIdToLoad);  
          if (liabilitiesDetailsList) {
            const liabilitiesDetails = liabilitiesDetailsList[0];
            setFormData({
              user_id: liabilitiesDetails.user_id,
              loan_type: liabilitiesDetails.loan_type,
              loan_bank: liabilitiesDetails.loan_bank,
              loan_amount: liabilitiesDetails.loan_amount,
              loan_monthly_rate: liabilitiesDetails.loan_monthly_rate,
              loan_interest: liabilitiesDetails.loan_interest,
            });
            setLiabilities(liabilitiesDetailsList); 
            setIsEditMode(false); // Data exists, start in read-only mode
          } else {
            setIsEditMode(true); // No data exists, start in edit mode
          }
        } catch (error) {
          console.log('No existing liabilities found, starting with empty form');
          setIsEditMode(true); // No data exists, start in edit mode
        } finally {
          setDataLoading(false);
        }
      } else {
        setIsEditMode(true); // No personalId available, start in edit mode
      }
    };

    loadExistingData();
  }, [personalId, personalIdFromParams, user?.id, user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (liabilities.length > 0) {
      setIsEditMode(false); // Go back to read-only mode
    } else {
      navigate(-1); // Navigate away if no data
    }
  };

  const addLiability = async () => {
    if (!formData.loan_type || !formData.loan_bank) {
      showError(t('forms.liabilities.missingInfo'), 'Please fill in loan type and bank before adding.');
      return;
    }

    setLoading(true);
    try {
      // Determine the user_id to use
      const userIdToUse = personalId || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
      
      if (!userIdToUse) {
        showError(t('notifications.error'), 'Unable to determine user ID for liability record.');
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse
      };

      const newLiability = await formService.createLiability(formDataForAPI);
      setLiabilities(prev => [...prev, newLiability]);
      
      // Reset form for next entry
      setFormData({
        user_id: '',
        loan_type: 'PersonalLoan' as LoanType,
        loan_bank: '',
        loan_amount: 0,
        loan_monthly_rate: 0,
        loan_interest: 0,
      });
      
      showSuccess(t('forms.liabilities.liabilitiesSaved'), t('forms.liabilities.liabilitiesSavedMessage'));
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to add liability');
    } finally {
      setLoading(false);
    }
  };

  const removeLiability = async (liabilityId: string) => {
    setLoading(true);
    try {
      await formService.deleteLiability(liabilityId);
      setLiabilities(prev => prev.filter(l => l.liability_id !== liabilityId));
      showSuccess(t('forms.liabilities.liabilitiesUpdated'), t('forms.liabilities.liabilitiesUpdatedMessage'));
    } catch (error) {
      showError(t('notifications.deleteFailed'), error instanceof Error ? error.message : 'Failed to remove liability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (liabilities.length === 0) {
      showError(t('notifications.error'), 'Please add at least one liability or skip this step.');
      return;
    }
    
    const userIdToUse = getUserId();
    
    // Add user_id to form data
    const formDataForAPI = {
      ...formData,
      user_id: userIdToUse,
      loan_type: formData.loan_type,
      loan_bank: formData.loan_bank,
      loan_amount: formData.loan_amount,
      loan_monthly_rate: formData.loan_monthly_rate,
      loan_interest: formData.loan_interest,
    };

    //save or update liabilities
    if (formData.user_id) {
      await formService.updateLiability(formData.user_id, formDataForAPI);
      showSuccess(t('forms.liabilities.liabilitiesUpdated'), t('forms.liabilities.liabilitiesUpdatedMessage'));
    } else {
      await formService.createLiability(formDataForAPI);
      showSuccess(t('forms.liabilities.liabilitiesSaved'), t('forms.liabilities.liabilitiesSavedMessage'));
    }

    setIsEditMode(false); // Return to read-only mode
    
    // Navigate based on user role
    navigate('/dashboard');
  };

  const handleSkip = () => {
    showSuccess(t('notifications.success'), 'You can add liabilities later if needed.');
    setIsEditMode(false);
    navigate('/dashboard');
  };

  if (dataLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
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
              {t('forms.liabilities.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('forms.liabilities.description')}
            </p>
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
      {/* Liabilities List and Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.liabilities.title')}
              </h3>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Existing Liabilities List */}
          {liabilities.length > 0 && (
            <div>
              <div className="space-y-4">
                {liabilities.map((liability, index) => (
                  <div key={liability.liability_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('forms.liabilities.loanType')}:</span>
                            <p className="text-gray-900 dark:text-white">{t(`${liability.loan_type}`)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('forms.liabilities.loanBank')}:</span>
                            <p className="text-gray-900 dark:text-white">{liability.loan_bank}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('forms.liabilities.amount')}:</span>
                            <p className="text-gray-900 dark:text-white">€{liability.loan_amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('forms.liabilities.monthlyPayment')}:</span>
                            <p className="text-gray-900 dark:text-white">€{liability.loan_monthly_rate?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      {isEditMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLiability(liability.liability_id)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          {t('common.delete')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Add New Liability Form */}
          {isEditMode && (
            <form onSubmit={(e) => { e.preventDefault(); addLiability(); }} className="space-y-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('forms.liabilities.addNewLiability')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('forms.liabilities.loanType')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="loan_type"
                      value={formData.loan_type}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PersonalLoan">{t('forms.liabilities.personalLoan')}</option>
                      <option value="HomeLoan">{t('forms.liabilities.homeLoan')}</option>
                      <option value="CarLoan">{t('forms.liabilities.carLoan')}</option>
                      <option value="BusinessLoan">{t('forms.liabilities.businessLoan')}</option>
                      <option value="EducationLoan">{t('forms.liabilities.educationLoan')}</option>
                      <option value="OtherLoan">{t('forms.liabilities.otherLoan')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      {t('forms.liabilities.loanBank')}
                    </label>
                    <input
                      type="text"
                      name="loan_bank"
                      value={formData.loan_bank}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('forms.liabilities.loanBank')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      {t('forms.liabilities.amount')}
                    </label>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('forms.liabilities.amount')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      {t('forms.liabilities.monthlyPayment')}
                    </label>
                    <input
                      type="number"
                      name="loan_monthly_rate"
                      value={formData.loan_monthly_rate}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('forms.liabilities.monthlyPayment')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      {t('forms.liabilities.interestRate')}
                    </label>
                    <input
                      type="number"
                      name="loan_interest"
                      value={formData.loan_interest}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('forms.liabilities.interestRate')}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    loading={loading}
                    variant="secondary"
                    size="sm"
                    className="px-4 py-2"
                  >
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            </form>
          )}
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