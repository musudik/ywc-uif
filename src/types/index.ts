// Common type definitions for the application

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =====================
// USER MANAGEMENT TYPES
// =====================

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  coach_id?: string; // ID of assigned coach (for clients)
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  CLIENT = 'CLIENT',
  GUEST = 'GUEST'
}

export enum Permission {
  MANAGE_USERS = 'MANAGE_USERS',
  CREATE_COACHES = 'CREATE_COACHES',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_CLIENTS = 'MANAGE_CLIENTS',
  MANAGE_COACHES = 'MANAGE_COACHES',
  MANAGE_CONTENT = 'MANAGE_CONTENT',
  VIEW_REPORTS = 'VIEW_REPORTS',
  CREATE_CLIENTS = 'CREATE_CLIENTS',
  MANAGE_OWN_CLIENTS = 'MANAGE_OWN_CLIENTS',
  VIEW_CLIENT_DATA = 'VIEW_CLIENT_DATA',
  CREATE_REPORTS = 'CREATE_REPORTS',
  VIEW_OWN_DATA = 'VIEW_OWN_DATA',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  REQUEST_SERVICES = 'REQUEST_SERVICES',
  VIEW_PUBLIC_CONTENT = 'VIEW_PUBLIC_CONTENT'
}

// =====================
// SHARED FORM TYPES
// =====================

export type ApplicantType = 'PrimaryApplicant' | 'SecondaryApplicant';
export type EmploymentType = 'PrimaryEmployment' | 'SecondaryEmployment';
export type LoanType =
  | 'PersonalLoan'
  | 'HomeLoan'
  | 'CarLoan'
  | 'BusinessLoan'
  | 'EducationLoan'
  | 'OtherLoan';

// =====================
// PERSONAL DETAILS SECTION
// =====================

export interface Children {
  child_id: string;
  personal_id: string;
  first_name: string;
  last_name: string;
  birth_date: string; // ISO string
  nationality: string;
  created_at: Date;
  updated_at: Date;
}

export interface FamilyDetails {
  family_id: string;
  personal_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
  created_at: Date;
  updated_at: Date;
}

export interface PersonalDetails {
  personal_id: string;
  user_id: string;
  coach_id: string;
  applicant_type: ApplicantType;
  salutation: string;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  email: string;
  phone: string;
  whatsapp: string;
  marital_status: string;
  birth_date: string; // ISO string
  birth_place: string;
  nationality: string;
  residence_permit: string;
  eu_citizen: boolean;
  tax_id: string;
  iban: string;
  housing: string;
  created_at: Date;
  updated_at: Date;
}

// =====================
// EMPLOYMENT DETAILS SECTION
// =====================

export interface EmploymentDetails {
  employment_id: string;
  user_id: string;
  employment_type: EmploymentType;
  occupation: string;
  contract_type: string;
  contract_duration: string;
  employer_name: string;
  employed_since: string; // ISO string
  employer_address: string; // TODO: add this field 
  employer_phone: string; // TODO: add this field 
  created_at: Date;
  updated_at: Date;
}

// =====================
// INCOME DETAILS SECTION
// =====================

export interface IncomeDetails {
  income_id: string;
  user_id: string;
  gross_income: number;
  net_income: number;
  tax_class: string;
  tax_id: string;
  number_of_salaries: number;
  child_benefit: number;
  other_income: number;
  income_trade_business: number;
  income_self_employed_work: number;
  income_side_job: number;
  created_at: Date;
  updated_at: Date;
}

// =====================
// EXPENSES DETAILS SECTION
// =====================

export interface ExpensesDetails {
  expenses_id: string;
  user_id: string;
  cold_rent: number;
  electricity: number;
  living_expenses: number;
  gas: number;
  telecommunication: number;
  account_maintenance_fee: number;
  alimony: number;
  subscriptions: number;
  other_expenses: number;
  created_at: Date;
  updated_at: Date;
}

// =====================
// ASSETS SECTION
// =====================

export interface Asset {
  asset_id: string;
  user_id: string;
  real_estate: number;
  securities: number;
  bank_deposits: number;
  building_savings: number;
  insurance_values: number;
  other_assets: number;
  created_at: Date;
  updated_at: Date;
}

// =====================
// LIABILITIES SECTION
// =====================

export interface Liability {
  liability_id: string;
  user_id: string;
  loan_type: LoanType;
  loan_bank?: string;
  loan_amount?: number;
  loan_monthly_rate?: number;
  loan_interest?: number;
  created_at: Date;
  updated_at: Date;
}

// =====================
// FORM MANAGEMENT TYPES
// =====================

