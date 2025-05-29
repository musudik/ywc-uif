import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { Liability, LoanType } from '../../types';

export default function LiabilitiesForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    loan_type: 'PersonalLoan' as LoanType,
    loan_bank: '',
    loan_amount: 0,
    loan_monthly_rate: 0,
    loan_interest: 0,
  });

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userIdToLoad = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (userIdToLoad) {
        setDataLoading(true);
        try {
          const liabilitiesDetails = await formService.getLiabilitiesByUserId(userIdToLoad);
          if (liabilitiesDetails) {
            setLiabilities(liabilitiesDetails);
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
      showError('Missing Information', 'Please fill in loan type and bank before adding.');
      return;
    }

    setLoading(true);
    try {
      // Determine the user_id to use
      const userIdToUse = personalId || personalIdFromParams || (user?.role === 'CLIENT' ? user?.id : null);
      
      if (!userIdToUse) {
        showError('Missing Information', 'Unable to determine user ID for liability record.');
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
        loan_type: 'PersonalLoan' as LoanType,
        loan_bank: '',
        loan_amount: 0,
        loan_monthly_rate: 0,
        loan_interest: 0,
      });
      
      showSuccess('Liability Added', 'The liability has been added successfully.');
    } catch (error) {
      showError('Add Failed', error instanceof Error ? error.message : 'Failed to add liability');
    } finally {
      setLoading(false);
    }
  };

  const removeLiability = async (liabilityId: string) => {
    setLoading(true);
    try {
      await formService.deleteLiability(liabilityId);
      setLiabilities(prev => prev.filter(l => l.liability_id !== liabilityId));
      showSuccess('Liability Removed', 'The liability has been removed successfully.');
    } catch (error) {
      showError('Remove Failed', error instanceof Error ? error.message : 'Failed to remove liability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (liabilities.length === 0) {
      showError('No Liabilities', 'Please add at least one liability or skip this step.');
      return;
    }

    showSuccess('Liabilities Saved', 'Your liability information has been saved successfully.');
    setIsEditMode(false); // Return to read-only mode
    
    // Navigate based on user role
    if (user?.role === 'CLIENT') {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    showSuccess('Step Completed', 'You can add liabilities later if needed.');
    setIsEditMode(false);
    
    if (user?.role === 'CLIENT') {
      navigate('/dashboard');
    }
  };

  if (dataLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading liability details...</span>
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
                Liabilities & Loans {liabilities.length > 0 ? (isEditMode ? '(Editing)' : '(View)') : '(New)'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? liabilities.length > 0 
                    ? 'Manage your existing liabilities and loans.' 
                    : 'Add information about your loans and debts for a complete financial picture.'
                  : 'View your current liabilities and loans.'
                }
              </p>
            </div>
            {!isEditMode && liabilities.length > 0 && (
              <Button onClick={handleEdit} variant="outline">
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Liabilities List */}
          {liabilities.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Current Liabilities
              </h3>
              <div className="space-y-4">
                {liabilities.map((liability, index) => (
                  <div key={liability.liability_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                            <p className="text-gray-900 dark:text-white">{liability.loan_type}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Bank:</span>
                            <p className="text-gray-900 dark:text-white">{liability.loan_bank}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                            <p className="text-gray-900 dark:text-white">€{liability.loan_amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Monthly:</span>
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
                          Remove
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
                  Add New Liability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="loan_type"
                      value={formData.loan_type}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PersonalLoan">Personal Loan</option>
                      <option value="HomeLoan">Home Loan</option>
                      <option value="CarLoan">Car Loan</option>
                      <option value="BusinessLoan">Business Loan</option>
                      <option value="EducationLoan">Education Loan</option>
                      <option value="OtherLoan">Other Loan</option>
                    </select>
                  </div>

                  <TextInput
                    label="Bank/Lender"
                    name="loan_bank"
                    value={formData.loan_bank}
                    onChange={handleInputChange}
                    required
                    placeholder="Name of the lending institution"
                  />

                  <TextInput
                    label="Loan Amount (€)"
                    name="loan_amount"
                    type="number"
                    step="0.01"
                    value={formData.loan_amount.toString()}
                    onChange={handleInputChange}
                    placeholder="Total loan amount"
                  />

                  <TextInput
                    label="Monthly Payment (€)"
                    name="loan_monthly_rate"
                    type="number"
                    step="0.01"
                    value={formData.loan_monthly_rate.toString()}
                    onChange={handleInputChange}
                    placeholder="Monthly payment amount"
                  />

                  <TextInput
                    label="Interest Rate (%)"
                    name="loan_interest"
                    type="number"
                    step="0.01"
                    value={formData.loan_interest.toString()}
                    onChange={handleInputChange}
                    placeholder="Annual interest rate"
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    loading={loading}
                    variant="secondary"
                    size="sm"
                    className="px-4 py-2"
                  >
                    Add Liability
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="px-4 py-2"
            >
              {liabilities.length > 0 && !isEditMode ? 'Back' : 'Cancel'}
            </Button>

            <div className="flex gap-3">
              {isEditMode && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    className="px-4 py-2"
                  >
                    Skip This Step
                  </Button>
                  
                  {user?.role === 'CLIENT' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmit}
                      className="px-4 py-2"
                    >
                      Complete Financial Profile
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 