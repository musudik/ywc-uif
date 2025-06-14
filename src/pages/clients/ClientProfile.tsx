import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '../../services/formService';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Tab } from '@headlessui/react';
import PersonalDetailsForm from '../forms/PersonalDetailsForm';
import FamilyDetailsForm from '../forms/FamilyDetailsForm';
import EmploymentForm from '../forms/EmploymentForm';
import IncomeForm from '../forms/IncomeForm';
import ExpensesForm from '../forms/ExpensesForm';
import AssetsForm from '../forms/AssetsForm';
import LiabilitiesForm from '../forms/LiabilitiesForm';
import TextInput from '../../components/ui/TextInput';

interface ClientData {
  personalDetails: any;
  familyDetails: any[];
  employmentDetails: any;
  incomeDetails: any;
  expensesDetails: any;
  liabilitiesDetails: any;
  formsSubmitted: any[];
}

interface TabConfig {
  name: string;
  content: any;
  component: React.ComponentType | null;
  path: string;
}

// Reusable form field display component
const FormField = ({ label, value }: { label: string; value: any }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="text-gray-900 dark:text-white">
      {value || '-'}
    </div>
  </div>
);

// Section display components
const PersonalDetailsDisplay = ({ data }: { data: any }) => {
  if (!data) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
        <FormField label="Salutation" value={data.salutation} />
        <FormField label="First Name" value={data.first_name} />
        <FormField label="Last Name" value={data.last_name} />
        <FormField label="Email" value={data.email} />
        <FormField label="Phone" value={data.phone} />
        <FormField label="WhatsApp" value={data.whatsapp} />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
        <FormField label="Street" value={data.street} />
        <FormField label="House Number" value={data.house_number} />
        <FormField label="Postal Code" value={data.postal_code} />
        <FormField label="City" value={data.city} />
        <FormField label="Housing Situation" value={data.housing} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
        <FormField label="Date of Birth" value={data.birth_date} />
        <FormField label="Place of Birth" value={data.birth_place} />
        <FormField label="Nationality" value={data.nationality} />
        <FormField label="Marital Status" value={data.marital_status} />
        <FormField label="EU Citizen" value={data.eu_citizen ? 'Yes' : 'No'} />
        <FormField label="Residence Permit" value={data.residence_permit} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Information</h3>
        <FormField label="Tax ID" value={data.tax_id} />
        <FormField label="IBAN" value={data.iban} />
      </div>
    </div>
  );
};

const FamilyDetailsDisplay = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      {data.map((member, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {member.relation}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="First Name" value={member.first_name} />
            <FormField label="Last Name" value={member.last_name} />
            <FormField label="Date of Birth" value={member.birth_date} />
            <FormField label="Nationality" value={member.nationality} />
            <FormField label="Tax ID" value={member.tax_id} />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmploymentDetailsDisplay = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Employment Information</h3>
        <FormField label="Employment Type" value={data.employment_type} />
        <FormField label="Occupation" value={data.occupation} />
        <FormField label="Contract Type" value={data.contract_type} />
        <FormField label="Contract Duration" value={data.contract_duration} />
        <FormField label="Employer Name" value={data.employer_name} />
        <FormField label="Employed Since" value={data.employed_since} />
      </div>
    </div>
  );
};

const IncomeDetailsDisplay = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Income Information</h3>
        <FormField label="Gross Income" value={`€${data.gross_income?.toLocaleString()}`} />
        <FormField label="Net Income" value={`€${data.net_income?.toLocaleString()}`} />
        <FormField label="Tax Class" value={data.tax_class} />
        <FormField label="Number of Salaries" value={data.number_of_salaries} />
        <FormField label="Child Benefit" value={`€${data.child_benefit?.toLocaleString()}`} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Income</h3>
        <FormField label="Other Income" value={`€${data.other_income?.toLocaleString()}`} />
        <FormField label="Trade/Business Income" value={`€${data.income_trade_business?.toLocaleString()}`} />
        <FormField label="Self-Employed Income" value={`€${data.income_self_employed_work?.toLocaleString()}`} />
        <FormField label="Side Job Income" value={`€${data.income_side_job?.toLocaleString()}`} />
      </div>
    </div>
  );
};

const ExpensesDetailsDisplay = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Expenses</h3>
        <FormField label="Rent/Mortgage" value={`€${data.rent_mortgage?.toLocaleString()}`} />
        <FormField label="Utilities" value={`€${data.utilities?.toLocaleString()}`} />
        <FormField label="Insurance" value={`€${data.insurance?.toLocaleString()}`} />
        <FormField label="Transportation" value={`€${data.transportation?.toLocaleString()}`} />
        <FormField label="Food & Groceries" value={`€${data.food_groceries?.toLocaleString()}`} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Other Expenses</h3>
        <FormField label="Entertainment" value={`€${data.entertainment?.toLocaleString()}`} />
        <FormField label="Education" value={`€${data.education?.toLocaleString()}`} />
        <FormField label="Healthcare" value={`€${data.healthcare?.toLocaleString()}`} />
        <FormField label="Other Expenses" value={`€${data.other_expenses?.toLocaleString()}`} />
      </div>
    </div>
  );
};

