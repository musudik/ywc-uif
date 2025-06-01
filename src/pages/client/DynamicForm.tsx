import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import formSubmissionService, { type FormSubmissionData } from '../../services/formSubmissionService';
import { formService } from '../../services/formService';
import type { FormConfigurationData } from '../../services/configToolService';
import type { Section, FormField } from '../../types';

// Dynamic field component
function DynamicField({ field, value, onChange, disabled }: {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
  disabled: boolean;
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
function DynamicSection({ section, formData, onChange, disabled }: {
  section: Section;
  formData: Record<string, any>;
  onChange: (sectionData: Record<string, any>) => void;
  disabled: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFieldChange = (fieldName: string, value: any) => {
    const newSectionData = {
      ...formData[section.id] || {},
      [fieldName]: value
    };
    onChange({ [section.id]: newSectionData });
  };

  // Check if this section should use an existing form component
  const renderExistingFormFields = (sectionTitle: string) => {
    const title = sectionTitle.toLowerCase();
    const sectionData = formData[section.id] || {};
    
    if (title.includes('personal')) {
      return renderPersonalDetailsFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('family')) {
      return renderFamilyDetailsFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('employment')) {
      return renderEmploymentFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('income')) {
      return renderIncomeFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('expenses')) {
      return renderExpensesFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('assets')) {
      return renderAssetsFields(sectionData, handleFieldChange, disabled);
    } else if (title.includes('liabilities')) {
      return renderLiabilitiesFields(sectionData, handleFieldChange, disabled);
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
                  disabled={disabled}
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
function renderPersonalDetailsFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Salutation
        </label>
        <input
          type="text"
          value={formData.salutation || ''}
          onChange={(e) => onChange('salutation', e.target.value)}
          disabled={disabled}
          className={baseClasses}
          placeholder="Mr./Ms./Dr."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.first_name || ''}
          onChange={(e) => onChange('first_name', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.last_name || ''}
          onChange={(e) => onChange('last_name', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Street <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.street || ''}
          onChange={(e) => onChange('street', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          House Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.house_number || ''}
          onChange={(e) => onChange('house_number', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Postal Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.postal_code || ''}
          onChange={(e) => onChange('postal_code', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Birth Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.birth_date || ''}
          onChange={(e) => onChange('birth_date', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Birth Place <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.birth_place || ''}
          onChange={(e) => onChange('birth_place', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Nationality <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.nationality || ''}
          onChange={(e) => onChange('nationality', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Marital Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.marital_status || ''}
          onChange={(e) => onChange('marital_status', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        >
          <option value="">Select...</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Housing <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.housing || ''}
          onChange={(e) => onChange('housing', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        >
          <option value="">Select...</option>
          <option value="owned">Owned</option>
          <option value="rented">Rented</option>
          <option value="livingWithParents">Living with Parents</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.eu_citizen || false}
          onChange={(e) => onChange('eu_citizen', e.target.checked)}
          disabled={disabled}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          EU Citizen
        </label>
      </div>
    </div>
  );
}

// Income Details Fields Renderer
function renderIncomeFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Gross Income <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.gross_income || ''}
          onChange={(e) => onChange('gross_income', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          required
          className={baseClasses}
          placeholder="Monthly gross income"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Net Income <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.net_income || ''}
          onChange={(e) => onChange('net_income', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          required
          className={baseClasses}
          placeholder="Monthly net income"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Tax Class
        </label>
        <input
          type="text"
          value={formData.tax_class || ''}
          onChange={(e) => onChange('tax_class', e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Number of Salaries
        </label>
        <input
          type="number"
          min="12"
          max="14"
          value={formData.number_of_salaries || 12}
          onChange={(e) => onChange('number_of_salaries', parseInt(e.target.value) || 12)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Child Benefit
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.child_benefit || ''}
          onChange={(e) => onChange('child_benefit', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Other Income
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_income || ''}
          onChange={(e) => onChange('other_income', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

// Add placeholder renderers for other form types
function renderFamilyDetailsFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.first_name || ''}
          onChange={(e) => onChange('first_name', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.last_name || ''}
          onChange={(e) => onChange('last_name', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Relation <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.relation || ''}
          onChange={(e) => onChange('relation', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        >
          <option value="">Select...</option>
          <option value="Spouse">Spouse</option>
          <option value="Child">Child</option>
          <option value="Parent">Parent</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Birth Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.birth_date || ''}
          onChange={(e) => onChange('birth_date', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Nationality <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.nationality || ''}
          onChange={(e) => onChange('nationality', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderEmploymentFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Occupation <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.occupation || ''}
          onChange={(e) => onChange('occupation', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Contract Type
        </label>
        <input
          type="text"
          value={formData.contract_type || ''}
          onChange={(e) => onChange('contract_type', e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Employer Name
        </label>
        <input
          type="text"
          value={formData.employer_name || ''}
          onChange={(e) => onChange('employer_name', e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Employed Since
        </label>
        <input
          type="date"
          value={formData.employed_since || ''}
          onChange={(e) => onChange('employed_since', e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderExpensesFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Cold Rent
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.cold_rent || ''}
          onChange={(e) => onChange('cold_rent', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Electricity
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.electricity || ''}
          onChange={(e) => onChange('electricity', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Living Expenses
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.living_expenses || ''}
          onChange={(e) => onChange('living_expenses', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Other Expenses
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_expenses || ''}
          onChange={(e) => onChange('other_expenses', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderAssetsFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Real Estate
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.real_estate || ''}
          onChange={(e) => onChange('real_estate', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Securities
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.securities || ''}
          onChange={(e) => onChange('securities', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Bank Deposits
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.bank_deposits || ''}
          onChange={(e) => onChange('bank_deposits', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Other Assets
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.other_assets || ''}
          onChange={(e) => onChange('other_assets', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>
    </div>
  );
}

function renderLiabilitiesFields(formData: any, onChange: (name: string, value: any) => void, disabled: boolean) {
  const baseClasses = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Loan Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.loan_type || ''}
          onChange={(e) => onChange('loan_type', e.target.value)}
          disabled={disabled}
          required
          className={baseClasses}
        >
          <option value="">Select...</option>
          <option value="PersonalLoan">Personal Loan</option>
          <option value="HomeLoan">Home Loan</option>
          <option value="CarLoan">Car Loan</option>
          <option value="BusinessLoan">Business Loan</option>
          <option value="EducationLoan">Education Loan</option>
          <option value="OtherLoan">Other Loan</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Loan Bank
        </label>
        <input
          type="text"
          value={formData.loan_bank || ''}
          onChange={(e) => onChange('loan_bank', e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Loan Amount
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.loan_amount || ''}
          onChange={(e) => onChange('loan_amount', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Monthly Rate
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.loan_monthly_rate || ''}
          onChange={(e) => onChange('loan_monthly_rate', parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={baseClasses}
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfigurationData | null>(null);
  const [submission, setSubmission] = useState<FormSubmissionData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isViewMode, setIsViewMode] = useState(false);

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
          setFormData(submissionResponse.data.submission_data || {});
          setIsViewMode(submissionResponse.data.status !== 'draft');

          // Load form configuration
          const configResponse = await formSubmissionService.getFormConfiguration(submissionResponse.data.form_config_id);
          if (configResponse.success && configResponse.data) {
            setFormConfig(configResponse.data);
          }
        } else {
          showError('Error', 'Failed to load form submission');
          navigate('/dashboard/forms');
        }
      } else if (configId) {
        // Create new submission
        const configResponse = await formSubmissionService.getFormConfiguration(configId);
        if (configResponse.success && configResponse.data) {
          setFormConfig(configResponse.data);
          
          // Pre-fill form with existing client data
          const prefilledData = await loadClientData(configResponse.data);
          setFormData(prefilledData);
          setIsViewMode(false);
        } else {
          showError('Error', 'Failed to load form configuration');
          navigate('/dashboard/forms');
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      showError('Error', 'Failed to load form data');
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

  const handleSectionChange = (sectionData: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...sectionData
    }));
  };

  const handleSave = async (asSubmitted = false) => {
    if (!user || !formConfig) return;

    try {
      setSaving(true);

      const submissionData: Omit<FormSubmissionData, 'id' | 'created_at' | 'updated_at'> = {
        form_config_id: formConfig.config_id || '',
        user_id: user.id,
        form_data: formData,
        status: asSubmitted ? 'submitted' : 'draft',
        submitted_at: asSubmitted ? new Date().toISOString() : undefined
      };

      let response;
      if (submission?.id) {
        // Update existing submission
        response = await formSubmissionService.updateFormSubmission(submission.id, submissionData);
      } else {
        // Create new submission
        response = await formSubmissionService.createFormSubmission(submissionData);
      }

      if (response.success) {
        showSuccess('Success', asSubmitted ? 'Form submitted successfully!' : 'Form saved as draft');
        if (response.data) {
          setSubmission(response.data);
          if (asSubmitted) {
            setIsViewMode(true);
          }
        }
      } else {
        showError('Error', response.message || 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      showError('Error', 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    handleSave(true);
  };

  const handleEdit = () => {
    setIsViewMode(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading form...</span>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
              {submission && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  submission.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' :
                  submission.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  submission.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard/forms')}>
              ← Back to Forms
            </Button>
            {isViewMode && submission?.status === 'draft' && (
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
            )}
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
              disabled={isViewMode}
            />
          ))}
      </div>

      {/* Consent Form */}
      {formConfig.consent_form?.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 dark:border-gray-600 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {formConfig.consent_form.title}
            </h3>
          </div>
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{formConfig.consent_form.content}</p>
            </div>
            {!isViewMode && (
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.consent_agreed || false}
                    onChange={(e) => handleSectionChange({ consent_agreed: e.target.checked })}
                    required={formConfig.consent_form.required}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formConfig.consent_form.checkboxText}
                    {formConfig.consent_form.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isViewMode && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {submission?.id ? 'Last saved: ' + new Date(submission.updated_at || '').toLocaleString() : 'Not saved yet'}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Form'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 