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
import type { DocumentStatus as DocumentStatusType } from '../../../services/documentTrackingService';
import { getDocumentStorageIds, extractClientIdFromSubmission, sanitizeFileName, getApplicantName } from '../../../utils/documentUtils';

interface DocumentFile {
  documentId: string;
  applicantType: 'applicant1' | 'applicant2';
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

const UserGroupIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export default function DocumentUploadDual() {
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
  const [applicant1Files, setApplicant1Files] = useState<DocumentFile[]>([]);
  const [applicant2Files, setApplicant2Files] = useState<DocumentFile[]>([]);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatusType[]>([]);

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
          console.log("DocumentUploadDual - Loading from submission ID:", submissionId);
          console.log("DocumentUploadDual - Submission form_config_id:", submissionResponse.data.form_config_id);
          
          // Store submission data for context
          setSubmissionData(submissionResponse.data);
          
          const configResponse = await formSubmissionService.getFormConfiguration(submissionResponse.data.form_config_id);
          if (configResponse.success && configResponse.data) {
            formConfigData = configResponse.data;
            console.log("DocumentUploadDual - Successfully loaded config:", {
              id: configResponse.data.id,
              config_id: configResponse.data.config_id,
              name: configResponse.data.name
            });
          } else {
            console.error("DocumentUploadDual - Failed to load config:", configResponse.message);
            console.error("DocumentUploadDual - Attempted config_id:", submissionResponse.data.form_config_id);
          }
        }
      } else if (configId) {
        // Load from config ID
        console.log("DocumentUploadDual - Loading from config ID:", configId);
        const configResponse = await formSubmissionService.getFormConfiguration(configId);
        if (configResponse.success && configResponse.data) {
          formConfigData = configResponse.data;
          console.log("DocumentUploadDual - Successfully loaded config from configId:", {
            id: configResponse.data.id,
            config_id: configResponse.data.config_id,
            name: configResponse.data.name
          });
        } else {
          console.error("DocumentUploadDual - Failed to load config from configId:", configResponse.message);
          console.error("DocumentUploadDual - Attempted configId:", configId);
        }
      }

      if (formConfigData) {
        setFormConfig(formConfigData);
        setDocuments(formConfigData.documents || []);
        
        // Initialize document files state for both applicants
        const initialApplicant1Files = (formConfigData.documents || []).map((doc: Document) => ({
          documentId: doc.id,
          applicantType: 'applicant1' as const,
          file: null,
          uploaded: false,
          uploading: false,
          error: null,
        }));
        
        const initialApplicant2Files = (formConfigData.documents || []).map((doc: Document) => ({
          documentId: doc.id,
          applicantType: 'applicant2' as const,
          file: null,
          uploaded: false,
          uploading: false,
          error: null,
        }));
        
        setApplicant1Files(initialApplicant1Files);
        setApplicant2Files(initialApplicant2Files);
        
        // Load document statuses if we have a submission ID
        if (submissionId) {
          loadDocumentStatuses();
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

  const handleFileSelect = (documentId: string, file: File, applicantType: 'applicant1' | 'applicant2') => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    const validationError = validateFile(file, document);
    
    if (applicantType === 'applicant1') {
      setApplicant1Files(prev => prev.map(docFile => 
        docFile.documentId === documentId
          ? { ...docFile, file, error: validationError, uploaded: false }
          : docFile
      ));
    } else {
      setApplicant2Files(prev => prev.map(docFile => 
        docFile.documentId === documentId
          ? { ...docFile, file, error: validationError, uploaded: false }
          : docFile
      ));
    }
  };

  const handleFileUpload = async (documentId: string, applicantType: 'applicant1' | 'applicant2') => {
    const docFiles = applicantType === 'applicant1' ? applicant1Files : applicant2Files;
    const setDocFiles = applicantType === 'applicant1' ? setApplicant1Files : setApplicant2Files;
    
    const docFile = docFiles.find(df => df.documentId === documentId);
    const document = documents.find(doc => doc.id === documentId);
    if (!docFile?.file || docFile.error || !document || !user) return;

    setDocFiles(prev => prev.map(df => 
      df.documentId === documentId
        ? { ...df, uploading: true, error: null }
        : df
    ));

    try {
      // Get client context from submission data if available
      const contextClientId = submissionData ? extractClientIdFromSubmission(submissionData, user) : undefined;
      
      // Determine storage IDs based on user role and context
      const { coachId, clientId } = getDocumentStorageIds(user, contextClientId);

      console.log('Uploading dual applicant document to Firebase Storage:', {
        coachId,
        clientId,
        applicantName: applicantType,
        documentName: sanitizeFileName(document.name),
        documentId: document.id,
        fileName: docFile.file.name,
        submissionId: submissionId,
        contextClientId
      });

      // Try simple upload first to avoid CORS issues
      const uploadResult = await firebaseStorageService.uploadDocumentSimple({
        file: docFile.file,
        coachId,
        clientId,
        applicantName: applicantType,
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
            applicant_type: applicantType,
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

        setDocFiles(prev => prev.map(df => 
          df.documentId === documentId
            ? { 
                ...df, 
                uploading: false, 
                uploaded: true, 
                downloadURL: uploadResult.data!.downloadURL 
              }
            : df
        ));

        showSuccess(t('common.success'), `${t('forms.documents.documentUploaded')} ${applicantType === 'applicant1' ? t('forms.list.applicant1') : t('forms.list.applicant2')}`);
        console.log(`Document uploaded successfully for ${applicantType}:`, uploadResult.data);
        
        // Refresh document statuses
        if (submissionId) {
          loadDocumentStatuses();
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
          applicantType,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      setDocFiles(prev => prev.map(df => 
        df.documentId === documentId
          ? { ...df, uploading: false, error: t('forms.documents.uploadFailed') }
          : df
      ));
      showError(t('common.error'), `${t('forms.documents.uploadFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompleteUpload = () => {
    // Check if all required documents are uploaded for both applicants
    const requiredDocs = documents.filter(doc => doc.required);
    
    const uploadedApplicant1RequiredDocs = applicant1Files.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });
    
    const uploadedApplicant2RequiredDocs = applicant2Files.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });

    if (requiredDocs.length !== uploadedApplicant1RequiredDocs.length || 
        requiredDocs.length !== uploadedApplicant2RequiredDocs.length) {
      showError(t('common.error'), t('forms.documents.allRequiredDocumentsDual'));
      return;
    }

    showSuccess(t('common.success'), t('forms.documents.allDocumentsUploadedDual'));
    navigate('/dashboard/forms');
  };

  useEffect(() => {
    // Check if all required documents are uploaded for both applicants
    const requiredDocs = documents.filter(doc => doc.required);
    
    const uploadedApplicant1RequiredDocs = applicant1Files.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });
    
    const uploadedApplicant2RequiredDocs = applicant2Files.filter(df => {
      const doc = documents.find(d => d.id === df.documentId);
      return doc?.required && df.uploaded;
    });
    
    setAllRequiredUploaded(
      requiredDocs.length > 0 && 
      requiredDocs.length === uploadedApplicant1RequiredDocs.length && 
      requiredDocs.length === uploadedApplicant2RequiredDocs.length
    );
  }, [applicant1Files, applicant2Files, documents]);

  const renderDocumentSection = (applicantType: 'applicant1' | 'applicant2', applicantLabel: string) => {
    const docFiles = applicantType === 'applicant1' ? applicant1Files : applicant2Files;
    
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {applicantLabel}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('forms.documents.uploadSubtitle')} {applicantLabel.toLowerCase()}
          </p>
          
          {/* Progress for this applicant */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('forms.documents.uploadProgress')}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {docFiles.filter(df => df.uploaded).length} / {documents.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${documents.length > 0 ? (docFiles.filter(df => df.uploaded).length / documents.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {documents.map((document) => {
          const docFile = docFiles.find(df => df.documentId === document.id);
          
          return (
            <div key={`${applicantType}-${document.id}`} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
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
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    {document.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('forms.documents.maxSize')}: {document.maxSize}MB • {t('forms.documents.acceptedTypes')}: {document.acceptedTypes.join(', ')}
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {!docFile?.file ? (
                  <div className="text-center">
                    <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor={`file-${applicantType}-${document.id}`} className="cursor-pointer">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {t('forms.documents.clickToUpload')}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {document.acceptedTypes.map(type => type.toUpperCase()).join(', ')}
                        </span>
                      </label>
                      <input
                        id={`file-${applicantType}-${document.id}`}
                        type="file"
                        className="hidden"
                        accept={document.acceptedTypes.map(type => `.${type}`).join(',')}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(document.id, file, applicantType);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                          <DocumentIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            {docFile.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(docFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      {!docFile.uploaded && !docFile.uploading && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (applicantType === 'applicant1') {
                                setApplicant1Files(prev => prev.map(df => 
                                  df.documentId === document.id
                                    ? { ...df, file: null, error: null }
                                    : df
                                ));
                              } else {
                                setApplicant2Files(prev => prev.map(df => 
                                  df.documentId === document.id
                                    ? { ...df, file: null, error: null }
                                    : df
                                ));
                              }
                            }}
                            className="text-xs px-2 py-1"
                          >
                            {t('forms.documents.remove')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleFileUpload(document.id, applicantType)}
                            disabled={!!docFile.error}
                            className="text-xs px-2 py-1"
                          >
                            {t('forms.documents.upload')}
                          </Button>
                        </div>
                      )}
                      
                      {docFile.uploading && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{t('forms.documents.uploading')}</span>
                        </div>
                      )}
                      
                      {docFile.uploaded && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckIcon className="w-3 h-3" />
                          <span className="text-xs">{t('forms.documents.uploaded')}</span>
                        </div>
                      )}
                    </div>
                    
                    {docFile.error && (
                      <div className="text-red-600 dark:text-red-400 text-xs">
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
    );
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('forms.dual.formNotFoundTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('forms.dual.formNotFoundMessage')}</p>
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
          <UserGroupIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('forms.documents.dualUploadTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('forms.documents.dualUploadSubtitle')} - {formConfig.name}
            </p>
          </div>
        </div>

        {/* Overall Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('forms.documents.overallProgress')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {applicant1Files.filter(df => df.uploaded).length + applicant2Files.filter(df => df.uploaded).length} / {documents.length * 2} {t('forms.documents.uploaded')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${documents.length > 0 ? ((applicant1Files.filter(df => df.uploaded).length + applicant2Files.filter(df => df.uploaded).length) / (documents.length * 2)) * 100 : 0}%` 
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
            <DocumentStatus documents={documentStatuses} showApplicantType={true} />
          </div>
        )}

        {/* Dual Applicant Document Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Applicant 1 Documents */}
          {renderDocumentSection('applicant1', t('forms.list.applicant1'))}
          
          {/* Applicant 2 Documents */}
          {renderDocumentSection('applicant2', t('forms.list.applicant2'))}
        </div>

        {/* Complete Upload Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
          <Button
            onClick={handleCompleteUpload}
            disabled={!allRequiredUploaded}
            className="px-6 py-2"
          >
            {t('forms.documents.completeUploadDual')}
          </Button>
        </div>
      </div>
    </div>
  );
} 