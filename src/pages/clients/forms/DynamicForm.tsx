import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/ui/Button';
import { SignaturePad } from '../../../components/util';
import formSubmissionService, { type FormSubmissionData } from '../../../services/formSubmissionService';
import { PDFExporter, extractFormSections } from '../../../utils/pdfExport';
import { createTranslationFunction } from '../../../utils/translations';
import { formService } from '../../../services/formService';
import type { FormConfigurationData } from '../../../services/configToolService';
import type { Section, FormField } from '../../../types';

// Dynamic field component
function DynamicField({ field, value, onChange }: {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { type } = e.target;
    let newValue: any = e.target.value;
    
    if (type === 'number') {
      newValue = parseFloat(e.target.value) || 0;
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'date') {
      newValue = e.target.value;
    }
    
    onChange(field.name, newValue);
  };

  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  switch (field.type) {
    case 'select':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            className={baseClasses}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            placeholder={field.placeholder}
            rows={4}
            className={baseClasses + " resize-none"}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name={field.name}
            checked={value || false}
            onChange={handleChange}
            required={field.required}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            placeholder={field.placeholder}
            step={field.type === 'number' ? '0.01' : undefined}
            min={field.validation?.min}
            max={field.validation?.max}
            pattern={field.validation?.pattern}
            className={baseClasses}
          />
        </div>
      );
  }
}

