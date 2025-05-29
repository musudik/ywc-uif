import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function AssetsForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingAssetId, setExistingAssetId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    real_estate: 0,
    securities: 0,
    bank_deposits: 0,
    building_savings: 0,
    insurance_values: 0,
    other_assets: 0,
  });

  useEffect(() => {
    const loadExistingData = async () => {
      // Determine which personal ID to use: URL param 'id', URL query 'personal_id', or user's own ID for clients
      const userIdToLoad = (user?.role === 'CLIENT' ? user?.id : null);
      
      if (userIdToLoad) {
        setDataLoading(true);
        try {
          const assetDetails = await formService.getAssetById(userIdToLoad);
          if (assetDetails) {
            setFormData({
              real_estate: assetDetails.real_estate,
              securities: assetDetails.securities,
              bank_deposits: assetDetails.bank_deposits,
              building_savings: assetDetails.building_savings,
              insurance_values: assetDetails.insurance_values,
              other_assets: assetDetails.other_assets,
            });
            setExistingAssetId(assetDetails.asset_id);
            setIsEditMode(false); // Data exists, start in read-only mode
          } else {
            setIsEditMode(true); // No data exists, start in edit mode
          }
        } catch (error) {
          console.log('No existing assets found, starting with empty form');
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
    if (existingAssetId) {
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
        showError('Missing Information', 'Unable to determine user ID for asset record.');
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse
      };

      let assetDetails;
      
      if (existingAssetId) {
        // Update existing record
        assetDetails = await formService.updateAsset(existingAssetId, formDataForAPI);
        showSuccess('Asset Details Updated', 'Your asset information has been updated successfully.');
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        assetDetails = await formService.createAsset(formDataForAPI);
        showSuccess('Asset Details Saved', 'Your asset information has been saved successfully.');
        setExistingAssetId(assetDetails.asset_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      if (user?.role === 'CLIENT') {
        navigate(`/dashboard/forms/liabilities?personal_id=${userIdToUse}`);
      }
    } catch (error) {
      showError('Save Failed', error instanceof Error ? error.message : 'Failed to save asset details');
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
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading asset details...</span>
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
                Asset Portfolio {existingAssetId ? (isEditMode ? '(Editing)' : '(View)') : '(New)'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode 
                  ? existingAssetId 
                    ? 'Update your asset portfolio information.' 
                    : 'Document your assets to build a complete financial profile.'
                  : 'View your asset portfolio information.'
                }
              </p>
            </div>
            {!isEditMode && existingAssetId && (
              <Button onClick={handleEdit} variant="outline">
                Edit
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Asset Portfolio */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Asset Portfolio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Real Estate Value (€)"
                name="real_estate"
                type="number"
                step="0.01"
                value={formData.real_estate.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Total value of real estate properties"
              />

              <TextInput
                label="Securities Value (€)"
                name="securities"
                type="number"
                step="0.01"
                value={formData.securities.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Stocks, bonds, mutual funds"
              />

              <TextInput
                label="Bank Deposits (€)"
                name="bank_deposits"
                type="number"
                step="0.01"
                value={formData.bank_deposits.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Savings accounts, CDs, fixed deposits"
              />

              <TextInput
                label="Building Savings (€)"
                name="building_savings"
                type="number"
                step="0.01"
                value={formData.building_savings.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Bausparen and building society savings"
              />

              <TextInput
                label="Insurance Values (€)"
                name="insurance_values"
                type="number"
                step="0.01"
                value={formData.insurance_values.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Life insurance cash value, annuities"
              />

              <TextInput
                label="Other Assets (€)"
                name="other_assets"
                type="number"
                step="0.01"
                value={formData.other_assets.toString()}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Art, jewelry, collectibles, vehicles"
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
              {existingAssetId && !isEditMode ? 'Back' : 'Cancel'}
            </Button>

            {isEditMode && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  size="sm"
                  className="px-4 py-2"
                >
                  {existingAssetId ? 'Update' : 'Save'}
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