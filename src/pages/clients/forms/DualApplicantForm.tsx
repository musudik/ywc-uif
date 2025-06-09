import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/ui/Button';
import formSubmissionService, { type FormSubmissionData } from '../../../services/formSubmissionService';
import { formService } from '../../../services/formService';
import type { FormConfigurationData } from '../../../services/configToolService';
import type { Section, FormField } from '../../../types';

interface ApplicantData {
  [key: string]: any;
}

// Icon components
const UserGroupIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function DualApplicantForm() {
  const { submissionId, configId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfigurationData | null>(null);
  const [submission, setSubmission] = useState<FormSubmissionData | null>(null);
  const [applicant1Data, setApplicant1Data] = useState<ApplicantData>({});
  const [applicant2Data, setApplicant2Data] = useState<ApplicantData>({});

  useEffect(() => {
    loadFormData();
  }, [submissionId, configId]);

  const loadFormData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (submissionId && submissionId !== 'new') {
        // Load existing submission
        const submissionResponse = await formSubmissionService.getFormSubmission(submissionId);
        if (submissionResponse.success && submissionResponse.data) {
          setSubmission(submissionResponse.data);
          
          // Parse dual applicant data from submission
          const submissionData = submissionResponse.data.form_data || {};
          setApplicant1Data(submissionData.applicant1 || {});
          setApplicant2Data(submissionData.applicant2 || {});

          console.log('Loading config for existing dual submission, form_config_id:', submissionResponse.data.form_config_id);
          // Load form configuration
          const configResponse = await formSubmissionService.getFormConfiguration(submissionResponse.data.form_config_id);
          if (configResponse.success && configResponse.data) {
            setFormConfig(configResponse.data);
          } else {
            console.error('Failed to load form configuration:', configResponse.message);
            showError(t('common.error'), `${t('forms.dynamic.loadError')}: ${configResponse.message || 'Configuration not found'}`);
            navigate('/dashboard/forms');
          }
        } else {
          showError(t('common.error'), t('forms.dynamic.loadError'));
          navigate('/dashboard/forms');
        }
      } else if (configId) {
        console.log('Loading config for new dual submission, configId:', configId);
        // Create new submission
        const configResponse = await formSubmissionService.getFormConfiguration(configId);
        if (configResponse.success && configResponse.data) {
          setFormConfig(configResponse.data);
          
          // Pre-fill with any existing client data for applicant 1
          const prefilledData = await loadClientData(configResponse.data);
          setApplicant1Data(prefilledData);
          setApplicant2Data({});
        } else {
          console.error('Failed to load form configuration:', configResponse.message);
          showError(t('common.error'), `${t('forms.dynamic.loadError')}: ${configResponse.message || 'Configuration not found'}`);
          navigate('/dashboard/forms');
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      showError(t('common.error'), t('forms.dynamic.loadError'));
      navigate('/dashboard/forms');
    } finally {
      setLoading(false);
    }
  };

  const loadClientData = async (config: FormConfigurationData): Promise<ApplicantData> => {
    if (!user) return {};

    const prefilledData: ApplicantData = {};
    
    // Only prefill for CLIENT role
    const userIdToLoad = user.role === 'CLIENT' ? user.id : null;
    if (!userIdToLoad) return {};

    const formatDateForInput = (dateString: string | null | undefined): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    try {
      // Load personal details if personal section exists
      const personalSection = config.sections.find(s => s.title.toLowerCase().includes('personal'));
      if (personalSection) {
        try {
          const personalDetails = await formService.getPersonalDetailsById(userIdToLoad);
          Object.assign(prefilledData, {
            first_name: personalDetails.first_name || '',
            last_name: personalDetails.last_name || '',
            email: personalDetails.email || '',
            phone: personalDetails.phone || '',
            street: personalDetails.street || '',
            house_number: personalDetails.house_number || '',
            postal_code: personalDetails.postal_code || '',
            city: personalDetails.city || '',
            birth_date: formatDateForInput(personalDetails.birth_date),
            birth_place: personalDetails.birth_place || '',
            nationality: personalDetails.nationality || '',
            marital_status: personalDetails.marital_status || '',
          });
        } catch (error) {
          console.log('Personal details not found for prefill');
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    }

    return prefilledData;
  };

  const handleApplicant1Change = (sectionData: ApplicantData) => {
    setApplicant1Data(prev => ({ ...prev, ...sectionData }));
  };

  const handleApplicant2Change = (sectionData: ApplicantData) => {
    setApplicant2Data(prev => ({ ...prev, ...sectionData }));
  };

  const handleSave = async (asSubmitted = false) => {
    if (!user || !formConfig) return;

    try {
      setSaving(true);

      // Ensure we're using config_id consistently
      const configIdToStore = formConfig.config_id || configId;
      console.log('🔧 Dual form: Saving form with config_id:', configIdToStore);

      const formData = {
        applicant1: applicant1Data,
        applicant2: applicant2Data,
      };

      if (submission?.id) {
        // Update existing submission (normal edit mode)
        const updateData: Partial<FormSubmissionData> = {
          form_data: formData,
          status: asSubmitted ? 'submitted' : 'draft',
        };
        
        if (asSubmitted) {
          updateData.submitted_at = new Date();
        }
        
        const response = await formSubmissionService.updateFormSubmission(submission.id, updateData);

        if (response.success) {
          showSuccess(t('common.success'), asSubmitted ? t('forms.dynamic.submitSuccess') : t('forms.dynamic.saveSuccess'));
          if (asSubmitted) {
            // Navigate to document upload page after successful submission
            const submissionId = submission?.id;
            if (submissionId && formConfig?.documents && formConfig.documents.length > 0) {
              navigate(`/dashboard/forms/documents/dual/${submissionId}`);
            } else {
              // No documents to upload, go back to forms list
              navigate('/dashboard/forms');
            }
          }
        } else {
          showError(t('common.error'), response.message || t('forms.dynamic.submitError'));
        }
      } else {
        // Create new submission
        const createData: Omit<FormSubmissionData, 'id' | 'created_at' | 'updated_at'> = {
          form_config_id: configIdToStore!,
          user_id: user.id,
          form_data: formData,
          status: asSubmitted ? 'submitted' : 'draft',
        };
        
        if (asSubmitted) {
          createData.submitted_at = new Date();
        }
        
        const response = await formSubmissionService.createFormSubmission(createData);

        if (response.success && response.data) {
          setSubmission(response.data);
          console.log('Saved dual submission with form_config_id:', response.data.form_config_id);
          showSuccess(t('common.success'), asSubmitted ? t('forms.dynamic.submitSuccess') : t('forms.dynamic.saveSuccess'));
          if (asSubmitted) {
            // Navigate to document upload page after successful submission
            const submissionId = response.data.id;
            if (submissionId && formConfig?.documents && formConfig.documents.length > 0) {
              navigate(`/dashboard/forms/documents/dual/${submissionId}`);
            } else {
              // No documents to upload, go back to forms list
              navigate('/dashboard/forms');
            }
          }
        } else {
          showError(t('common.error'), response.message || t('forms.dynamic.submitError'));
        }
      }
    } catch (error) {
      console.error('Error saving form:', error);
      showError(t('common.error'), t('forms.dynamic.submitError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    handleSave(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading form...</span>
            <span className="ml-3 text-gray-600 dark:text-gray-400">{t('forms.dynamic.loadingForm')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('forms.dual.formNotFoundTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('forms.dual.formNotFoundMessage')}</p>
            <Button onClick={() => navigate('/dashboard/forms')} className="mt-4">
              {t('forms.list.backToForms')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/dashboard/forms')}>
          ← {t('forms.list.backToForms')}
        </Button>
      </div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {formConfig.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {formConfig.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded text-sm">
                  {t('forms.list.jointApplication')}
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-sm">
                  v{formConfig.version}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Dual Applicant Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Applicant 1 */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('forms.list.applicant1')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('forms.list.primaryApplicant')}
                </p>
              </div>
              
              {formConfig.sections.map((section) => (
                <DualApplicantSection
                  key={`applicant1-${section.id}`}
                  section={section}
                  formData={applicant1Data}
                  onChange={handleApplicant1Change}
                  applicantLabel="Applicant 1"
                />
              ))}
            </div>

            {/* Applicant 2 */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('forms.list.applicant2')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('forms.list.secondaryApplicant')}
                </p>
              </div>
              
              {formConfig.sections.map((section) => (
                <DualApplicantSection
                  key={`applicant2-${section.id}`}
                  section={section}
                  formData={applicant2Data}
                  onChange={handleApplicant2Change}
                  applicantLabel="Applicant 2"
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-600 mt-8">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {t('forms.dual.saveAsDraft')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              {saving ? t('forms.dynamic.submitting') : t('forms.dynamic.submitForm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dual Applicant Section Component
interface DualApplicantSectionProps {
  section: Section;
  formData: ApplicantData;
  onChange: (sectionData: ApplicantData) => void;
  applicantLabel: string;
}

function DualApplicantSection({ section, formData, onChange, applicantLabel }: DualApplicantSectionProps) {
  const { t } = useLanguage();

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({ [fieldName]: value });
  };

  const getTranslatedFieldLabel = (field: FormField, sectionTitle: string) => {
    const sectionType = sectionTitle.toLowerCase();
    const fieldName = field.name.toLowerCase();

    // Map fields to translation keys based on section
    if (sectionType.includes('personal')) {
      switch (fieldName) {
        case 'salutation': return t('forms.dynamic.salutation');
        case 'first_name': return t('forms.dynamic.firstName');
        case 'last_name': return t('forms.dynamic.lastName');
        case 'email': return t('forms.dynamic.email');
        case 'phone': return t('forms.dynamic.phone');
        case 'street': return t('forms.dynamic.street');
        case 'house_number': return t('forms.dynamic.houseNumber');
        case 'postal_code': return t('forms.dynamic.postalCode');
        case 'city': return t('forms.dynamic.city');
        case 'birth_date': return t('forms.dynamic.birthDate');
        case 'birth_place': return t('forms.dynamic.birthPlace');
        case 'nationality': return t('forms.dynamic.nationality');
        case 'marital_status': return t('forms.dynamic.maritalStatus');
        case 'housing': return t('forms.dynamic.housing');
        default: return field.label;
      }
    } else if (sectionType.includes('income')) {
      switch (fieldName) {
        case 'gross_income': return t('forms.income.grossIncome');
        case 'net_income': return t('forms.income.netIncome');
        case 'tax_class': return t('forms.income.taxClass');
        case 'number_of_salaries': return t('forms.income.numberOfSalaries');
        case 'child_benefit': return t('forms.income.childBenefit');
        case 'other_income': return t('forms.income.otherIncome');
        default: return field.label;
      }
    } else if (sectionType.includes('employment')) {
      switch (fieldName) {
        case 'occupation': return t('forms.employment.occupation');
        case 'contract_type': return t('forms.employment.contractType');
        case 'employer_name': return t('forms.employment.employerName');
        case 'employed_since': return t('forms.employment.employedSince');
        default: return field.label;
      }
    } else if (sectionType.includes('expenses')) {
      switch (fieldName) {
        case 'cold_rent': return t('forms.expenses.coldRent');
        case 'electricity': return t('forms.expenses.electricity');
        case 'living_expenses': return t('forms.expenses.livingExpenses');
        case 'gas': return t('forms.expenses.gas');
        case 'telecommunication': return t('forms.expenses.telecommunication');
        case 'other_expenses': return t('forms.expenses.otherExpenses');
        default: return field.label;
      }
    } else if (sectionType.includes('assets')) {
      switch (fieldName) {
        case 'real_estate': return t('forms.assets.realEstate');
        case 'securities': return t('forms.assets.securities');
        case 'bank_deposits': return t('forms.assets.bankDeposits');
        case 'building_savings': return t('forms.assets.buildingSavings');
        case 'insurance_values': return t('forms.assets.insuranceValues');
        case 'other_assets': return t('forms.assets.otherAssets');
        default: return field.label;
      }
    } else if (sectionType.includes('liabilities')) {
      switch (fieldName) {
        case 'loan_type': return t('forms.liabilities.loanType');
        case 'loan_bank': return t('forms.liabilities.loanBank');
        case 'loan_amount': return t('forms.liabilities.loanAmount');
        case 'loan_monthly_rate': return t('forms.liabilities.loanMonthlyRate');
        case 'loan_interest': return t('forms.liabilities.loanInterest');
        default: return field.label;
      }
    } else if (sectionType.includes('family')) {
      switch (fieldName) {
        case 'first_name': return t('forms.dynamic.firstName');
        case 'last_name': return t('forms.dynamic.lastName');
        case 'relation': return t('forms.familyDetails.relation');
        case 'birth_date': return t('forms.dynamic.birthDate');
        case 'nationality': return t('forms.dynamic.nationality');
        default: return field.label;
      }
    }

    return field.label;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {section.title}
      </h3>
      {section.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {section.description}
        </p>
      )}
      
      <div className="space-y-4">
        {section.fields.map((field) => (
          <DualApplicantField
            key={field.id}
            field={field}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            translatedLabel={getTranslatedFieldLabel(field, section.title)}
          />
        ))}
      </div>
    </div>
  );
}

// Dual Applicant Field Component
interface DualApplicantFieldProps {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
  translatedLabel: string;
}

function DualApplicantField({ field, value, onChange, translatedLabel }: DualApplicantFieldProps) {
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newValue = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    onChange(field.name, newValue);
  };

  const inputClasses = `w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const getSelectOptions = (fieldName: string) => {
    switch (fieldName.toLowerCase()) {
      case 'marital_status':
        return [
          { value: '', label: t('forms.dynamic.select') },
          { value: 'single', label: t('forms.dynamic.single') },
          { value: 'married', label: t('forms.dynamic.married') },
          { value: 'divorced', label: t('forms.dynamic.divorced') },
          { value: 'widowed', label: t('forms.dynamic.widowed') }
        ];
      case 'housing':
        return [
          { value: '', label: t('forms.dynamic.select') },
          { value: 'owned', label: t('forms.dynamic.owned') },
          { value: 'rented', label: t('forms.dynamic.rented') },
          { value: 'livingWithParents', label: t('forms.dynamic.livingWithParents') },
          { value: 'other', label: t('forms.dynamic.other') }
        ];
      case 'contract_type':
        return [
          { value: '', label: t('forms.employment.selectContractType') },
          { value: 'permanent', label: t('forms.employment.permanent') },
          { value: 'temporary', label: t('forms.employment.temporary') },
          { value: 'freelance', label: t('forms.employment.freelance') },
          { value: 'consultant', label: t('forms.employment.consultant') }
        ];
      case 'loan_type':
        return [
          { value: '', label: t('forms.liabilities.selectLoanType') },
          { value: 'PersonalLoan', label: t('forms.liabilities.personalLoan') },
          { value: 'HomeLoan', label: t('forms.liabilities.homeLoan') },
          { value: 'CarLoan', label: t('forms.liabilities.carLoan') },
          { value: 'BusinessLoan', label: t('forms.liabilities.businessLoan') },
          { value: 'EducationLoan', label: t('forms.liabilities.educationLoan') },
          { value: 'OtherLoan', label: t('forms.liabilities.otherLoan') }
        ];
      case 'relation':
        return [
          { value: '', label: t('forms.dynamic.select') },
          { value: 'Spouse', label: t('forms.familyDetails.spouse') },
          { value: 'Child', label: t('forms.familyDetails.child') },
          { value: 'Parent', label: t('forms.familyDetails.parent') },
          { value: 'Other', label: t('forms.dynamic.other') }
        ];
      default:
        return field.options?.map(option => ({ value: option, label: option })) || [];
    }
  };

  const renderField = () => {
    switch (field.type) {
      case 'select':
        const options = getSelectOptions(field.name);
        return (
          <select
            value={value}
            onChange={handleChange}
            className={inputClasses}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={handleChange}
            className={inputClasses}
            rows={3}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={handleChange}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-900 dark:text-white">
              {translatedLabel}
              {field.required && <span className="text-red-500 ml-1">{t('forms.dynamic.required')}</span>}
            </span>
          </label>
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={handleChange}
            className={inputClasses}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return renderField();
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {translatedLabel}
        {field.required && <span className="text-red-500 ml-1">{t('forms.dynamic.required')}</span>}
      </label>
      {renderField()}
    </div>
  );
} 