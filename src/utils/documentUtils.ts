import type { User } from '../types';

/**
 * Determine the coach ID and client ID for document storage based on user role and context
 */
export interface DocumentStorageIds {
  coachId: string;
  clientId: string;
}

export function getDocumentStorageIds(
  user: User,
  contextClientId?: string
): DocumentStorageIds {
  let coachId = '';
  let clientId = '';

  switch (user.role) {
    case 'CLIENT':
      clientId = user.id;
      coachId = user.coach_id || 'default-coach';
      break;
      
    case 'COACH':
      coachId = user.id;
      // For coaches, they might be uploading documents for a specific client
      // This could come from route params, form submission context, or current client selection
      clientId = contextClientId || 'current-client';
      break;
      
    case 'ADMIN':
      // For admins, we might want to use a special admin folder structure
      // or they might be acting on behalf of a specific coach-client pair
      coachId = contextClientId ? 'admin-as-coach' : 'admin';
      clientId = contextClientId || 'admin-client';
      break;
      
    default:
      coachId = 'guest';
      clientId = 'guest-client';
      break;
  }

  return { coachId, clientId };
}

/**
 * Generate a sanitized file name for storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
}

/**
 * Get the applicant name for folder structure
 */
export function getApplicantName(
  formType: 'single' | 'dual',
  applicantType?: 'applicant1' | 'applicant2'
): string {
  if (formType === 'single') {
    return 'single';
  }
  
  return applicantType || 'applicant1';
}

/**
 * Extract client ID from form submission if available
 */
export function extractClientIdFromSubmission(
  submissionData: any,
  user: User
): string | undefined {
  // If the submission has user_id and it's different from current user
  // (e.g., coach uploading for client), use that as client ID
  if (submissionData?.user_id && submissionData.user_id !== user.id && user.role === 'COACH') {
    return submissionData.user_id;
  }
  
  return undefined;
} 