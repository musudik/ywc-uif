import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function AssetsForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { personalId } = useParams();
  const [searchParams] = useSearchParams();
  const personalIdFromParams = searchParams.get('personal_id');
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [existingAssetId, setExistingAssetId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    real_estate: 0,
    securities: 0,
    bank_deposits: 0,
    building_savings: 0,
    insurance_values: 0,
    other_assets: 0,
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
          const assetDetailsList = await formService.getAssetsByUserId(userIdToLoad);
          if (assetDetailsList) {
            const assetDetails = assetDetailsList[0];
            setFormData({
              user_id: assetDetails.user_id,
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
        showError(t('notifications.error'), 'Unable to determine user ID for asset record.');
        return;
      }

      // Add user_id to form data
      const formDataForAPI = {
        ...formData,
        user_id: userIdToUse
      };

      let assetDetails;
      
      if (formData.user_id) {
        // Update existing record
        assetDetails = await formService.updateAsset(existingAssetId, formDataForAPI);
        showSuccess(t('forms.assets.assetsUpdated'), t('forms.assets.assetsUpdatedMessage'));
        setIsEditMode(false); // Return to read-only mode
      } else {
        // Create new record
        assetDetails = await formService.createAsset(formDataForAPI);
        showSuccess(t('forms.assets.assetsSaved'), t('forms.assets.assetsSavedMessage'));
        setExistingAssetId(assetDetails.asset_id);
        setIsEditMode(false); // Return to read-only mode
      }
      
      // Navigate based on user role, passing the personal_id
      navigate(`/dashboard/forms/liabilities?personal_id=${userIdToUse}`);
    } catch (error) {
      showError(t('notifications.saveFailed'), error instanceof Error ? error.message : 'Failed to save asset details');
    } finally {
      setLoading(false);
    }
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
              {t('forms.assets.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('forms.assets.description')}
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
      {/* Asset Portfolio Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('forms.assets.title')}
              </h3>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.realEstate')}
              </label>
              <input
                type="number"
                name="real_estate"
                value={formData.real_estate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.securities')}
              </label>
              <input
                type="number"
                name="securities"
                value={formData.securities}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.bankDeposits')}
              </label>
              <input
                type="number"
                name="bank_deposits"
                value={formData.bank_deposits}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.buildingSavings')}
              </label>
              <input
                type="number"
                name="building_savings"
                value={formData.building_savings}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.insuranceValues')}
              </label>
              <input
                type="number"
                name="insurance_values"
                value={formData.insurance_values}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t('forms.assets.otherAssets')}
              </label>
              <input
                type="number"
                name="other_assets"
                value={formData.other_assets}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('forms.assets.currentValue')}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 