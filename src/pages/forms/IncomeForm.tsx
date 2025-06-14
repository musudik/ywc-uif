import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function IncomeForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingIncomeId, setExistingIncomeId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    gross_income: 0,
    net_income: 0,
    tax_class: '',
    tax_id: '',
    number_of_salaries: 12,
    child_benefit: 0,
    other_income: 0,
    income_trade_business: 0,
    income_self_employed_work: 0,
    income_side_job: 0,
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
          const incomeDetails = await formService.getIncomeById(userIdToLoad);
          if (incomeDetails) {
            setFormData({
              user_id: incomeDetails.user_id,
              gross_income: incomeDetails.gross_income,
              net_income: incomeDetails.net_income,
              tax_class: incomeDetails.tax_class,
              tax_id: incomeDetails.tax_id,
              number_of_salaries: incomeDetails.number_of_salaries,
              child_benefit: incomeDetails.child_benefit,
              other_income: incomeDetails.other_income,
              income_trade_business: incomeDetails.income_trade_business,
              income_self_employed_work: incomeDetails.income_self_employed_work,
              income_side_job: incomeDetails.income_side_job,
            });
            setExistingIncomeId(incomeDetails.income_id);
            setIsEditMode(false); // Data exists, start in read-only mode
          } else {
            setIsEditMode(true); // No data exists, start in edit mode
          }
        } catch (error) {
          console.log('No existing income details found, starting with empty form');
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
    if (existingIncomeId) {
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
        showError('Missing Information', 'Unable to determine user ID for income record.');
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse
      };

      let incomeDetails;
      
      if (formData.user_id) {
        // Update existing record
        incomeDetails = await formService.updateIncome(existingIncomeId, formDataForAPI);
        showSuccess(t('forms.income.incomeUpdated'), t('forms.income.incomeUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        incomeDetails = await formService.createIncome(formDataForAPI);
        showSuccess(t('forms.income.incomeSaved'), t('forms.income.incomeSavedMessage'));
        setExistingIncomeId(incomeDetails.income_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      navigate(`/dashboard/forms/expenses?personal_id=${userIdToUse}`);
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save income details');
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
              {t('forms.income.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Income Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.income.title')}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.grossIncome')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="gross_income"
                value={formData.gross_income}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.income.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.netIncome')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="net_income"
                value={formData.net_income}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.income.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.taxClass')}
              </label>
              <select
                name="tax_class"
                value={formData.tax_class}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('forms.income.selectTaxClass')}</option>
                <option value="1">{t('forms.income.class1')}</option>
                <option value="2">{t('forms.income.class2')}</option>
                <option value="3">{t('forms.income.class3')}</option>
                <option value="4">{t('forms.income.class4')}</option>
                <option value="5">{t('forms.income.class5')}</option>
                <option value="6">{t('forms.income.class6')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.numberOfSalaries')}
              </label>
              <input
                type="number"
                name="number_of_salaries"
                value={formData.number_of_salaries}
                onChange={handleInputChange}
                min="12"
                max="14"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.childBenefit')}
              </label>
              <input
                type="number"
                name="child_benefit"
                value={formData.child_benefit}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.income.monthlyAmount')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.income.otherIncome')}
              </label>
              <input
                type="number"
                name="other_income"
                value={formData.other_income}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.income.monthlyAmount')}
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