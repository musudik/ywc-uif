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
    expenses_id: '',
    user_id: '',
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
          const expensesDetailsList = await formService.getExpensesByUserId(userIdToLoad);
          if (expensesDetailsList) {
            const expensesDetails = expensesDetailsList[0];
            setFormData({
              expenses_id: expensesDetails.expenses_id,
              user_id: expensesDetailsList[0].user_id,
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
      
      if (formData.user_id) { 
        // Update existing record
        expensesDetails = await formService.updateExpenses(formData.user_id, formDataForAPI);
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
      navigate(`/dashboard/forms/assets?personal_id=${userIdToUse}`);
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
    <div className="container mx-auto p-6 space-y-6">
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('forms.expenses.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Expenses Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.expenses.monthlyExpenses')}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.coldRent')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cold_rent"
                value={formData.cold_rent}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.electricity')}
              </label>
              <input
                type="number"
                name="electricity"
                value={formData.electricity}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.gas')}
              </label>
              <input
                type="number"
                name="gas"
                value={formData.gas}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.telecommunication')}
              </label>
              <input
                type="number"
                name="telecommunication"
                value={formData.telecommunication}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.livingExpenses')}
              </label>
              <input
                type="number"
                name="living_expenses"
                value={formData.living_expenses}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.expenses.otherExpenses')}
              </label>
              <input
                type="number"
                name="other_expenses"
                value={formData.other_expenses}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.expenses.monthlyAmount')}
              />
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