// Dynamic section component
function DynamicSection({ section, formData, onChange }: {
  section: Section;
  formData: Record<string, any>;
  onChange: (sectionId: string, sectionData: Record<string, any>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange(section.id, { [fieldName]: value });
  };

  // Check if this section should use an existing form component
  const renderExistingFormFields = (sectionTitle: string) => {
    const title = sectionTitle.toLowerCase();
    const sectionData = formData[section.id] || {};
    
    if (title.includes('personal')) {
      return renderPersonalDetailsFields(sectionData, handleFieldChange);
    } else if (title.includes('family')) {
      return renderFamilyDetailsFields(sectionData, handleFieldChange);
    } else if (title.includes('employment')) {
      return renderEmploymentFields(sectionData, handleFieldChange);
    } else if (title.includes('income')) {
      return renderIncomeFields(sectionData, handleFieldChange);
    } else if (title.includes('expenses')) {
      return renderExpensesFields(sectionData, handleFieldChange);
    } else if (title.includes('assets')) {
      return renderAssetsFields(sectionData, handleFieldChange);
    } else if (title.includes('liabilities')) {
      return renderLiabilitiesFields(sectionData, handleFieldChange);
    }
    
    return null;
  };

  const existingFormFields = renderExistingFormFields(section.title);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
      <div 
        className="border-b border-gray-200 dark:border-gray-600 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
        onClick={() => section.collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {section.title}
              {section.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {section.description}
            </p>
          </div>
          {section.collapsible && (
            <div className="text-gray-400">
              {isExpanded ? '−' : '+'}
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          {existingFormFields ? (
            existingFormFields
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={formData[section.id]?.[field.name]}
                  onChange={handleFieldChange}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Personal Details Fields Renderer
function renderPersonalDetailsFields(formData: any, onChange: (name: string, value: any) => void) {
  const { t } = useLanguage();
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.salutation')}
        </label>
        <input
          type="text"
          value={formData.salutation || ''}
          onChange={(e) => onChange('salutation', e.target.value)}
          className={baseClasses}
          placeholder="Mr./Ms./Dr."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.firstName')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.first_name || ''}
          onChange={(e) => onChange('first_name', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.lastName')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.last_name || ''}
          onChange={(e) => onChange('last_name', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.email')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.phone')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.street')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.street || ''}
          onChange={(e) => onChange('street', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.houseNumber')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.house_number || ''}
          onChange={(e) => onChange('house_number', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.postalCode')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.postal_code || ''}
          onChange={(e) => onChange('postal_code', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.city')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.birthDate')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="date"
          value={formData.birth_date || ''}
          onChange={(e) => onChange('birth_date', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.birthPlace')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.birth_place || ''}
          onChange={(e) => onChange('birth_place', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.nationality')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.nationality || ''}
          onChange={(e) => onChange('nationality', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.maritalStatus')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <select
          value={formData.marital_status || ''}
          onChange={(e) => onChange('marital_status', e.target.value)}
          className={baseClasses}
        >
          <option value="">{t('forms.dynamic.select')}</option>
          <option value="single">{t('forms.dynamic.single')}</option>
          <option value="married">{t('forms.dynamic.married')}</option>
          <option value="divorced">{t('forms.dynamic.divorced')}</option>
          <option value="widowed">{t('forms.dynamic.widowed')}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.dynamic.housing')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <select
          value={formData.housing || ''}
          onChange={(e) => onChange('housing', e.target.value)}
          className={baseClasses}
        >
          <option value="">{t('forms.dynamic.select')}</option>
          <option value="Owner">{t('forms.dynamic.owned')}</option>
          <option value="Renter">{t('forms.dynamic.rented')}</option>
          <option value="Living with family">{t('forms.dynamic.livingWithParents')}</option>
          <option value="Other">{t('forms.dynamic.other')}</option>
        </select>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.eu_citizen || false}
          onChange={(e) => onChange('eu_citizen', e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.personalDetails.euCitizen')}
        </label>
      </div>
    </div>
  );
}

// Income Details Fields Renderer
function renderIncomeFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.grossIncome')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.gross_income || ''}
          onChange={(e) => onChange('gross_income', parseFloat(e.target.value) || 0)}
          required
          className={baseClasses}
          placeholder={t('forms.income.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.netIncome')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.net_income || ''}
          onChange={(e) => onChange('net_income', parseFloat(e.target.value) || 0)}
          required
          className={baseClasses}
          placeholder={t('forms.income.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.taxClass')}
        </label>
        <input
          type="text"
          value={formData.tax_class || ''}
          onChange={(e) => onChange('tax_class', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.numberOfSalaries')}
        </label>
        <input
          type="number"
          min="12"
          max="14"
          value={formData.number_of_salaries || 12}
          onChange={(e) => onChange('number_of_salaries', parseInt(e.target.value) || 12)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.childBenefit')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.child_benefit || ''}
          onChange={(e) => onChange('child_benefit', parseFloat(e.target.value) || 0)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.income.otherIncome')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_income || ''}
          onChange={(e) => onChange('other_income', parseFloat(e.target.value) || 0)}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

// Add placeholder renderers for other form types
function renderFamilyDetailsFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.familyDetails.firstNameRequired')}
        </label>
        <input
          type="text"
          value={formData.first_name || ''}
          onChange={(e) => onChange('first_name', e.target.value)}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.familyDetails.lastNameRequired')}
        </label>
        <input
          type="text"
          value={formData.last_name || ''}
          onChange={(e) => onChange('last_name', e.target.value)}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.familyDetails.relationRequired')}
        </label>
        <select
          value={formData.relation || ''}
          onChange={(e) => onChange('relation', e.target.value)}
          required
          className={baseClasses}
        >
          <option value="">{t('forms.dynamic.select')}</option>
          <option value="Spouse">{t('forms.familyDetails.spouse')}</option>
          <option value="Child">{t('forms.familyDetails.child')}</option>
          <option value="Parent">{t('forms.familyDetails.parent')}</option>
          <option value="Other">{t('forms.dynamic.other')}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.familyDetails.birthDateRequired')}
        </label>
        <input
          type="date"
          value={formData.birth_date || ''}
          onChange={(e) => onChange('birth_date', e.target.value)}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.familyDetails.nationalityRequired')}
        </label>
        <input
          type="text"
          value={formData.nationality || ''}
          onChange={(e) => onChange('nationality', e.target.value)}
          required
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderEmploymentFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.employment.occupation')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <input
          type="text"
          value={formData.occupation || ''}
          onChange={(e) => onChange('occupation', e.target.value)}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.employment.contractType')}
        </label>
        <select
          value={formData.contract_type || ''}
          onChange={(e) => onChange('contract_type', e.target.value)}
          className={baseClasses}
        >
          <option value="">{t('forms.employment.selectContractType')}</option>
          <option value="Permanent">{t('forms.employment.permanent')}</option>
          <option value="Temporary">{t('forms.employment.temporary')}</option>
          <option value="Fixed-term">{t('forms.employment.fixedTerm')}</option>
          <option value="Freelance">{t('forms.employment.freelance')}</option>
          <option value="Part-time">{t('forms.employment.partTime')}</option>
          <option value="Full-time">{t('forms.employment.fullTime')}</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.employment.employerName')}
        </label>
        <input
          type="text"
          value={formData.employer_name || ''}
          onChange={(e) => onChange('employer_name', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.employment.employedSince')}
        </label>
        <input
          type="date"
          value={formData.employed_since || ''}
          onChange={(e) => onChange('employed_since', e.target.value)}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderExpensesFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.coldRent')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.cold_rent || ''}
          onChange={(e) => onChange('cold_rent', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.electricity')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.electricity || ''}
          onChange={(e) => onChange('electricity', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.livingExpenses')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.living_expenses || ''}
          onChange={(e) => onChange('living_expenses', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.gas')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.gas || ''}
          onChange={(e) => onChange('gas', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.telecommunication')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.telecommunication || ''}
          onChange={(e) => onChange('telecommunication', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.expenses.otherExpenses')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_expenses || ''}
          onChange={(e) => onChange('other_expenses', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.expenses.monthlyAmount')}
        />
      </div>
    </div>
  );
}

function renderAssetsFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.realEstate')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.real_estate || ''}
          onChange={(e) => onChange('real_estate', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.securities')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.securities || ''}
          onChange={(e) => onChange('securities', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.bankDeposits')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.bank_deposits || ''}
          onChange={(e) => onChange('bank_deposits', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.buildingSavings')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.building_savings || ''}
          onChange={(e) => onChange('building_savings', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.insuranceValues')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.insurance_values || ''}
          onChange={(e) => onChange('insurance_values', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.assets.otherAssets')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_assets || ''}
          onChange={(e) => onChange('other_assets', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.assets.currentValue')}
        />
      </div>
    </div>
  );
}

function renderLiabilitiesFields(formData: any, onChange: (name: string, value: any) => void) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.liabilities.loanType')} <span className="text-red-500">{t('forms.dynamic.required')}</span>
        </label>
        <select
          value={formData.loan_type || ''}
          onChange={(e) => onChange('loan_type', e.target.value)}
          required
          className={baseClasses}
        >
          <option value="">{t('forms.liabilities.selectLoanType')}</option>
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
          value={formData.loan_bank || ''}
          onChange={(e) => onChange('loan_bank', e.target.value)}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.liabilities.loanAmount')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.loan_amount || ''}
          onChange={(e) => onChange('loan_amount', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.liabilities.amount')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.liabilities.loanMonthlyRate')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.loan_monthly_rate || ''}
          onChange={(e) => onChange('loan_monthly_rate', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.liabilities.monthlyPayment')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {t('forms.liabilities.loanInterest')}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.loan_interest || ''}
          onChange={(e) => onChange('loan_interest', parseFloat(e.target.value) || 0)}
          className={baseClasses}
          placeholder={t('forms.liabilities.interestRate')}
        />
      </div>
    </div>
  );
}

export default function DynamicForm() {
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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [signatureData, setSignatureData] = useState<string>('');
  const [showPdfLanguageDropdown, setShowPdfLanguageDropdown] = useState(false);
  const [selectedPdfLanguage, setSelectedPdfLanguage] = useState('en');

  useEffect(() => {
    loadFormData();
  }, [submissionId, configId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPdfLanguageDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.pdf-dropdown-container')) {
          setShowPdfLanguageDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPdfLanguageDropdown]);

  const loadFormData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (submissionId && submissionId !== 'new') {
        // Load existing submission
        const submissionResponse = await formSubmissionService.getFormSubmission(submissionId);
        if (submissionResponse.success && submissionResponse.data) {
          setSubmission(submissionResponse.data);
          setFormData(submissionResponse.data.form_data || {});
          // Load signature data if it exists
          setSignatureData(submissionResponse.data.form_data?.signature || '');

          console.log('Loading config for existing submission, form_config_id:', submissionResponse.data.form_config_id);
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
        console.log('Loading config for new submission, configId:', configId);
        // Create new submission
        const configResponse = await formSubmissionService.getFormConfiguration(configId);
        if (configResponse.success && configResponse.data) {
          setFormConfig(configResponse.data);
          
          // Pre-fill form with existing client data
          const prefilledData = await loadClientData(configResponse.data);
          setFormData(prefilledData);
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

  const loadClientData = async (config: FormConfigurationData): Promise<Record<string, any>> => {
    if (!user) return {};

    const prefilledData: Record<string, any> = {};
    
    // Determine user ID to load data for
    const userIdToLoad = user.role === 'CLIENT' ? user.id : null;
    if (!userIdToLoad) return {};

    // Helper function to format date for input (from existing forms)
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
      // Go through each section and pre-fill based on section type
      for (const section of config.sections) {
        const sectionTitle = section.title.toLowerCase();
        let sectionData = {};

        try {
          if (sectionTitle.includes('personal')) {
            const personalDetails = await formService.getPersonalDetailsById(userIdToLoad);
            sectionData = {
              salutation: personalDetails.salutation || '',
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
              housing: personalDetails.housing || '',
              eu_citizen: personalDetails.eu_citizen || false,
            };
          } else if (sectionTitle.includes('income')) {
            try {
              const incomeDetails = await formService.getIncomeById(userIdToLoad);
              sectionData = {
                gross_income: incomeDetails.gross_income || 0,
                net_income: incomeDetails.net_income || 0,
                tax_class: incomeDetails.tax_class || '',
                number_of_salaries: incomeDetails.number_of_salaries || 12,
                child_benefit: incomeDetails.child_benefit || 0,
                other_income: incomeDetails.other_income || 0,
              };
            } catch (error) {
              console.log('Income data not found, trying alternative method');
              // Try alternative approach if the first one fails
              try {
                const incomeList = await formService.getIncomeByUserId(userIdToLoad);
                if (incomeList && incomeList.length > 0) {
                  const income = incomeList[0];
                  sectionData = {
                    gross_income: income.gross_income || 0,
                    net_income: income.net_income || 0,
                    tax_class: income.tax_class || '',
                    number_of_salaries: income.number_of_salaries || 12,
                    child_benefit: income.child_benefit || 0,
                    other_income: income.other_income || 0,
                  };
                }
              } catch (secondError) {
                console.log('No income data found with either method');
              }
            }
          } else if (sectionTitle.includes('expenses')) {
            try {
              const expensesDetails = await formService.getExpensesById(userIdToLoad);
              sectionData = {
                cold_rent: expensesDetails.cold_rent || 0,
                electricity: expensesDetails.electricity || 0,
                living_expenses: expensesDetails.living_expenses || 0,
                other_expenses: expensesDetails.other_expenses || 0,
              };
            } catch (error) {
              console.log('Expenses data not found, trying alternative method');
              try {
                const expensesList = await formService.getExpensesByUserId(userIdToLoad);
                if (expensesList && expensesList.length > 0) {
                  const expenses = expensesList[0];
                  sectionData = {
                    cold_rent: expenses.cold_rent || 0,
                    electricity: expenses.electricity || 0,
                    living_expenses: expenses.living_expenses || 0,
                    other_expenses: expenses.other_expenses || 0,
                  };
                }
              } catch (secondError) {
                console.log('No expenses data found with either method');
              }
            }
          } else if (sectionTitle.includes('employment')) {
            try {
              // First try to get employment by user ID (which returns array)
              const employment = await formService.getEmploymentByUserId(userIdToLoad);
              if (employment) {
                sectionData = {
                  occupation: employment.occupation || '',
                  contract_type: employment.contract_type || '',
                  employer_name: employment.employer_name || '',
                  employed_since: formatDateForInput(employment.employed_since),
                };
              }
            } catch (error) {
              console.log('Employment data not found, trying alternative method');
              try {
                // Alternative: try to get by ID (this might work if userId == employmentId)
                const employmentDetails = await formService.getEmploymentById(userIdToLoad);
                sectionData = {
                  occupation: employmentDetails.occupation || '',
                  contract_type: employmentDetails.contract_type || '',
                  employer_name: employmentDetails.employer_name || '',
                  employed_since: formatDateForInput(employmentDetails.employed_since),
                };
              } catch (secondError) {
                console.log('No employment data found with either method');
              }
            }
          } else if (sectionTitle.includes('assets')) {
            try {
              // Use the correct method for getting assets by user ID
              const asset = await formService.getAssetsByUserId(userIdToLoad);
              if (asset) {
                // Use the first asset record and map to the form fields
                sectionData = {
                  real_estate: asset.real_estate || 0,
                  securities: asset.securities || 0,
                  bank_deposits: asset.bank_deposits || 0,
                  other_assets: asset.other_assets || 0,
                };
              }
            } catch (error) {
              console.log('Assets data not found, trying alternative method');
              try {
                // Alternative: try to get by ID (this might work if userId == assetId)
                const assetDetails = await formService.getAssetById(userIdToLoad);
                sectionData = {
                  real_estate: assetDetails.real_estate || 0,
                  securities: assetDetails.securities || 0,
                  bank_deposits: assetDetails.bank_deposits || 0,
                  other_assets: assetDetails.other_assets || 0,
                };
              } catch (secondError) {
                console.log('No assets data found with either method');
              }
            }
          } else if (sectionTitle.includes('liabilities')) {
            try {
              const liabilitiesList = await formService.getLiabilitiesByUserId(userIdToLoad);
              if (liabilitiesList && liabilitiesList.length > 0) {
                const liability = liabilitiesList[0]; // Use the first liability record
                sectionData = {
                  loan_type: liability.loan_type || '',
                  loan_bank: liability.loan_bank || '',
                  loan_amount: liability.loan_amount || 0,
                  loan_monthly_rate: liability.loan_monthly_rate || 0,
                };
              }
            } catch (error) {
              console.log('Liabilities data not found, trying alternative method');
              try {
                // Alternative: try to get by ID (this might work if userId == liabilityId)
                const liabilityDetails = await formService.getLiabilityById(userIdToLoad);
                sectionData = {
                  loan_type: liabilityDetails.loan_type || '',
                  loan_bank: liabilityDetails.loan_bank || '',
                  loan_amount: liabilityDetails.loan_amount || 0,
                  loan_monthly_rate: liabilityDetails.loan_monthly_rate || 0,
                };
              } catch (secondError) {
                console.log('No liabilities data found with either method');
              }
            }
          } else if (sectionTitle.includes('family')) {
            const familyMembers = await formService.getFamilyMembersByUserId(userIdToLoad);
            if (familyMembers && familyMembers.length > 0) {
              const familyMember = familyMembers[0]; // Use the first family member
              sectionData = {
                first_name: familyMember.first_name || '',
                last_name: familyMember.last_name || '',
                relation: familyMember.relation || '',
                birth_date: formatDateForInput(familyMember.birth_date),
                nationality: familyMember.nationality || '',
              };
            }
          }
        } catch (error) {
          console.log(`No ${sectionTitle} data found for user ${userIdToLoad}, continuing with empty section:`, error);
          // Continue with empty section data if API call fails
        }

        if (Object.keys(sectionData).length > 0) {
          prefilledData[section.id] = sectionData;
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      // Return empty data if there's an error, don't break the form
    }

    console.log('Pre-filled form data:', prefilledData);
    return prefilledData;
  };

  const handleSectionChange = (sectionId: string, sectionData: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        ...sectionData
      }
    }));
  };

  const handleSave = async (asSubmitted = false) => {
    if (!user || !formConfig) return;

    try {
      setSaving(true);

      // Ensure we're using config_id consistently
      const configIdToStore = formConfig.config_id || configId;
      console.log('🔧 Saving form with config_id:', configIdToStore);

      const submissionData: Omit<FormSubmissionData, 'id' | 'created_at' | 'updated_at'> = {
        form_config_id: configIdToStore!,
        user_id: user.id,
        form_data: { ...formData, signature: signatureData },
        status: asSubmitted ? 'submitted' : 'draft',
      };
      
      if (asSubmitted) {
        submissionData.submitted_at = new Date();
      }

      let response;
      if (submission?.id) {
        // Update existing submission
        response = await formSubmissionService.updateFormSubmission(submission.id, submissionData);
      } else {
        // Create new submission
        response = await formSubmissionService.createFormSubmission(submissionData);
      }

      if (response.success) {
        showSuccess(t('common.success'), asSubmitted ? t('forms.dynamic.submitSuccess') : t('forms.dynamic.saveSuccess'));
        if (response.data) {
          setSubmission(response.data);
          console.log('Saved submission with form_config_id:', response.data.form_config_id);
          if (asSubmitted) {
            // Navigate to document upload page after successful submission
            const submissionId = response.data.id;
            if (submissionId && formConfig?.documents && formConfig.documents.length > 0) {
              navigate(`/dashboard/forms/documents/single/${submissionId}`);
            } else {
              // No documents to upload, go back to forms list
              navigate('/dashboard/forms');
            }
          }
        }
      } else {
        showError(t('common.error'), response.message || t('forms.dynamic.submitError'));
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

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleExportPDF = async (exportLanguage?: string) => {
    if (!user || !formConfig) return;

    const langToUse = exportLanguage || selectedPdfLanguage;
    console.log('🔍 Exporting PDF in language:', langToUse);
    console.log('🔍 exportLanguage param:', exportLanguage);
    console.log('🔍 selectedPdfLanguage state:', selectedPdfLanguage);

    try {
      setSaving(true);

      // Create translation function for selected language
      console.log('🔍 Creating translation function for:', langToUse);
      const tPdf = createTranslationFunction(langToUse);
      console.log('🔍 Translation function created, testing key:', tPdf('forms.pdf.formSubmissionReport'));
      console.log('🔍 Testing more keys:');
      console.log('  - forms.pdf.formInformation:', tPdf('forms.pdf.formInformation'));
      console.log('  - forms.pdf.clientInformation:', tPdf('forms.pdf.clientInformation'));
      console.log('  - forms.pdf.formContent:', tPdf('forms.pdf.formContent'));
      console.log('  - forms.pdf.notProvided:', tPdf('forms.pdf.notProvided'));
      console.log('  - forms.pdf.yes:', tPdf('forms.pdf.yes'));
      console.log('  - forms.pdf.no:', tPdf('forms.pdf.no'));

      // Prepare metadata
      const metadata = {
        formName: formConfig.name,
        formType: formConfig.form_type,
        version: formConfig.version.toString(),
        description: formConfig.description || '',
        submissionDate: submission?.submitted_at 
          ? new Date(submission.submitted_at).toLocaleDateString(langToUse === 'de' ? 'de-DE' : langToUse === 'es' ? 'es-ES' : 'en-US')
          : new Date().toLocaleDateString(langToUse === 'de' ? 'de-DE' : langToUse === 'es' ? 'es-ES' : 'en-US'),
        clientName: (() => {
          // Try to get name from different possible section structures
          const sections = Object.values(formData);
          for (const section of sections) {
            if (section && typeof section === 'object') {
              const firstName = section.first_name || section.firstName;
              const lastName = section.last_name || section.lastName;
              if (firstName || lastName) {
                return `${firstName || ''} ${lastName || ''}`.trim();
              }
            }
          }
          return user.email?.split('@')[0] || 'N/A';
        })(),
        clientEmail: (() => {
          // Try to get email from different possible section structures
          const sections = Object.values(formData);
          for (const section of sections) {
            if (section && typeof section === 'object' && section.email) {
              return section.email;
            }
          }
          return user.email || 'N/A';
        })(),
        status: submission?.status || 'draft'
      };

      // Extract form sections with selected language
      const sections = extractFormSections(formConfig, formData, tPdf);

      // Create PDF exporter and generate PDF with selected language
      const pdfExporter = new PDFExporter();
      await pdfExporter.generatePDF(metadata, sections, signatureData, tPdf, langToUse);

      showSuccess(t('common.success'), t('forms.dynamic.pdfExported') || 'PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError(t('common.error'), t('forms.dynamic.pdfExportError') || 'Failed to export PDF. Please try again.');
    } finally {
      setSaving(false);
      setShowPdfLanguageDropdown(false);
    }
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
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Form configuration not found
            {t('forms.dynamic.formNotFound')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/forms')}>
              ← {t('forms.list.backToForms')}
          </Button>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formConfig.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {formConfig.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                {formConfig.form_type}
              </span>
              <span className="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 px-2 py-1 rounded">
                v{formConfig.version}
              </span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {formConfig.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
                          <DynamicSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={handleSectionChange}
              />
          ))}
      </div>

      {/* Consent Form */}
      {formConfig.consent_forms && formConfig.consent_forms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <div className="space-y-6">
            {formConfig.consent_forms.map((consentForm, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {consentForm.title}
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border max-h-60 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{consentForm.content}</p>
                </div>
                <div className="mt-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData[`consent_${index}`] || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, [`consent_${index}`]: e.target.checked }))}
                      required={consentForm.required}
                      className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {consentForm.checkboxText}
                      {consentForm.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('forms.dynamic.signature') || 'Signature'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('forms.dynamic.signatureDescription') || 'Please provide your signature to complete the form submission.'}
        </p>
        <SignaturePad
          onSave={handleSignatureSave}
          initialValue={signatureData}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {submission?.id ? t('forms.dynamic.lastSaved') + ' ' + new Date(submission.updated_at || '').toLocaleString() : t('forms.dynamic.notSavedYet')}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? t('forms.dynamic.saving') : t('forms.dynamic.saveDraft')}
            </Button>
            <div className="relative pdf-dropdown-container">
              <Button
                variant="outline"
                onClick={() => setShowPdfLanguageDropdown(!showPdfLanguageDropdown)}
                disabled={saving}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
              >
                {saving ? t('forms.dynamic.exporting') || 'Exporting...' : 
                  `${t('forms.dynamic.exportPDF') || 'Export PDF'} (${selectedPdfLanguage.toUpperCase()})`}
                <span className="ml-1">▼</span>
              </Button>
              
              {showPdfLanguageDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[150px]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedPdfLanguage('en');
                        handleExportPDF('en');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🇺🇸 English
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPdfLanguage('de');
                        handleExportPDF('de');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🇩🇪 Deutsch
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPdfLanguage('es');
                        handleExportPDF('es');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🇪🇸 Español
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? t('forms.dynamic.submitting') : t('forms.dynamic.submitForm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 