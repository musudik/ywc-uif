import type { ApiResponse } from '../types';
import { apiService } from './api';

// Types for document tracking
export interface SubmissionDocument {
  id: string;
  form_submission_id: string;
  document_id: string;
  applicant_type: 'single' | 'applicant1' | 'applicant2';
  
  // Document details
  original_filename: string;
  file_size_bytes: number;
  content_type: string;
  
  // Firebase Storage details
  firebase_path: string;
  firebase_download_url?: string;
  firebase_metadata?: any;
  
  // Upload tracking
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed' | 'replaced';
  uploaded_at?: string;
  uploaded_by: string;
  
  // Verification and approval
  verification_status: 'pending' | 'approved' | 'rejected' | 'requires_replacement';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  
  // Audit trail
  created_at: string;
  updated_at: string;
}

export interface FormDocument {
  id: string;
  form_config_id: string;
  document_id: string;
  document_name: string;
  description?: string;
  required: boolean;
  max_size_mb: number;
  accepted_file_types: string[];
  applicant_config: 'single' | 'dual' | 'both';
  display_order: number;
}

export interface DocumentStatus {
  document_id: string;
  document_name: string;
  required: boolean;
  applicant_type: 'single' | 'applicant1' | 'applicant2';
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed' | 'replaced';
  submission_document?: SubmissionDocument;
}

export interface SubmissionDocumentSummary {
  submission_id: string;
  user_id: string;
  form_config_id: string;
  form_status: string;
  document_status: 'not_required' | 'pending' | 'partial' | 'complete' | 'under_review';
  total_required_documents: number;
  total_uploaded_documents: number;
  successfully_uploaded: number;
  failed_uploads: number;
  required_documents: number;
  required_uploaded: number;
  first_upload_at?: string;
  last_upload_at?: string;
}

export interface SubmissionDocumentsResponse {
  form_submission_id: string;
  documents: SubmissionDocument[];
  total_count: number;
}

export interface CreateDocumentData {
  form_submission_id: string;
  document_id: string;
  applicant_type: 'single' | 'applicant1' | 'applicant2';
  original_filename: string;
  file_size_bytes: number;
  content_type: string;
  firebase_path: string;
  firebase_download_url: string;
  firebase_metadata?: any;
  uploaded_by: string;
}

export interface UpdateDocumentData {
  upload_status?: 'pending' | 'uploading' | 'uploaded' | 'failed' | 'replaced';
  firebase_download_url?: string;
  firebase_metadata?: any;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'requires_replacement';
  verified_by?: string;
  verification_notes?: string;
}

export interface SimplifiedUploadData {
  clientId: string;
  formConfigId: string;
  fileName: string;
  applicant_type: 'single' | 'applicant1' | 'applicant2';
  document_id: string;
  firebase_path: string;
  form_submission_id: string;
  upload_status: 'uploaded';
  uploaded_at: string;
}

class DocumentTrackingService {

  /**
   * Create a new document record in the database
   * POST /api/form-submissions/:formSubmissionId/documents
   */
  async createDocument(data: CreateDocumentData): Promise<ApiResponse<SubmissionDocument>> {
    try {
      return await apiService.post<SubmissionDocument>(`/form-submissions/${data.form_submission_id}/documents`, {
        ...data,
        upload_status: 'uploading',
        uploaded_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating document record:', error);
      return {
        success: false,
        message: 'Failed to create document record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a document record
   * PUT /api/form-submissions/:formSubmissionId/documents/:documentId
   */
  async updateDocument(documentId: string, data: UpdateDocumentData & { form_submission_id: string }): Promise<ApiResponse<SubmissionDocument>> {
    try {
      return await apiService.put<SubmissionDocument>(`/form-submissions/${data.form_submission_id}/documents/${documentId}`, {
        ...data,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating document record:', error);
      return {
        success: false,
        message: 'Failed to update document record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get documents for a form submission
   */
  async getSubmissionDocuments(submissionId: string): Promise<ApiResponse<SubmissionDocumentsResponse>> {
    try {
      return await apiService.get<SubmissionDocumentsResponse>(`/form-submissions/${submissionId}/documents`);
    } catch (error) {
      console.error('Error fetching submission documents:', error);
      return {
        success: false,
        message: 'Failed to fetch submission documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get document status for a form submission
   */
  async getDocumentStatus(submissionId: string): Promise<ApiResponse<DocumentStatus[]>> {
    try {
      return await apiService.get<DocumentStatus[]>(`/form-submissions/${submissionId}/document-status`);
    } catch (error) {
      console.error('Error fetching document status:', error);
      return {
        success: false,
        message: 'Failed to fetch document status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get submission document summary
   */
  async getSubmissionSummary(submissionId: string): Promise<ApiResponse<SubmissionDocumentSummary>> {
    try {
      return await apiService.get<SubmissionDocumentSummary>(`/form-submissions/${submissionId}/summary`);
    } catch (error) {
      console.error('Error fetching submission summary:', error);
      return {
        success: false,
        message: 'Failed to fetch submission summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new form document record
   * POST /api/form-submissions/:formSubmissionId/documents
   */
  async markDocumentUploaded(uploadData: SimplifiedUploadData): Promise<ApiResponse<SubmissionDocument>> {
    try {
      // Transform camelCase fields to snake_case for backend compatibility
      const backendData = {
        client_id: uploadData.clientId,
        form_config_id: uploadData.formConfigId,
        file_name: uploadData.fileName,
        applicant_type: uploadData.applicant_type,
        document_id: uploadData.document_id,
        firebase_path: uploadData.firebase_path,
        form_submission_id: uploadData.form_submission_id,
        upload_status: uploadData.upload_status,
        uploaded_at: uploadData.uploaded_at,
      };
      
      return await apiService.post<SubmissionDocument>(`/form-submissions/${uploadData.form_submission_id}/documents`, backendData);
    } catch (error) {
      console.error('Error marking document as uploaded:', error);
      return {
        success: false,
        message: 'Failed to mark document as uploaded',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark document upload as failed
   * POST /api/form-submissions/:formSubmissionId/documents
   */
  async markDocumentFailed(
    submissionId: string,
    documentId: string,
    applicantType: 'single' | 'applicant1' | 'applicant2',
    errorMessage: string
  ): Promise<ApiResponse<SubmissionDocument>> {
    try {
      return await apiService.post<SubmissionDocument>(`/form-submissions/${submissionId}/documents`, {
        document_id: documentId,
        applicant_type: applicantType,
        upload_status: 'failed',
        verification_notes: errorMessage,
      });
    } catch (error) {
      console.error('Error marking document as failed:', error);
      return {
        success: false,
        message: 'Failed to mark document as failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a document (soft delete by marking as replaced)
   * DELETE /api/form-submissions/:formSubmissionId/documents/:documentId
   */
  async deleteDocument(documentId: string, submissionId: string, reason?: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<void>(`/form-submissions/${submissionId}/documents/${documentId}`, {
        data: { replacement_reason: reason }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get form documents (requirements) for a form configuration
   */
  async getFormDocuments(formConfigId: string): Promise<ApiResponse<FormDocument[]>> {
    try {
      return await apiService.get<FormDocument[]>(`/form-configurations/${formConfigId}/documents`);
    } catch (error) {
      console.error('Error fetching form documents:', error);
      return {
        success: false,
        message: 'Failed to fetch form documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const documentTrackingService = new DocumentTrackingService();
export default documentTrackingService; 