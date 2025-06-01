// Application Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
} as const;

export const APP_CONFIG = {
  NAME: 'Your Wealth Coach',
  SHORT_NAME: 'YWC',
  DESCRIPTION: 'Professional Financial Coaching & Wealth Management Platform',
  VERSION: '1.0.0',
  WEBSITE: 'yourwealth.coach',
  SUPPORT_EMAIL: 'support@yourwealth.coach',
  COMPANY: 'Your Wealth Coach',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_MODE: 'light' as const,
  STORAGE_KEY: 'themeMode',
  ROLES: {
    ADMIN: {
      primary: '#3B82F6',    // Blue
      secondary: '#1E40AF',
      accent: '#60A5FA',
    },
    COACH: {
      primary: '#10B981',    // Green
      secondary: '#047857',
      accent: '#34D399',
    },
    CLIENT: {
      primary: '#F59E0B',    // Orange
      secondary: '#D97706',
      accent: '#FBBF24',
    },
    GUEST: {
      primary: '#6B7280',    // Gray
      secondary: '#4B5563',
      accent: '#9CA3AF',
    },
  },
} as const;

// Pagination Defaults
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Form Configuration
export const FORM_CONFIG = {
  AUTO_SAVE_DELAY: 1000, // ms
  VALIDATION_DEBOUNCE: 300, // ms
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000, // ms
  ERROR_DURATION: 7000, // ms
  MAX_NOTIFICATIONS: 5,
} as const; 

//Consent Forms for the Client to sign
export const TAX_RETURN_CONSENT_TITLE: string = "Consent for Tax Return Data Collection and Processing";
export const TAX_RETURN_CONSENT_DESCRIPTION: string = "The undersigned consents to the collection, processing, and transmission of personal tax-related data including income, expenses, deductions, and associated documents for the purpose of preparing and submitting income tax returns. The data may be shared with authorized tax advisors, tax offices, and electronic filing platforms in accordance with §87 AO and GDPR Art. 6 Para. 1 lit. b (performance of a contract) and lit. a (explicit consent). "+
"This data may also be cross-validated through APIs such as DATEV or ELSTER. The data subject acknowledges that some tax information may constitute special categories of personal data as defined by Art. 9 GDPR and consents to its processing accordingly. Data will be stored only for the legally required retention period.";

export const TAX_RETURN_CONSENT_FORM_DATA: any = {
    "title": TAX_RETURN_CONSENT_TITLE,
    "description": TAX_RETURN_CONSENT_DESCRIPTION
};

export const SELF_DISCLOSURE_CONSENT_TITLE: string = "Consent for Self-Disclosure in Loan and Financial Assessment";
export const SELF_DISCLOSURE_CONSENT_DESCRIPTION: string = "By signing this form, I authorize the collecting party (e.g., bank, financial advisor, or platform operator) to collect, process, and evaluate personal and financial data such as income, liabilities, household expenses, assets, insurance policies, and credit obligations. This is done to assess financial capability and creditworthiness in accordance with Art. 6 (1)(b) and (f) GDPR. "+
"I agree that the data may be shared with affiliated institutions (e.g., financing banks, credit rating agencies like SCHUFA, or insurance companies) to determine eligibility for financing products. This may also include profiling (scoring). Where applicable, I release the recipient from financial or banking confidentiality to the extent necessary.";

export const SELF_DISCLOSURE_CONSENT_FORM_DATA: any = {
    "title": SELF_DISCLOSURE_CONSENT_TITLE,
    "description": SELF_DISCLOSURE_CONSENT_DESCRIPTION
};

export const ELECTRONIC_CONSENT_TITLE: string = "Consent for Electricity/Utility Tariff Comparison and Switching";
export const ELECTRONIC_CONSENT_DESCRIPTION: string = "I hereby authorize the collection and processing of my personal data (including name, address, consumption values, meter numbers, and prior utility contracts) for the purpose of comparing electricity and/or gas tariffs and facilitating a switch to a new provider. "+
"This information may be transferred to energy suppliers, network operators, and service platforms as required. The processing is based on Art. 6 (1)(b) GDPR and my express consent per Art. 6 (1)(a) GDPR. I understand that revocation of this consent is possible at any time with future effect.";

