import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/ui/Button';
import formSubmissionService from '../../../services/formSubmissionService';
import firebaseStorageService from '../../../services/firebaseStorageService';
import documentTrackingService from '../../../services/documentTrackingService';
import DocumentStatus from '../../../components/DocumentStatus';
import type { FormConfigurationData, Document } from '../../../services/configToolService';
import type { DocumentStatus as DocumentStatusType, SubmissionDocument, SubmissionDocumentsResponse } from '../../../services/documentTrackingService';
import { getDocumentStorageIds, extractClientIdFromSubmission, sanitizeFileName } from '../../../utils/documentUtils';

interface DocumentFile {
  documentId: string;
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
  error: string | null;
  downloadURL?: string;
  submissionDocumentId?: string; // Database record ID
}

// Icon components
const UploadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DocumentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function DocumentUploadSingle() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const configId = searchParams.get('configId');
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [formConfig, setFormConfig] = useState<FormConfigurationData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [allUploaded, setAllUploaded] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null); // Store submission data for context
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatusType[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<SubmissionDocument[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    loadFormConfiguration();
  }, [submissionId, configId]);

  const loadFormConfiguration = async () => {
    try {
      setLoading(true);
      
      let formConfigData: FormConfigurationData | null = null;
      
      if (submissionId) {
        // Load from existing submission
        const submissionResponse = await formSubmissionService.getFormSubmission(submissionId);
        if (submissionResponse.success && submissionResponse.data) {
          console.log("DocumentUploadSingle - Loading from submission ID:", submissionId);
          console.log("DocumentUploadSingle - Submission form_config_id:", submissionResponse.data.form_config_id);
          
          // Store submission data for context
          setSubmissionData(submissionResponse.data);
          
          const configResponse = await formSubmissionService.getFormConfiguration(submissionResponse.data.form_config_id);
          if (configResponse.success && configResponse.data) {
            formConfigData = configResponse.data;
            console.log("DocumentUploadSingle - Successfully loaded config:", {
              id: configResponse.data.id,
              config_id: configResponse.data.config_id,
              name: configResponse.data.name
            });
          } else {
            console.error("DocumentUploadSingle - Failed to load config:", configResponse.message);
            console.error("DocumentUploadSingle - Attempted config_id:", submissionResponse.data.form_config_id);
          }
        }
      } else if (configId) {
        // Load from config ID
        console.log("DocumentUploadSingle - Loading from config ID:", configId);
        const configResponse = await formSubmissionService.getFormConfiguration(configId);
        if (configResponse.success && configResponse.data) {
          formConfigData = configResponse.data;
          console.log("DocumentUploadSingle - Successfully loaded config from configId:", {
            id: configResponse.data.id,
            config_id: configResponse.data.config_id,
            name: configResponse.data.name
          });
        } else {
          console.error("DocumentUploadSingle - Failed to load config from configId:", configResponse.message);
          console.error("DocumentUploadSingle - Attempted configId:", configId);
        }
      }

      if (formConfigData) {
        setFormConfig(formConfigData);
        setDocuments(formConfigData.documents || []);
        
        // Initialize document files state
        const initialFiles = (formConfigData.documents || []).map((doc: Document) => ({
          documentId: doc.id,
          file: null,
          uploaded: false,
          uploading: false,
          error: null,
          submissionDocumentId: undefined,
        }));
        setDocumentFiles(initialFiles);
        
        // Load document statuses and existing documents if we have a submission ID
        if (submissionId) {
          loadDocumentStatuses();
          loadExistingDocuments();
        }
      } else {
        showError(t('common.error'), t('forms.dynamic.loadError'));
        navigate('/dashboard/forms');
      }
    } catch (error) {
      console.error('Error loading form configuration:', error);
      showError(t('common.error'), t('forms.dynamic.loadError'));
      navigate('/dashboard/forms');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentStatuses = async () => {
    if (!submissionId) return;
    
    try {
      const statusResponse = await documentTrackingService.getDocumentStatus(submissionId);
      if (statusResponse.success && statusResponse.data) {
        setDocumentStatuses(statusResponse.data);
        console.log('Document statuses loaded:', statusResponse.data);
      }
    } catch (error) {
      console.error('Error loading document statuses:', error);
    }
  };

  const loadExistingDocuments = async () => {
    if (!submissionId) return;
    
    try {
      setLoadingExisting(true);
      const documentsResponse = await documentTrackingService.getSubmissionDocuments(submissionId);
      
      // Handle both ApiResponse wrapper and direct response formats
      let responseData;
      let isSuccess = false;
      
      if (documentsResponse && typeof documentsResponse === 'object') {
        // Check if it's a wrapped ApiResponse
        if ('success' in documentsResponse && 'data' in documentsResponse) {
          isSuccess = documentsResponse.success;
          responseData = documentsResponse.data;
        } 
        // Check if it's a direct response with documents array
        else if ('documents' in documentsResponse) {
          isSuccess = true;
          responseData = documentsResponse;
        }
      }
      
      if (isSuccess && responseData) {
        // Extract documents array from the response
        const documentsArray = responseData.documents;
        
        if (documentsArray && documentsArray.length > 0) {
          // Map the API response fields to match our interface
          const mappedDocuments = documentsArray.map((doc: any) => ({
            ...doc,
            original_filename: doc.file_name || doc.original_filename,
            file_size_bytes: doc.file_size_bytes || 0,
            content_type: doc.content_type || 'application/octet-stream',
            uploaded_by: doc.uploaded_by || 'user',
            verification_status: doc.verification_status || 'pending',
            firebase_download_url: doc.firebase_download_url || null
          }));
          
          setExistingDocuments(mappedDocuments);
        } else {
          setExistingDocuments([]);
        }
      } else {
        console.error('Failed to load existing documents:', documentsResponse);
        setExistingDocuments([]);
      }
    } catch (error) {
      console.error('Error loading existing documents:', error);
      setExistingDocuments([]);
    } finally {
      setLoadingExisting(false);
    }
  };

  const validateFile = (file: File, document: Document): string | null => {
    // Check file size (convert MB to bytes)
    const maxSizeBytes = document.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${t('forms.documents.fileSizeError')} ${document.maxSize}MB`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !document.acceptedTypes.includes(fileExtension)) {
      return `${t('forms.documents.fileTypeError')}: ${document.acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (documentId: string, file: File) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    const validationError = validateFile(file, document);
    
    setDocumentFiles(prev => prev.map(docFile => 
      docFile.documentId === documentId
        ? { ...docFile, file, error: validationError, uploaded: false }
        : docFile
    ));
  };

  const handleFileUpload = async (documentId: string) => {
    const docFile = documentFiles.find(df => df.documentId === documentId);
    const document = documents.find(doc => doc.id === documentId);
    if (!docFile?.file || docFile.error || !document || !user) return;

    setDocumentFiles(prev => prev.map(df => 
      df.documentId === documentId
        ? { ...df, uploading: true, error: null }
        : df
    ));

    try {
      // Get client context from submission data if available
      const contextClientId = submissionData ? extractClientIdFromSubmission(submissionData, user) : undefined;
      
      // Determine storage IDs based on user role and context
      const { coachId, clientId } = getDocumentStorageIds(user, contextClientId);

      console.log('Uploading to Firebase Storage:', {
        coachId,
        clientId,
        applicantName: 'single',
        documentName: sanitizeFileName(document.name),
        documentId: document.id,
        fileName: docFile.file.name,
        submissionId: submissionId,
        contextClientId
      });

      // Upload to Firebase Storage
      const uploadResult = await firebaseStorageService.uploadDocumentSimple({
        file: docFile.file,
        coachId,
        clientId,
        applicantName: 'single',
        documentName: sanitizeFileName(document.name),
        documentId: document.id,
        submissionId: submissionId || undefined
      });

      if (uploadResult.success && uploadResult.data) {
        // Update database with upload success
        if (submissionId) {
          const uploadData = {
            clientId: clientId,
            formConfigId: formConfig.config_id,
            fileName: docFile.file.name,
            applicant_type: 'single' as const,
            document_id: document.id,
            firebase_path: uploadResult.data.metadata.fullPath,
            form_submission_id: submissionId,
            upload_status: 'uploaded' as const,
            uploaded_at: new Date().toISOString()
          };

          const dbResult = await documentTrackingService.markDocumentUploaded(uploadData);

          if (dbResult.success && dbResult.data) {
            console.log('Document tracking updated:', dbResult.data);
          }
        }

        setDocumentFiles(prev => prev.map(df => 
          df.documentId === documentId
            ? { 
                ...df, 
                uploading: false, 
                uploaded: true, 
                downloadURL: uploadResult.data!.downloadURL
              }
            : df
        ));

        showSuccess(t('common.success'), t('forms.documents.documentUploaded'));
        console.log('Document uploaded successfully:', uploadResult.data);
        
        // Refresh document statuses and existing documents
        if (submissionId) {
          loadDocumentStatuses();
          loadExistingDocuments();
        }
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Mark as failed in database
      if (submissionId && document) {
        await documentTrackingService.markDocumentFailed(
          submissionId,
          document.id,
          'single',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      
      setDocumentFiles(prev => prev.map(df => 
        df.documentId === documentId
          ? { ...df, uploading: false, error: t('forms.documents.uploadFailed') }
          : df
      ));
      showError(t('common.error'), `${t('forms.documents.uploadFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompleteUpload = () => {
    // Check if all required documents are uploaded
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequiredDocs = documentFiles.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });

    if (requiredDocs.length !== uploadedRequiredDocs.length) {
      showError(t('common.error'), t('forms.documents.allRequiredDocuments'));
      return;
    }

    showSuccess(t('common.success'), t('forms.documents.allDocumentsUploaded'));
    navigate('/dashboard/forms');
  };

  useEffect(() => {
    // Check if all required documents are uploaded
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequiredDocs = documentFiles.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });
    
    setAllUploaded(requiredDocs.length > 0 && requiredDocs.length === uploadedRequiredDocs.length);
  }, [documentFiles, documents]);

  const handleDownloadDocument = async (document: SubmissionDocument) => {
    if (!document.firebase_download_url) {
      showError(t('common.error'), t('forms.documents.downloadError'));
      return;
    }

    try {
      // Create a temporary link element to trigger download
      const link = window.document.createElement('a');
      link.href = document.firebase_download_url;
      link.target = '_blank';
      link.download = document.original_filename || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError(t('common.error'), t('forms.documents.downloadError'));
    }
  };

  const handleDeleteDocument = async (document: SubmissionDocument) => {
    if (!submissionId) return;

    if (!confirm(t('forms.documents.deleteConfirm'))) {
      return;
    }

    try {
      const deleteResponse = await documentTrackingService.deleteDocument(
        document.id, 
        submissionId, 
        'User requested deletion'
      );

      if (deleteResponse.success) {
        showSuccess(t('common.success'), t('forms.documents.documentDeleted'));
        // Refresh the lists
        loadExistingDocuments();
        loadDocumentStatuses();
      } else {
        showError(t('common.error'), deleteResponse.message || t('forms.documents.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showError(t('common.error'), t('forms.documents.deleteError'));
    }
  };

  const handleReplaceDocument = (document: SubmissionDocument) => {
    const documentConfig = documents.find(doc => doc.id === document.document_id);
    if (!documentConfig) return;

    // Create a file input element
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = documentConfig.acceptedTypes.map(type => `.${type}`).join(',');
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate and update the existing document
        const validationError = validateFile(file, documentConfig);
        if (validationError) {
          showError(t('common.error'), validationError);
          return;
        }
        
        // Start replacement upload
        handleReplaceUpload(document, file, documentConfig);
      }
    };
    
    input.click();
  };

  const handleReplaceUpload = async (
    existingDocument: SubmissionDocument, 
    newFile: File, 
    documentConfig: Document
  ) => {
    if (!user || !submissionId) return;

    try {
      // Get client context from submission data if available
      const contextClientId = submissionData ? extractClientIdFromSubmission(submissionData, user) : undefined;
      
      // Determine storage IDs based on user role and context
      const { coachId, clientId } = getDocumentStorageIds(user, contextClientId);

      console.log('Replacing document in Firebase Storage:', {
        existingDocumentId: existingDocument.id,
        newFileName: newFile.name
      });

      // Upload new file to Firebase Storage
      const uploadResult = await firebaseStorageService.uploadDocumentSimple({
        file: newFile,
        coachId,
        clientId,
        applicantName: 'single',
        documentName: sanitizeFileName(documentConfig.name),
        documentId: documentConfig.id,
        submissionId: submissionId
      });

      if (uploadResult.success && uploadResult.data) {
        // Update the existing document record with new file info
        const updateData = {
          form_submission_id: submissionId,
          upload_status: 'uploaded' as const,
          firebase_download_url: uploadResult.data.downloadURL,
          firebase_path: uploadResult.data.metadata.fullPath,
          firebase_metadata: uploadResult.data.metadata,
          original_filename: newFile.name,
          file_size_bytes: newFile.size,
          content_type: newFile.type,
        };

        const updateResponse = await documentTrackingService.updateDocument(
          existingDocument.id, 
          updateData
        );

        if (updateResponse.success) {
          showSuccess(t('common.success'), t('forms.documents.documentReplaced'));
          // Refresh the lists
          loadExistingDocuments();
          loadDocumentStatuses();
        } else {
          showError(t('common.error'), updateResponse.message || t('forms.documents.replaceError'));
        }
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error replacing document:', error);
      showError(t('common.error'), `${t('forms.documents.replaceError')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('forms.documents.documentNotFound')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('forms.documents.documentNotFound')}</p>
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/dashboard/forms')}>
          ← {t('forms.list.backToForms')}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <DocumentIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('forms.documents.uploadTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('forms.documents.uploadSubtitle')} {formConfig.name}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('forms.documents.uploadProgress')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {documentFiles.filter(df => df.uploaded).length} / {documents.length} {t('forms.documents.uploaded')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${documents.length > 0 ? (documentFiles.filter(df => df.uploaded).length / documents.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Document Status Overview */}
        {documentStatuses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('forms.documents.statusOverview')}
            </h2>
            <DocumentStatus documents={documentStatuses} compact={true} />
          </div>
        )}

        {/* Existing Documents Section */}
        {submissionId && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('forms.documents.existingDocuments')} ({existingDocuments.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={loadExistingDocuments}
                disabled={loadingExisting}
                className="flex items-center gap-2"
              >
                <RefreshIcon className={`w-4 h-4 ${loadingExisting ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </Button>
            </div>

            {loadingExisting ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  {t('forms.documents.loadingDocuments')}
                </span>
              </div>
            ) : existingDocuments.length > 0 ? (
              <div className="space-y-4">
                {existingDocuments.map((doc) => {
                  const documentConfig = documents.find(d => d.id === doc.document_id);
                  const statusClass = doc.upload_status === 'uploaded' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : doc.upload_status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';

                  return (
                    <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <DocumentIcon className="w-5 h-5 text-blue-500" />
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {documentConfig?.name || doc.document_id}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {doc.original_filename}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                              {doc.upload_status}
                            </span>
                            {doc.uploaded_at && (
                              <span>{t('forms.documents.uploadedOn')} {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          
                          {doc.verification_notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {t('forms.documents.notes')}: {doc.verification_notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {doc.firebase_download_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              className="flex items-center gap-2"
                            >
                              <DownloadIcon className="w-4 h-4" />
                              {t('forms.documents.download')}
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplaceDocument(doc)}
                            className="flex items-center gap-2"
                          >
                            <RefreshIcon className="w-4 h-4" />
                            {t('forms.documents.replace')}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <TrashIcon className="w-4 h-4" />
                            {t('forms.documents.delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('forms.documents.noExistingDocuments')}</p>
              </div>
            )}
          </div>
        )}

        {/* Document Upload Cards */}
        <div className="space-y-6">
          {documents.map((document) => {
            const docFile = documentFiles.find(df => df.documentId === document.id);
            
            return (
              <div key={document.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {document.name}
                      </h3>
                      {document.required && (
                        <span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded text-xs font-medium">
                          {t('forms.documents.required')}
                        </span>
                      )}
                      {docFile?.uploaded && (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          {t('forms.documents.uploaded')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {document.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('forms.documents.maxSize')}: {document.maxSize}MB • {t('forms.documents.acceptedTypes')}: {document.acceptedTypes.join(', ')}
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  {!docFile?.file ? (
                    <div className="text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor={`file-${document.id}`} className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                            {t('forms.documents.clickToUpload')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {document.acceptedTypes.map(type => type.toUpperCase()).join(', ')} up to {document.maxSize}MB
                          </span>
                        </label>
                        <input
                          id={`file-${document.id}`}
                          type="file"
                          className="hidden"
                          accept={document.acceptedTypes.map(type => `.${type}`).join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(document.id, file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {docFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(docFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        {!docFile.uploaded && !docFile.uploading && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDocumentFiles(prev => prev.map(df => 
                                  df.documentId === document.id
                                    ? { ...df, file: null, error: null }
                                    : df
                                ));
                              }}
                            >
                              {t('forms.documents.remove')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleFileUpload(document.id)}
                              disabled={!!docFile.error}
                            >
                              {t('forms.documents.upload')}
                            </Button>
                          </div>
                        )}
                        
                        {docFile.uploading && (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('forms.documents.uploading')}</span>
                          </div>
                        )}
                        
                        {docFile.uploaded && (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckIcon className="w-4 h-4" />
                            <span className="text-sm">{t('forms.documents.uploaded')}</span>
                          </div>
                        )}
                      </div>
                      
                      {docFile.error && (
                        <div className="text-red-600 dark:text-red-400 text-sm">
                          {docFile.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Upload Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
          <Button
            onClick={handleCompleteUpload}
            disabled={!allUploaded}
            className="px-6 py-2"
          >
            {t('forms.documents.completeUpload')}
          </Button>
        </div>
      </div>
    </div>
  );
} 