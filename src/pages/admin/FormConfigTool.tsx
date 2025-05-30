import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import type { FormField, Section } from '../../types';
import { SECTION_DEFINITIONS } from '../../types';
import Button from '../../components/ui/Button';
import configToolService, { 
  type FormConfigurationData, 
  type FormConfigurationList,
  type ConsentForm,
  type Document,
  type CustomFields
} from '../../services/configToolService';

// Form types based on existing forms
const FORM_TYPES = [
  'financial-profile',
  'risk-assessment', 
  'goal-setting',
  'single-applicant',
  'dual-applicant',
  'personal-details',
  'family-details',
  'employment',
  'income',
  'expenses',
  'assets',
  'liabilities'
] as const;

// Section types based on existing forms and types
const SECTION_TYPES = [
  'personal',
  'family', 
  'employment',
  'income',
  'expenses',
  'assets',
  'liabilities'
] as const;

// Applicant configuration types
const APPLICANT_TYPES = [
  'single',
  'dual-primary-secondary',
  'family-group'
] as const;

type FormType = typeof FORM_TYPES[number];
type SectionType = typeof SECTION_TYPES[number];
type ApplicantConfigType = typeof APPLICANT_TYPES[number];

// Field type without 'file' type
type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

interface FormConfig {
  id?: string;
  config_id?: string;
  name: string;
  form_type: FormType;
  version: string;
  description: string;
  applicantConfig: ApplicantConfigType;
  sections: Section[];
  consent_form: ConsentForm;
  documents: Document[];
  is_active: boolean;
  allowedRoles: UserRole[];
  created_at?: string;
  updated_at?: string;
  custom_fields?: CustomFields;
}