export const ELECTRONIC_CONSENT_FORM_DATA   : any = {
    "title": ELECTRONIC_CONSENT_TITLE,
    "description": ELECTRONIC_CONSENT_DESCRIPTION
};

export const INSURANCE_CONSENT_TITLE: string = "Consent for Insurance Applications and Comparison Services";
export const INSURANCE_CONSENT_DESCRIPTION: string = "I authorize the collection, processing, and sharing of my personal data including name, address, date of birth, employment status, income, and—if necessary—health data in the context of insurance applications (e.g., health, life, or liability insurance). "+
"This data may be transferred to insurance providers, underwriters, and reinsurers. Health data will only be processed with explicit consent as per Art. 9 (2)(a) GDPR. This data will be used exclusively to assess insurance eligibility, premiums, and risks. Revocation is possible at any time, but may affect the ability to provide services.";

export const INSURANCE_CONSENT_FORM_DATA: any = {
    "title": INSURANCE_CONSENT_TITLE,
    "description": INSURANCE_CONSENT_DESCRIPTION
};

export const LOAN_CONSENT_TITLE: string = "Consent for Loan Application and Credit Intermediary";
export const LOAN_CONSENT_DESCRIPTION: string = "I authorize the collecting entity (e.g., credit broker or financial institution) to gather, store, and transmit my financial data (employment details, credit obligations, income, asset declarations, and SCHUFA score) for the purpose of applying for and mediating loan offers. "+
"The data may be forwarded to financial institutions and credit agencies (e.g., SCHUFA, CRIF Bürgel) for the purpose of credit assessment. This is based on Art. 6 (1)(b) and (f) GDPR. I understand that data may be subject to automated decision-making (Art. 22 GDPR) and profiling. I explicitly release all involved parties from banking and financial confidentiality to the extent required.";

export const LOAN_CONSENT_FORM_DATA: any = {
    "title": LOAN_CONSENT_TITLE,
    "description": LOAN_CONSENT_DESCRIPTION
};

export const REAL_ESTATE_CONSENT_TITLE: string = "Consent for Real Estate Purchase and Financing Support";
export const REAL_ESTATE_CONSENT_DESCRIPTION: string = "I consent to the processing of personal and financial data in connection with property searches, real estate transactions, and mortgage financing. This includes identification data, income and asset proof, SCHUFA data, and property-related information. "+
"Data may be shared with real estate agents, financing banks, notaries, credit intermediaries, and credit rating agencies. The legal basis is Art. 6 (1)(b) GDPR (contractual necessity) and Art. 6 (1)(a) GDPR (explicit consent). I also authorize data sharing across borders in compliance with GDPR Chapter V where applicable.";

export const REAL_ESTATE_CONSENT_FORM_DATA: any = {
    "title": REAL_ESTATE_CONSENT_TITLE,
    "description": REAL_ESTATE_CONSENT_DESCRIPTION
};

export const DATA_STORAGE_CONSENT_TITLE : string = "Consent for Data Storage and Processing";
export const DATA_STORAGE_CONSENT_DESCRIPTION: string = "I authorize the storage and processing of my submitted personal and financial data through certified third-party service providers (e.g., cloud platforms, CRM tools, document verification software). These processors are contractually bound by Art. 28 GDPR to maintain data security and confidentiality. "+
"Where data is stored outside the EEA, it is ensured through EU Commission adequacy decisions or standard contractual clauses. This consent is granted in accordance with Art. 6 (1)(a) GDPR and can be revoked at any time with future effect.";

export const DATA_STORAGE_CONSENT_FORM_DATA: any = {
    "title": DATA_STORAGE_CONSENT_TITLE,
    "description": DATA_STORAGE_CONSENT_DESCRIPTION
};

export const CONSENT_FORM_DATA: any = [
    TAX_RETURN_CONSENT_FORM_DATA,
    SELF_DISCLOSURE_CONSENT_FORM_DATA,
    ELECTRONIC_CONSENT_FORM_DATA,
    INSURANCE_CONSENT_FORM_DATA,
    LOAN_CONSENT_FORM_DATA,
    REAL_ESTATE_CONSENT_FORM_DATA,
    DATA_STORAGE_CONSENT_FORM_DATA
];