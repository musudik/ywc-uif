import type { ApiResponse, UserRole, Section } from '../types';
import { apiService } from './api';

export interface Field {
  id: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
  label: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CustomFieldStyling {
  theme: string;
  custom_css: string;
}

export interface CustomFieldValidation {
  rules: any[];
  enabled: boolean;
}

export interface CustomFields {
  styling: CustomFieldStyling;
  custom_validation: CustomFieldValidation;
}

export interface ConsentForm {
  id?: string;
  title: string;
  content: string;
  enabled: boolean;
  required: boolean;
  checkboxText: string;
}

export interface Document {
  id: string;
  name: string;
  maxSize: number;
  required: boolean;
  description?: string;
  acceptedTypes: string[];
}

export interface FormConfigurationData {
  id?: string;
  config_id?: string;
  name: string;
  form_type: string;
  version: string;
  description: string;
  applicantconfig?: string;
  sections: Section[];
  consent_forms: ConsentForm[];
  consent_form?: ConsentForm[]; // Backend sometimes uses singular form
  documents: Document[];
  is_active: boolean;
  allowedRoles?: UserRole[];
  created_by_id: string;
  usage_count: number;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
  custom_fields?: CustomFields;
}

export interface FormConfigurationList {
  id: string;
  config_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  name: string;
  form_type: string;
  version: string;
  description?: string;
  applicantconfig?: string;
  sections: any[];
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
}

export interface FormConfigurationFilters {
  formType?: string;
  isActive?: boolean;
  search?: string;
  createdById?: string;
}

export interface FormConfigurationStatistics {
  totalConfigurations: number;
  activeConfigurations: number;
  inactiveConfigurations: number;
  totalUsage: number;
  mostUsedConfiguration?: {
    id: string;
    name: string;
    usageCount: number;
  };
  recentlyCreated: FormConfigurationList[];
  usageByType: Record<string, number>;
}

class ConfigToolService {
  private baseUrl = '/form-configurations';