// Icon components
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function FormConfigTool() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [savedConfigs, setSavedConfigs] = useState<FormConfigurationList[]>([]);
  const [showConfigList, setShowConfigList] = useState(true);
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig>({
    name: '',
    form_type: 'personal-details',
    version: '1.0.0',
    description: '',
    applicantConfig: 'single',
    sections: [],
    consent_form: {
      title: '',
      content: '',
      enabled: true,
      required: true,
      checkboxText: 'I agree to the terms and conditions'
    },
    documents: [],
    is_active: true,
    allowedRoles: [UserRole.ADMIN]
  });

  // Load existing configurations on mount
  useEffect(() => {
    loadSavedConfigurations();
  }, []);

  const loadSavedConfigurations = async () => {
    try {
      setLoading(true);
      setError(undefined);
      setSuccess(undefined);
      
      const response = await configToolService.getFormConfigurations();
      if (response.success && Array.isArray(response.data)) {
        setSavedConfigs(response.data);
        setError(undefined);
      } else {
        setSavedConfigs([]);
        setError('Failed to load configurations');
        setSuccess(undefined);
      }
    } catch (err) {
      setSavedConfigs([]);
      setError('An error occurred while loading configurations');
      setSuccess(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoChange = (field: keyof FormConfig, value: any) => {
    setFormConfig(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString()
    }));
  };

  const addSection = (sectionType: string) => {
    const sectionDefinition = SECTION_DEFINITIONS[sectionType];
    if (!sectionDefinition) return;
    
    const newSection: Section = {
      id: Date.now().toString(),
      order: formConfig.sections.length,
      title: sectionDefinition.title,
      description: sectionDefinition.description,
      fields: sectionDefinition.fields.map(field => ({
        ...field,
        id: `${field.name}_${Date.now()}`
      })),
      required: sectionDefinition.required,
      collapsible: false
    };
    
    setFormConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const addConsentForm = () => {
    const newConsent: ConsentForm = {
      title: '',
      content: '',
      enabled: true,
      required: true,
      checkboxText: 'I agree to the terms and conditions'
    };
    
    setFormConfig(prev => ({
      ...prev,
      consent_form: {
        ...prev.consent_form,
        ...newConsent
      }
    }));
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    };

    setFormConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    }));
  };

  const addDocument = () => {
    const newDocument: Document = {
      id: Date.now().toString(),
      name: '',
      maxSize: 5,
      required: false,
      description: '',
      acceptedTypes: ['pdf', 'jpg', 'png']
    };
    
    setFormConfig(prev => ({
      ...prev,
      documents: [...prev.documents, newDocument]
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const removeConsentForm = (consentId: string) => {
    setFormConfig(prev => ({
      ...prev,
      consent_form: {
        ...prev.consent_form,
        enabled: false
      }
    }));
  };

  const removeDocument = (documentId: string) => {
    setFormConfig(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== documentId)
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setFormConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )
    }));
  };

  const handleConsentFormChange = (updates: Partial<ConsentForm>) => {
    setFormConfig(prev => ({
      ...prev,
      consent_form: {
        ...prev.consent_form,
        ...updates
      }
    }));
  };

  const updateDocument = (documentId: string, updates: Partial<Document>) => {
    setFormConfig(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === documentId 
          ? { ...doc, ...updates }
          : doc
      )
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formConfig.name.trim()) {
      errors.push('Form name is required');
    }
    
    if (!formConfig.form_type) {
      errors.push('Form type is required');
    }
    
    if (formConfig.sections.length === 0) {
      errors.push('At least one section is required');
    }
    
    // Validate consent forms
    if (!formConfig.consent_form.title.trim()) {
      errors.push('Consent form title is required');
    }
    if (!formConfig.consent_form.content.trim()) {
      errors.push('Consent form content is required');
    }

    // Validate documents
    formConfig.documents.forEach((doc, index) => {
      if (!doc.name.trim()) {
        errors.push(`Document ${index + 1}: Name is required`);
      }
      if (!doc.acceptedTypes || doc.acceptedTypes.length === 0) {
        errors.push(`Document ${index + 1}: At least one accepted format is required`);
      }
    });
    
    return errors;
  };

  const handleSave = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      const serviceData: FormConfigurationData = {
        name: formConfig.name,
        form_type: formConfig.form_type,
        version: formConfig.version,
        description: formConfig.description,
        is_active: formConfig.is_active,
        sections: formConfig.sections,
        custom_fields: formConfig.custom_fields || {
          styling: {
            theme: 'default',
            custom_css: ''
          },
          custom_validation: {
            rules: [],
            enabled: true
          }
        },
        consent_form: formConfig.consent_form,
        documents: formConfig.documents,
        created_by_id: user.id,
        usage_count: 0,
        last_used_at: undefined
      };

      let response;
      if (formConfig.id) {
        response = await configToolService.updateFormConfiguration(formConfig.id, serviceData);
      } else {
        response = await configToolService.createFormConfiguration(serviceData);
      }

      if (response.success) {
        setSuccess(formConfig.id ? 'Form configuration updated successfully!' : 'Form configuration saved successfully!');
        loadSavedConfigurations();
        if (response.data) {
          setFormConfig(prev => ({
            ...prev,
            id: response.data!.id,
            config_id: response.data!.config_id
          }));
          setSelectedConfigId(response.data.config_id);
        }
      } else {
        setError(response.message || 'Failed to save form configuration');
        setSuccess(undefined);
      }
    } catch (err) {
      console.error('Failed to save form configuration:', err);
      setError('Failed to save form configuration. Please try again.');
      setSuccess(undefined);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormConfig({
      name: '',
      form_type: 'personal-details',
      version: '1.0.0',
      description: '',
      applicantConfig: 'single',
      sections: [],
      consent_form: {
        title: '',
        content: '',
        enabled: true,
        required: true,
        checkboxText: 'I agree to the terms and conditions'
      },
      documents: [],
      is_active: true,
      allowedRoles: [UserRole.ADMIN]
    });
    setSelectedConfigId(undefined);
    setError(undefined);
    setSuccess(undefined);
    setShowConfigList(false);
    setSuccess('Started new configuration');
  };

  const handleBackToList = () => {
    setShowConfigList(true);
    setSelectedConfigId(undefined);
    setError(undefined);
    setSuccess(undefined);
  };

  const handleSelectConfig = async (config: FormConfigurationList) => {
    try {
      setSelectedConfigId(config.config_id);
      setError(undefined);
      setSuccess(undefined);
      
      const response = await configToolService.getFormConfiguration(config.config_id);
      if (response.success && response.data) {
        const configData = response.data;
        setFormConfig({
          id: configData.id,
          config_id: configData.config_id,
          name: configData.name,
          form_type: configData.form_type as FormType,
          version: configData.version,
          description: configData.description,
          applicantConfig: 'single',
          sections: configData.sections,
          consent_form: configData.consent_form,
          documents: configData.documents,
          is_active: configData.is_active,
          allowedRoles: [UserRole.ADMIN],
          created_at: configData.created_at,
          updated_at: configData.updated_at
        });
        setShowConfigList(false);
        setSuccess('Configuration loaded successfully');
        setError(undefined);
      } else {
        setError('Failed to load configuration');
        setSuccess(undefined);
      }
    } catch (error) {
      setError('An error occurred while loading the configuration');
      setSuccess(undefined);
    }
  };

  const handleDeleteConfig = async (config: FormConfigurationList) => {
    try {
      setLoading(true);
      const response = await configToolService.deleteFormConfiguration(config.config_id);
      if (response.success) {
        setSavedConfigs(prev => prev.filter(c => c.config_id !== config.config_id));
        setSuccess('Configuration deleted successfully');
        setError(undefined);
      } else {
        setError('Failed to delete configuration');
        setSuccess(undefined);
      }
    } catch (err) {
      setError('An error occurred while deleting the configuration');
      setSuccess(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateConfig = async (config: FormConfigurationList) => {
    const newName = prompt('Enter name for the duplicated configuration:', `${config.name} (Copy)`);
    if (!newName) return;

    setLoading(true);
    try {
      // Use the database ID for cloning
      const response = await configToolService.cloneFormConfiguration(config.id, newName);
      if (response.success) {
        setSuccess('Configuration duplicated successfully');
        loadSavedConfigurations();
      } else {
        setError(response.message || 'Failed to duplicate configuration');
      }
    } catch (err) {
      setError('Failed to duplicate configuration');
      console.error('Duplicate error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin.formConfig.title') || 'Form Configuration Tool'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('admin.formConfig.description') || 'Configure custom forms for your YWC application'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {!showConfigList && (
            <Button variant="outline" onClick={handleBackToList} size="sm">
              ← Back to List
            </Button>
          )}
          <Button variant="outline" onClick={resetForm} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Configuration
          </Button>
          {!showConfigList && (
            <>
              <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!formConfig.name} size="sm">
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={loading} size="sm">
                <SaveIcon className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-red-500 rounded-full mr-3 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            {success}
          </div>
        </div>
      )}

      {/* Configuration List View */}
      {showConfigList && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Existing Form Configurations ({savedConfigs.length})
            </h2>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-lg font-medium mb-2">Loading configurations...</p>
              </div>
            ) : savedConfigs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg font-medium mb-2">No configurations found</p>
                <p className="text-sm">Create your first form configuration to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {savedConfigs.map((config) => (
                  <div key={config.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectConfig(config)}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{config.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="capitalize">{config.form_type}</span>
                              <span>v{config.version}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                config.is_active 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {config.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span>Used {config.usage_count} times</span>
                            </div>
                            {config.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{config.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectConfig(config);
                          }}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateConfig(config);
                          }}
                          className="text-xs"
                        >
                          <CopyIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config);
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Configuration Editor */}
      {!showConfigList && (
        <>
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h2>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={formConfig.name}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    placeholder="e.g., Complete Financial Assessment"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Form Type *
                  </label>
                  <select
                    value={formConfig.form_type}
                    onChange={(e) => handleBasicInfoChange('form_type', e.target.value as FormType)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FORM_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Applicant Configuration *
                  </label>
                  <select
                    value={formConfig.applicantConfig}
                    onChange={(e) => handleBasicInfoChange('applicantConfig', e.target.value as ApplicantConfigType)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single Applicant</option>
                    <option value="dual-primary-secondary">Dual Applicant (Primary + Secondary)</option>
                    <option value="family-group">Family Group</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formConfig.version}
                    onChange={(e) => handleBasicInfoChange('version', e.target.value)}
                    placeholder="1.0.0"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Description
                </label>
                <textarea
                  value={formConfig.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Describe the purpose of this form configuration..."
                />
              </div>
            </div>
          </div>

          {/* Section Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Form Sections
                </h2>
                <SectionSelector onSelect={addSection} />
              </div>
            </div>
            <div className="p-6">
              {formConfig.sections.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="max-w-sm mx-auto">
                    <h3 className="text-lg font-medium mb-2">No sections configured yet</h3>
                    <p className="text-sm">Add a section to get started with your form configuration.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formConfig.sections.map((section) => (
                    <SectionConfigCard
                      key={section.id}
                      section={section}
                      onUpdate={(updates) => updateSection(section.id, updates)}
                      onRemove={() => removeSection(section.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consent Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Consent Form
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formConfig.consent_form.title}
                    onChange={(e) => handleConsentFormChange({ title: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="Enter consent form title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Content
                  </label>
                  <textarea
                    value={formConfig.consent_form.content}
                    onChange={(e) => handleConsentFormChange({ content: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                    rows={6}
                    placeholder="Enter consent form content..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formConfig.consent_form.enabled}
                      onChange={(e) => handleConsentFormChange({ enabled: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Enable consent form</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formConfig.consent_form.required}
                      onChange={(e) => handleConsentFormChange({ required: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Required</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Checkbox Text
                  </label>
                  <input
                    type="text"
                    value={formConfig.consent_form.checkboxText}
                    onChange={(e) => handleConsentFormChange({ checkboxText: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="Enter checkbox text..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Documents Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="bg-gray-50 dark:bg-gray-700 border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Document Requirements
                </h2>
                <Button onClick={addDocument} size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </div>
            <div className="p-6">
              {formConfig.documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="max-w-sm mx-auto">
                    <h3 className="text-lg font-medium mb-2">No document requirements configured yet</h3>
                    <p className="text-sm">Add documents that users need to upload with this form.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formConfig.documents.map((document, index) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onUpdate={(updates) => updateDocument(document.id, updates)}
                      onRemove={() => removeDocument(document.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <FormPreviewModal 
          formConfig={formConfig} 
          onClose={() => setShowPreview(false)} 
          onConsentFormChange={handleConsentFormChange}
        />
      )}
    </div>
  );
}

// Section Configuration Card Component
interface SectionConfigCardProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onRemove: () => void;
}

function SectionConfigCard({ section, onUpdate, onRemove }: SectionConfigCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    };
    onUpdate({ fields: [...section.fields, newField] });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-750">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Section title"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white"
          />
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={section.collapsible}
              onChange={(e) => onUpdate({ collapsible: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-300">Collapsible</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={section.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-300">Required</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Edit Fields'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={section.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                rows={3}
                placeholder="Enter a description for this section..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Fields
              </label>
              <div className="space-y-2">
                {section.fields.map((field: FormField, index: number) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => {
                        const updatedFields = [...section.fields];
                        updatedFields[index] = { ...field, label: e.target.value };
                        onUpdate({ fields: updatedFields });
                      }}
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white"
                      placeholder="Field label"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const updatedFields = [...section.fields];
                        updatedFields[index] = { ...field, type: e.target.value as FieldType };
                        onUpdate({ fields: updatedFields });
                      }}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="textarea">Text Area</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedFields = section.fields.filter((_: FormField, i: number) => i !== index);
                        onUpdate({ fields: updatedFields });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                >
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Document Card Component
interface DocumentCardProps {
  document: Document;
  onUpdate: (updates: Partial<Document>) => void;
  onRemove: () => void;
}

function DocumentCard({ document, onUpdate, onRemove }: DocumentCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-750">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={document.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Document name"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
          />
          <div className="mt-2 space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Description
              </label>
              <textarea
                value={document.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Document description"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Max Size (MB)
              </label>
              <input
                type="number"
                value={document.maxSize}
                onChange={(e) => onUpdate({ maxSize: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Accepted Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['pdf', 'jpg', 'png', 'doc', 'docx'].map(type => (
                  <label key={type} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={document.acceptedTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...document.acceptedTypes, type]
                          : document.acceptedTypes.filter(t => t !== type);
                        onUpdate({ acceptedTypes: newTypes });
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">.{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={document.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Required</span>
              </label>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Form Preview Modal Component
interface FormPreviewModalProps {
  formConfig: FormConfig;
  onClose: () => void;
  onConsentFormChange: (updates: Partial<ConsentForm>) => void;
}

function FormPreviewModal({ formConfig, onClose, onConsentFormChange }: FormPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 dark:bg-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Form Preview</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formConfig.name || 'Untitled Form'}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formConfig.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                  {formConfig.form_type}
                </span>
                <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                  {formConfig.applicantConfig}
                </span>
                <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                  v{formConfig.version}
                </span>
              </div>
            </div>
            
            {formConfig.sections.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Configured Sections:</h4>
                <div className="space-y-2">
                  {formConfig.sections.map((section, index) => (
                    <div key={section.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">{section.fields.length} fields</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formConfig.consent_form.enabled && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Consent Form:</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formConfig.consent_form.title}
                      onChange={(e) => onConsentFormChange({ title: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Content
                    </label>
                    <textarea
                      value={formConfig.consent_form.content}
                      onChange={(e) => onConsentFormChange({ content: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                      rows={6}
                      placeholder="Enter consent form content..."
                    />
                  </div>
                </div>
              </div>
            )}

            {formConfig.documents.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Document Requirements:</h4>
                <div className="space-y-2">
                  {formConfig.documents.map((doc, index) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{doc.name}</span>
                        {doc.required && (
                          <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-1 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {doc.acceptedTypes.join(', ')} | Max {doc.maxSize}MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Configuration Summary:</h4>
              <pre className="text-xs overflow-auto bg-white dark:bg-gray-800 p-3 rounded border max-h-60 text-gray-900 dark:text-gray-100">
                {JSON.stringify(formConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section selector component
function SectionSelector({ onSelect }: { onSelect: (sectionType: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <select
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white"
      >
        <option value="">Select a section type...</option>
        {SECTION_TYPES.map(type => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Section
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect(SECTION_TYPES[0])}
      >
        Add Section
      </Button>
    </div>
  );
} 