export interface Form {
  form_id: string;
  user_id: string;
  form_type: 'financial-profile' | 'risk-assessment' | 'goal-setting' | 'other';
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submitted_at?: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FormDocument {
  document_id: string;
  form_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: Date;
}

// =====================
// PERSON AGGREGATE TYPE
// =====================

export interface Person {
  personalDetails: PersonalDetails;
  employmentDetails: EmploymentDetails[];
  incomeDetails: IncomeDetails[];
  expensesDetails: ExpensesDetails[];
  assets: Asset[];
  liabilities: Liability[];
  familyDetails?: FamilyDetails;
  children?: Children[];
}

export type FamilyRelation = 'Spouse' | 'Child' | 'Parent' | 'Other';

export interface FamilyMember {
  family_member_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  relation: FamilyRelation;
  birth_date: string; // ISO string
  nationality: string;
  tax_id?: string;
  created_at: Date;
  updated_at: Date;
}

// =====================
// FORM CONFIGURATION TYPES
// =====================

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface Section {
  id: string;
  order: number;
  title: string;
  description: string;
  fields: FormField[];
  required: boolean;
  collapsible: boolean;
}

// Predefined section configurations based on existing forms
export const SECTION_DEFINITIONS: Record<string, Omit<Section, 'id' | 'order' | 'collapsible'>> = {
  personal: {
    title: 'Personal Details',
    description: 'Basic personal and contact information',
    required: true,
    fields: [
      { id: 'coach_id', name: 'coach_id', type: 'text', required: true, label: 'Coach ID' },
      { id: 'applicant_type', name: 'applicant_type', type: 'select', required: true, label: 'Applicant Type', options: ['PrimaryApplicant', 'SecondaryApplicant'] },
      { id: 'salutation', name: 'salutation', type: 'text', required: false, label: 'Salutation' },
      { id: 'first_name', name: 'first_name', type: 'text', required: true, label: 'First Name' },
      { id: 'last_name', name: 'last_name', type: 'text', required: true, label: 'Last Name' },
      { id: 'street', name: 'street', type: 'text', required: true, label: 'Street' },
      { id: 'house_number', name: 'house_number', type: 'text', required: true, label: 'House Number' },
      { id: 'postal_code', name: 'postal_code', type: 'text', required: true, label: 'Postal Code' },
      { id: 'city', name: 'city', type: 'text', required: true, label: 'City' },
      { id: 'email', name: 'email', type: 'email', required: true, label: 'Email' },
      { id: 'phone', name: 'phone', type: 'tel', required: true, label: 'Phone' },
      { id: 'whatsapp', name: 'whatsapp', type: 'tel', required: false, label: 'WhatsApp' },
      { id: 'marital_status', name: 'marital_status', type: 'select', required: true, label: 'Marital Status', options: ['single', 'married', 'divorced', 'widowed'] },
      { id: 'birth_date', name: 'birth_date', type: 'date', required: true, label: 'Birth Date' },
      { id: 'birth_place', name: 'birth_place', type: 'text', required: true, label: 'Birth Place' },
      { id: 'nationality', name: 'nationality', type: 'text', required: true, label: 'Nationality' },
      { id: 'residence_permit', name: 'residence_permit', type: 'text', required: false, label: 'Residence Permit' },
      { id: 'eu_citizen', name: 'eu_citizen', type: 'checkbox', required: false, label: 'EU Citizen' },
      { id: 'tax_id', name: 'tax_id', type: 'text', required: false, label: 'Tax ID' },
      { id: 'iban', name: 'iban', type: 'text', required: false, label: 'IBAN' },
      { id: 'housing', name: 'housing', type: 'select', required: true, label: 'Housing', options: ['owned', 'rented', 'livingWithParents', 'other'] }
    ]
  },
  family: {
    title: 'Family Details',
    description: 'Information about family members',
    required: false,
    fields: [
      { id: 'first_name', name: 'first_name', type: 'text', required: true, label: 'First Name' },
      { id: 'last_name', name: 'last_name', type: 'text', required: true, label: 'Last Name' },
      { id: 'relation', name: 'relation', type: 'select', required: true, label: 'Relation', options: ['Spouse', 'Child', 'Parent', 'Other'] },
      { id: 'birth_date', name: 'birth_date', type: 'date', required: true, label: 'Birth Date' },
      { id: 'nationality', name: 'nationality', type: 'text', required: true, label: 'Nationality' },
      { id: 'tax_id', name: 'tax_id', type: 'text', required: false, label: 'Tax ID' }
    ]
  },
  employment: {
    title: 'Employment Details',
    description: 'Current employment information',
    required: true,
    fields: [
      { id: 'employment_type', name: 'employment_type', type: 'select', required: true, label: 'Employment Type', options: ['PrimaryEmployment', 'SecondaryEmployment'] },
      { id: 'occupation', name: 'occupation', type: 'text', required: true, label: 'Occupation' },
      { id: 'contract_type', name: 'contract_type', type: 'text', required: false, label: 'Contract Type' },
      { id: 'contract_duration', name: 'contract_duration', type: 'text', required: false, label: 'Contract Duration' },
      { id: 'employer_name', name: 'employer_name', type: 'text', required: false, label: 'Employer Name' },
      { id: 'employed_since', name: 'employed_since', type: 'date', required: false, label: 'Employed Since' }
    ]
  },
  income: {
    title: 'Income Details',
    description: 'Monthly income and benefits',
    required: true,
    fields: [
      { id: 'gross_income', name: 'gross_income', type: 'number', required: true, label: 'Gross Income', validation: { min: 0 } },
      { id: 'net_income', name: 'net_income', type: 'number', required: true, label: 'Net Income', validation: { min: 0 } },
      { id: 'tax_class', name: 'tax_class', type: 'text', required: false, label: 'Tax Class' },
      { id: 'tax_id', name: 'tax_id', type: 'text', required: false, label: 'Tax ID' },
      { id: 'number_of_salaries', name: 'number_of_salaries', type: 'number', required: false, label: 'Number of Salaries', validation: { min: 12, max: 14 } },
      { id: 'child_benefit', name: 'child_benefit', type: 'number', required: false, label: 'Child Benefit', validation: { min: 0 } },
      { id: 'other_income', name: 'other_income', type: 'number', required: false, label: 'Other Income', validation: { min: 0 } },
      { id: 'income_trade_business', name: 'income_trade_business', type: 'number', required: false, label: 'Income from Trade/Business', validation: { min: 0 } },
      { id: 'income_self_employed_work', name: 'income_self_employed_work', type: 'number', required: false, label: 'Income from Self-Employed Work', validation: { min: 0 } },
      { id: 'income_side_job', name: 'income_side_job', type: 'number', required: false, label: 'Income from Side Job', validation: { min: 0 } }
    ]
  },
  expenses: {
    title: 'Expenses Details',
    description: 'Monthly expenses and bills',
    required: true,
    fields: [
      { id: 'cold_rent', name: 'cold_rent', type: 'number', required: false, label: 'Cold Rent', validation: { min: 0 } },
      { id: 'electricity', name: 'electricity', type: 'number', required: false, label: 'Electricity', validation: { min: 0 } },
      { id: 'living_expenses', name: 'living_expenses', type: 'number', required: false, label: 'Living Expenses', validation: { min: 0 } },
      { id: 'gas', name: 'gas', type: 'number', required: false, label: 'Gas', validation: { min: 0 } },
      { id: 'telecommunication', name: 'telecommunication', type: 'number', required: false, label: 'Telecommunication', validation: { min: 0 } },
      { id: 'account_maintenance_fee', name: 'account_maintenance_fee', type: 'number', required: false, label: 'Account Maintenance Fee', validation: { min: 0 } },
      { id: 'alimony', name: 'alimony', type: 'number', required: false, label: 'Alimony', validation: { min: 0 } },
      { id: 'subscriptions', name: 'subscriptions', type: 'number', required: false, label: 'Subscriptions', validation: { min: 0 } },
      { id: 'other_expenses', name: 'other_expenses', type: 'number', required: false, label: 'Other Expenses', validation: { min: 0 } }
    ]
  },
  assets: {
    title: 'Assets',
    description: 'Current assets and investments',
    required: false,
    fields: [
      { id: 'real_estate', name: 'real_estate', type: 'number', required: false, label: 'Real Estate', validation: { min: 0 } },
      { id: 'securities', name: 'securities', type: 'number', required: false, label: 'Securities', validation: { min: 0 } },
      { id: 'bank_deposits', name: 'bank_deposits', type: 'number', required: false, label: 'Bank Deposits', validation: { min: 0 } },
      { id: 'building_savings', name: 'building_savings', type: 'number', required: false, label: 'Building Savings', validation: { min: 0 } },
      { id: 'insurance_values', name: 'insurance_values', type: 'number', required: false, label: 'Insurance Values', validation: { min: 0 } },
      { id: 'other_assets', name: 'other_assets', type: 'number', required: false, label: 'Other Assets', validation: { min: 0 } }
    ]
  },
  liabilities: {
    title: 'Liabilities',
    description: 'Current loans and debts',
    required: false,
    fields: [
      { id: 'loan_type', name: 'loan_type', type: 'select', required: true, label: 'Loan Type', options: ['PersonalLoan', 'HomeLoan', 'CarLoan', 'BusinessLoan', 'EducationLoan', 'OtherLoan'] },
      { id: 'loan_bank', name: 'loan_bank', type: 'text', required: false, label: 'Loan Bank' },
      { id: 'loan_amount', name: 'loan_amount', type: 'number', required: false, label: 'Loan Amount', validation: { min: 0 } },
      { id: 'loan_monthly_rate', name: 'loan_monthly_rate', type: 'number', required: false, label: 'Monthly Rate', validation: { min: 0 } },
      { id: 'loan_interest', name: 'loan_interest', type: 'number', required: false, label: 'Interest Rate', validation: { min: 0, max: 100 } }
    ]
  }
}; 