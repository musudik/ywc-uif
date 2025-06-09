import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { DocumentStatus } from '../services/documentTrackingService';

interface DocumentStatusProps {
  documents: DocumentStatus[];
  compact?: boolean;
  showApplicantType?: boolean;
}

// Status badge component
const StatusBadge = ({ status, className = "" }: { status: string; className?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'uploading':
        return (
          <svg className="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)} ${className}`}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function DocumentStatus({ documents, compact = false, showApplicantType = false }: DocumentStatusProps) {
  const { t } = useLanguage();

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.applicant_type]) {
      acc[doc.applicant_type] = [];
    }
    acc[doc.applicant_type].push(doc);
    return acc;
  }, {} as Record<string, DocumentStatus[]>);

  const getOverallStatus = (docs: DocumentStatus[]) => {
    const requiredDocs = docs.filter(doc => doc.required);
    const uploadedDocs = docs.filter(doc => doc.upload_status === 'uploaded');
    const failedDocs = docs.filter(doc => doc.upload_status === 'failed');
    const uploadingDocs = docs.filter(doc => doc.upload_status === 'uploading');

    if (failedDocs.length > 0) return 'failed';
    if (uploadingDocs.length > 0) return 'uploading';
    if (requiredDocs.length === 0) return 'not_required';
    if (uploadedDocs.length === requiredDocs.length) return 'complete';
    if (uploadedDocs.length > 0) return 'partial';
    return 'pending';
  };

  const getProgressPercentage = (docs: DocumentStatus[]) => {
    const requiredDocs = docs.filter(doc => doc.required);
    const uploadedDocs = docs.filter(doc => doc.upload_status === 'uploaded');
    
    if (requiredDocs.length === 0) return 100;
    return Math.round((uploadedDocs.length / requiredDocs.length) * 100);
  };

  if (compact) {
    const allDocs = Object.values(groupedDocuments).flat();
    const overallStatus = getOverallStatus(allDocs);
    const progress = getProgressPercentage(allDocs);

    return (
      <div className="flex items-center gap-2">
        <StatusBadge status={overallStatus} />
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {progress}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedDocuments).map(([applicantType, docs]) => {
        const overallStatus = getOverallStatus(docs);
        const progress = getProgressPercentage(docs);
        const requiredCount = docs.filter(doc => doc.required).length;
        const uploadedCount = docs.filter(doc => doc.upload_status === 'uploaded').length;

        return (
          <div key={applicantType} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {showApplicantType && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {applicantType === 'single' ? t('forms.documents.singleApplicant') : 
                     applicantType === 'applicant1' ? t('forms.list.applicant1') : 
                     t('forms.list.applicant2')}
                  </h3>
                )}
                <StatusBadge status={overallStatus} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {uploadedCount} / {requiredCount} {t('forms.documents.required')}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('forms.documents.uploadProgress')}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {doc.document_name}
                    </span>
                    {doc.required && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        ({t('forms.documents.required')})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.upload_status} className="text-xs" />
                    {doc.submission_document?.uploaded_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(doc.submission_document.uploaded_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 