  /**
   * Create new configuration
   * POST /api/form-configurations
   */
  async createFormConfiguration(data: Omit<FormConfigurationData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.post<FormConfigurationData>(this.baseUrl, data);
    } catch (error) {
      console.error('Error creating form configuration:', error);
      return {
        success: false,
        message: 'Failed to create form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all configurations (with filters)
   * GET /api/form-configurations
   */
  async getFormConfigurations(filters?: FormConfigurationFilters): Promise<ApiResponse<FormConfigurationList[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.formType) queryParams.append('formType', filters.formType);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.createdById) queryParams.append('createdById', filters.createdById);

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      
      return await apiService.get<FormConfigurationList[]>(url);
    } catch (error) {
      console.error('Error fetching form configurations:', error);
      return {
        success: false,
        message: 'Failed to fetch form configurations',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get usage statistics
   * GET /api/form-configurations/statistics
   */
  async getFormConfigurationStatistics(): Promise<ApiResponse<FormConfigurationStatistics>> {
    try {
      return await apiService.get<FormConfigurationStatistics>(`${this.baseUrl}/statistics`);
    } catch (error) {
      console.error('Error fetching form configuration statistics:', error);
      return {
        success: false,
        message: 'Failed to fetch form configuration statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get configurations by user
   * GET /api/form-configurations/user/:userId
   */
  async getFormConfigurationsByUser(userId: string): Promise<ApiResponse<FormConfigurationList[]>> {
    try {
      return await apiService.get<FormConfigurationList[]>(`${this.baseUrl}/user/${userId}`);
    } catch (error) {
      console.error('Error fetching user form configurations:', error);
      return {
        success: false,
        message: 'Failed to fetch user form configurations',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get configurations by type
   * GET /api/form-configurations/type/:formType
   */
  async getFormConfigurationsByType(formType: string): Promise<ApiResponse<FormConfigurationList[]>> {
    try {
      return await apiService.get<FormConfigurationList[]>(`${this.baseUrl}/type/${formType}`);
    } catch (error) {
      console.error('Error fetching form configurations by type:', error);
      return {
        success: false,
        message: 'Failed to fetch form configurations by type',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get configuration by config ID
   * GET /api/form-configurations/config/:configId
   */
  async getFormConfiguration(configId: string): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.get<FormConfigurationData>(`${this.baseUrl}/config/${configId}`);
    } catch (error) {
      console.error('Error fetching form configuration:', error);
      return {
        success: false,
        message: 'Failed to fetch form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get configuration by ID
   * GET /api/form-configurations/:id
   */
  async getFormConfigurationById(id: string): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.get<FormConfigurationData>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error fetching form configuration by ID:', error);
      return {
        success: false,
        message: 'Failed to fetch form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update configuration
   * PUT /api/form-configurations/:id
   */
  async updateFormConfiguration(id: string, data: Partial<FormConfigurationData>): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.put<FormConfigurationData>(`${this.baseUrl}/${id}`, data);
    } catch (error) {
      console.error('Error updating form configuration:', error);
      return {
        success: false,
        message: 'Failed to update form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete configuration
   * DELETE /api/form-configurations/:id
   */
  async deleteFormConfiguration(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<void>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting form configuration:', error);
      return {
        success: false,
        message: 'Failed to delete form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clone configuration
   * POST /api/form-configurations/:id/clone
   */
  async cloneFormConfiguration(id: string, newName: string): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.post<FormConfigurationData>(`${this.baseUrl}/${id}/clone`, { name: newName });
    } catch (error) {
      console.error('Error cloning form configuration:', error);
      return {
        success: false,
        message: 'Failed to clone form configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Toggle active status
   * PATCH /api/form-configurations/:id/status
   */
  async toggleFormConfigurationStatus(id: string): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.patch<FormConfigurationData>(`${this.baseUrl}/${id}/status`);
    } catch (error) {
      console.error('Error toggling form configuration status:', error);
      return {
        success: false,
        message: 'Failed to toggle form configuration status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate form configuration before saving
   */
  validateFormConfiguration(data: Partial<FormConfigurationData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Form name is required');
    }

    if (!data.form_type?.trim()) {
      errors.push('Form type is required');
    }

    if (!data.version?.trim()) {
      errors.push('Version is required');
    }

    if (!data.sections || data.sections.length === 0) {
      errors.push('At least one section is required');
    }

    if (data.sections) {
      data.sections.forEach((section, index) => {
        if (!section.title?.trim()) {
          errors.push(`Section ${index + 1}: Title is required`);
        }
        if (!section.description?.trim()) {
          errors.push(`Section ${index + 1}: Description is required`);
        }
      });
    }

    if (data.consent_forms && data.consent_forms.length > 0) {
      data.consent_forms.forEach((consentForm, index) => {
        if (!consentForm.title?.trim()) {
          errors.push(`Consent form ${index + 1}: Title is required`);
        }
        if (!consentForm.content?.trim()) {
          errors.push(`Consent form ${index + 1}: Content is required`);
        }
      });
    }

    if (data.documents && data.documents.length > 0) {
      data.documents.forEach((doc, index) => {
        if (!doc.name?.trim()) {
          errors.push(`Document ${index + 1}: Name is required`);
        }
        if (!doc.acceptedTypes || doc.acceptedTypes.length === 0) {
          errors.push(`Document ${index + 1}: At least one accepted type is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique configuration ID
   */
  generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Legacy method names for backward compatibility
  /**
   * @deprecated Use cloneFormConfiguration instead
   */
  async duplicateFormConfiguration(configId: string, newName: string): Promise<ApiResponse<FormConfigurationData>> {
    console.warn('duplicateFormConfiguration is deprecated. Use cloneFormConfiguration instead.');
    // For backward compatibility, try to find the ID by configId first
    const config = await this.getFormConfiguration(configId);
    if (config.success && config.data?.id) {
      return this.cloneFormConfiguration(config.data.id, newName);
    }
    return {
      success: false,
      message: 'Configuration not found',
      error: 'Could not find configuration with the provided configId'
    };
  }
}

export const configToolService = new ConfigToolService();
export default configToolService; 