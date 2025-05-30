import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function ExpensesForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingExpensesId, setExistingExpensesId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    cold_rent: 0,
    electricity: 0,
    living_expenses: 0,
    gas: 0,
    telecommunication: 0,
    account_maintenance_fee: 0,
    alimony: 0,
    subscriptions: 0,
    other_expenses: 0,
  });

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userIdToLoad = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (userIdToLoad) {
        setDataLoading(true);
        try {
          const expensesDetails = await formService.getExpensesById(userIdToLoad);
          if (expensesDetails) {
            setFormData({
              cold_rent: expensesDetails.cold_rent,
              electricity: expensesDetails.electricity,
              living_expenses: expensesDetails.living_expenses,
              gas: expensesDetails.gas,
              telecommunication: expensesDetails.telecommunication,
              account_maintenance_fee: expensesDetails.account_maintenance_fee,
              alimony: expensesDetails.alimony,
              subscriptions: expensesDetails.subscriptions,
              other_expenses: expensesDetails.other_expenses,
            });
            setExistingExpensesId(expensesDetails.expenses_id);
            setIsEditMode(false); // Data exists, start in read-only mode
          } else {
            setIsEditMode(true); // No data exists, start in edit mode
          }
        } catch (error) {
          console.log('No existing expenses details found, starting with empty form');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (existingExpensesId) {
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
      const userIdToUse = personalId || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
      
      if (!userIdToUse) {
        showError(t('notifications.error'), 'Unable to determine user ID for expenses record.');
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse
      };

      let expensesDetails;
      
      if (existingExpensesId) {
        // Update existing record
        expensesDetails = await formService.updateExpenses(existingExpensesId, formDataForAPI);
        showSuccess(t('forms.expenses.expensesUpdated'), t('forms.expenses.expensesUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        expensesDetails = await formService.createExpenses(formDataForAPI);
        showSuccess(t('forms.expenses.expensesSaved'), t('forms.expenses.expensesSavedMessage'));
        setExistingExpensesId(expensesDetails.expenses_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      if (user?.role === 'CLIENT') {
        navigate(`/dashboard/forms/assets?personal_id=${userIdToUse}`);
      }
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save expenses details');
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
                {t('forms.expenses.title')} {existingExpensesId ? (isEditMode ? t('forms.expenses.editing') : t('forms.expenses.viewing')) : t('forms.expenses.new')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? existingExpensesId 
                    ? t('forms.expenses.updateInfo')
                    : t('forms.expenses.subtitle')
                  : t('forms.expenses.viewInfo')
                }
              </p>
            </div>
            {!isEditMode && existingExpensesId && (
              <Button onClick={handleEdit} variant="outline">
                {t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Housing Expenses */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Housing & Utilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label={t('forms.expenses.coldRent')}
                name="cold_rent"
                type="number"
                step="0.01"
                value={formData.cold_rent.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.electricity')}
                name="electricity"
                type="number"
                step="0.01"
                value={formData.electricity.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.gas')}
                name="gas"
                type="number"
                step="0.01"
                value={formData.gas.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.telecommunication')}
                name="telecommunication"
                type="number"
                step="0.01"
                value={formData.telecommunication.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>
          </div>

          {/* Living Expenses */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Living Expenses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label={t('forms.expenses.livingExpenses')}
                name="living_expenses"
                type="number"
                step="0.01"
                value={formData.living_expenses.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.subscriptions')}
                name="subscriptions"
                type="number"
                step="0.01"
                value={formData.subscriptions.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>
          </div>

          {/* Financial Expenses */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Financial Obligations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label={t('forms.expenses.accountMaintenanceFee')}
                name="account_maintenance_fee"
                type="number"
                step="0.01"
                value={formData.account_maintenance_fee.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.alimony')}
                name="alimony"
                type="number"
                step="0.01"
                value={formData.alimony.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
              />

              <TextInput
                label={t('forms.expenses.otherExpenses')}
                name="other_expenses"
                type="number"
                step="0.01"
                value={formData.other_expenses.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder={t('forms.expenses.monthlyAmount')}
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
              {existingExpensesId && !isEditMode ? t('common.back') : t('common.cancel')}
            </Button>

            {isEditMode && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  size="sm"
                  className="px-4 py-2"
                >
                  {existingExpensesId ? t('common.update') : t('common.save')}
                </Button>
                
                {user?.role === 'CLIENT' && (
                  <Button
                    type="submit"
                    loading={loading}
                    variant="secondary"
                    size="sm"
                    className="px-4 py-2"
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