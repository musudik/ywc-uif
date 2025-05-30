import type { ApiResponse } from '../types';
import { apiService } from './api';
import type { FormConfigurationData } from './configToolService';

export interface FormSubmissionData {
  id?: string;
  form_config_id: string;
  user_id: string;
  submission_data: Record<string, any>;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionList {
  id: string;
  form_config_id: string;
  config_name: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

class FormSubmissionService {
  private baseUrl = '/form-submissions';

  /**
   * Get available form configurations for clients
   */
  async getAvailableFormConfigurations(): Promise<ApiResponse<FormConfigurationData[]>> {
    try {
      return await apiService.get<FormConfigurationData[]>('/form-configurations');
    } catch (error) {
      console.error('Error fetching available form configurations:', error);
      return {
        success: false,
        message: 'Failed to fetch available forms',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get form configuration by ID
   */
  async getFormConfiguration(configId: string): Promise<ApiResponse<FormConfigurationData>> {
    try {
      return await apiService.get<FormConfigurationData>(`/form-configurations/config/${configId}`);
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
   * Create new form submission
   */
  async createFormSubmission(data: Omit<FormSubmissionData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<FormSubmissionData>> {
    try {
      return await apiService.post<FormSubmissionData>(this.baseUrl, data);
    } catch (error) {
      console.error('Error creating form submission:', error);
      return {
        success: false,
        message: 'Failed to create form submission',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update form submission
   */
  async updateFormSubmission(id: string, data: Partial<FormSubmissionData>): Promise<ApiResponse<FormSubmissionData>> {
    try {
      return await apiService.put<FormSubmissionData>(`${this.baseUrl}/${id}`, data);
    } catch (error) {
      console.error('Error updating form submission:', error);
      return {
        success: false,
        message: 'Failed to update form submission',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user's form submissions
   */
  async getUserFormSubmissions(userId: string): Promise<ApiResponse<FormSubmissionList[]>> {
    try {
      return await apiService.get<FormSubmissionList[]>(`${this.baseUrl}/user/${userId}`);
    } catch (error) {
      console.error('Error fetching user form submissions:', error);
      return {
        success: false,
        message: 'Failed to fetch form submissions',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get form submission by ID
   */
  async getFormSubmission(id: string): Promise<ApiResponse<FormSubmissionData>> {
    try {
      return await apiService.get<FormSubmissionData>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error fetching form submission:', error);
      return {
        success: false,
        message: 'Failed to fetch form submission',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit form (change status from draft to submitted)
   */
  async submitForm(id: string): Promise<ApiResponse<FormSubmissionData>> {
    try {
      return await apiService.patch<FormSubmissionData>(`${this.baseUrl}/${id}/submit`);
    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        message: 'Failed to submit form',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete form submission
   */
  async deleteFormSubmission(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<void>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting form submission:', error);
      return {
        success: false,
        message: 'Failed to delete form submission',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const formSubmissionService = new FormSubmissionService();
export default formSubmissionService; 