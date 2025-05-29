import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function IncomeForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingIncomeId, setExistingIncomeId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userIdToLoad = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (userIdToLoad) {
        setDataLoading(true);
        try {
          const incomeDetails = await formService.getIncomeById(userIdToLoad);
          if (incomeDetails) {
            setFormData({
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
      
      if (existingIncomeId) {
        // Update existing record
        incomeDetails = await formService.updateIncome(existingIncomeId, formDataForAPI);
        showSuccess('Income Details Updated', 'Your income information has been updated successfully.');
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        incomeDetails = await formService.createIncome(formDataForAPI);
        showSuccess('Income Details Saved', 'Your income information has been saved successfully.');
        setExistingIncomeId(incomeDetails.income_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      if (user?.role === 'CLIENT') {
        navigate(`/dashboard/forms/expenses?personal_id=${userIdToUse}`);
      }
    } catch (error) {
      showError('Save Failed', error instanceof Error ? error.message : 'Failed to save income details');
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
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading income details...</span>
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
                Income Details {existingIncomeId ? (isEditMode ? '(Editing)' : '(View)') : '(New)'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? existingIncomeId 
                    ? 'Update your income information.' 
                    : 'Provide detailed information about your income sources and tax situation.'
                  : 'View your income information.'
                }
              </p>
            </div>
            {!isEditMode && existingIncomeId && (
              <Button onClick={handleEdit} variant="outline">
                Edit
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Primary Income */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="Gross Monthly Income (€)"
              name="gross_income"
              type="number"
              step="0.01"
              value={formData.gross_income.toString()}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder="Enter your gross monthly income"
            />

            <TextInput
              label="Net Monthly Income (€)"
              name="net_income"
              type="number"
              step="0.01"
              value={formData.net_income.toString()}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder="Enter your net monthly income"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Class <span className="text-red-500">*</span>
              </label>
              <select
                name="tax_class"
                value={formData.tax_class}
                onChange={handleInputChange}
                disabled={!isEditMode}
                required
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
              >
                <option value="">Select tax class</option>
                <option value="1">Class 1 - Single, divorced, widowed</option>
                <option value="2">Class 2 - Single parent with child allowance</option>
                <option value="3">Class 3 - Married, higher income</option>
                <option value="4">Class 4 - Married, both working equally</option>
                <option value="5">Class 5 - Married, lower income</option>
                <option value="6">Class 6 - Second job</option>
              </select>
            </div>

            <TextInput
              label="Tax ID"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder="Enter your tax identification number"
            />

            <TextInput
              label="Number of Salaries per Year"
              name="number_of_salaries"
              type="number"
              min="12"
              max="14"
              value={formData.number_of_salaries.toString()}
              onChange={handleInputChange}
              disabled={!isEditMode}
              required
              placeholder="Usually 12, 13, or 14"
            />
          </div>

          {/* Additional Income Sources */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Additional Income Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Child Benefit (€/month)"
                name="child_benefit"
                type="number"
                step="0.01"
                value={formData.child_benefit.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Monthly child benefit amount"
              />

              <TextInput
                label="Other Income (€/month)"
                name="other_income"
                type="number"
                step="0.01"
                value={formData.other_income.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Pension, rental income, etc."
              />

              <TextInput
                label="Trade/Business Income (€/month)"
                name="income_trade_business"
                type="number"
                step="0.01"
                value={formData.income_trade_business.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Income from trade or business"
              />

              <TextInput
                label="Self-Employed Income (€/month)"
                name="income_self_employed_work"
                type="number"
                step="0.01"
                value={formData.income_self_employed_work.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Freelance or self-employed income"
              />

              <TextInput
                label="Side Job Income (€/month)"
                name="income_side_job"
                type="number"
                step="0.01"
                value={formData.income_side_job.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Income from part-time or side work"
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
              {existingIncomeId && !isEditMode ? 'Back' : 'Cancel'}
            </Button>

            {isEditMode && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  size="sm"
                  className="px-4 py-2"
                >
                  {existingIncomeId ? 'Update' : 'Save'}
                </Button>
                
                {user?.role === 'CLIENT' && (
                  <Button
                    type="submit"
                    loading={loading}
                    variant="secondary"
                    size="sm"
                    className="px-4 py-2"
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