const LiabilitiesDetailsDisplay = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Liabilities Information</h3>
        <FormField label="Total Liabilities" value={`€${data.total_liabilities?.toLocaleString()}`} />
        <FormField label="Monthly Payments" value={`€${data.monthly_payments?.toLocaleString()}`} />
        <FormField label="Interest Rate" value={`${data.interest_rate}%`} />
        <FormField label="Remaining Term" value={data.remaining_term} />
      </div>
    </div>
  );
};

const FormsSubmittedDisplay = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-4">
      {data.map((form, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {form.form_name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Submitted Date" value={form.submitted_date} />
            <FormField label="Status" value={form.status} />
            <FormField label="Version" value={form.version} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        const data: ClientData = {
          personalDetails: null,
          familyDetails: [],
          employmentDetails: null,
          incomeDetails: null,
          expensesDetails: null,
          liabilitiesDetails: null,
          formsSubmitted: []
        };

        // Load Personal Details
        try {
          data.personalDetails = await formService.getPersonalDetailsById(clientId);
        } catch (error) {
          console.error('Error loading personal details:', error);
        }

        // Load Family Details
        try {
          data.familyDetails = await formService.getFamilyMembersByUserId(clientId);
        } catch (error) {
          console.error('Error loading family details:', error);
        }

        // Load Employment Details
        try {
          data.employmentDetails = await formService.getEmploymentById(clientId);
        } catch (error) {
          console.error('Error loading employment details:', error);
        }

        // Load Income Details
        try {
          data.incomeDetails = await formService.getIncomeById(clientId);
        } catch (error) {
          console.error('Error loading income details:', error);
        }

        // Load Expenses Details
        try {
          data.expensesDetails = await formService.getExpensesByUserId(clientId);
        } catch (error) {
          console.error('Error loading expenses details:', error);
        }

        // Load Liabilities Details
        try {
          data.liabilitiesDetails = await formService.getLiabilityById(clientId);
        } catch (error) {
          console.error('Error loading liabilities details:', error);
        }

        setClientData(data);
      } catch (error) {
        showError('Error', 'Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [clientId, showError]);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const handleSave = async () => {
    // The save functionality is handled by each individual form component
    setIsEditMode(false);
  };

  const tabs: TabConfig[] = [
    { 
      name: 'Personal Details', 
      content: clientData?.personalDetails,
      component: PersonalDetailsForm,
      path: `/dashboard/forms/personal-details/${clientId}`
    },
    { 
      name: 'Family Details', 
      content: clientData?.familyDetails,
      component: FamilyDetailsForm,
      path: `/dashboard/forms/family-details?personal_id=${clientId}`
    },
    { 
      name: 'Employment Details', 
      content: clientData?.employmentDetails,
      component: EmploymentForm,
      path: `/dashboard/forms/employment?personal_id=${clientId}`
    },
    { 
      name: 'Income', 
      content: clientData?.incomeDetails,
      component: IncomeForm,
      path: `/dashboard/forms/income?personal_id=${clientId}`
    },
    { 
      name: 'Expenses', 
      content: clientData?.expensesDetails,
      component: ExpensesForm,
      path: `/dashboard/forms/expenses?personal_id=${clientId}`
    },
    { 
      name: 'Liabilities', 
      content: clientData?.liabilitiesDetails,
      component: LiabilitiesForm,
      path: `/dashboard/forms/liabilities?personal_id=${clientId}`
    },
    { 
      name: 'Forms Submitted', 
      content: clientData?.formsSubmitted,
      component: null,
      path: ''
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {clientData?.personalDetails ? 
              `${clientData.personalDetails.first_name} ${clientData.personalDetails.last_name}` : 
              `Client ID: ${clientId}`}
          </p>
        </div>
        <div className="flex space-x-4">
          {!isEditMode ? (
            <Button variant="outline" onClick={handleEdit}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Clients
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 p-4">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${selected
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="p-4">
            {tabs.map((tab) => (
              <Tab.Panel key={tab.name}>
                <div className="space-y-4">
                  {isEditMode && tab.component && (
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="primary"
                        onClick={() => navigate(tab.path)}
                      >
                        Edit {tab.name}
                      </Button>
                    </div>
                  )}
                  
                  {tab.name === 'Personal Details' && <PersonalDetailsDisplay data={tab.content} />}
                  {tab.name === 'Family Details' && <FamilyDetailsDisplay data={tab.content} />}
                  {tab.name === 'Employment Details' && <EmploymentDetailsDisplay data={tab.content} />}
                  {tab.name === 'Income' && <IncomeDetailsDisplay data={tab.content} />}
                  {tab.name === 'Expenses' && <ExpensesDetailsDisplay data={tab.content} />}
                  {tab.name === 'Liabilities' && <LiabilitiesDetailsDisplay data={tab.content} />}
                  {tab.name === 'Forms Submitted' && <FormsSubmittedDisplay data={tab.content} />}
                  
                  {!tab.content && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No data available for this section
                    </div>
                  )}
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 