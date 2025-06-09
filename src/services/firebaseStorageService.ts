import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata,
  updateMetadata,
  uploadBytesResumable,
  UploadTaskSnapshot
} from "firebase/storage";
import { storage, ensureFirebaseAuth } from "../config/firebase";
import type { ApiResponse } from "../types";

// Types for the storage service
export interface DocumentUploadData {
  file: File;
  coachId: string;
  clientId: string;
  applicantName: string; // 'applicant1', 'applicant2', 'single', etc.
  documentName: string;
  documentId: string;
  submissionId?: string;
}

export interface DocumentDownloadData {
  coachId: string;
  clientId: string;
  applicantName: string;
  documentName: string;
  documentId: string;
}

export interface DocumentMetadata {
  name: string;
  size: number;
  contentType: string;
  timeCreated: string;
  updated: string;
  downloadURL: string;
  fullPath: string;
  md5Hash?: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

class FirebaseStorageService {
  
  /**
   * Generate the systematic file path
   * Format: coaches/{coachId}/clients/{clientId}/applicants/{applicantName}/documents/{documentId}-{documentName}
   */
  private generateFilePath(data: DocumentUploadData | DocumentDownloadData): string {
    const { coachId, clientId, applicantName, documentName, documentId } = data;
    // Clean the document name to avoid special characters in path
    const cleanDocumentName = documentName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `coaches/${coachId}/clients/${clientId}/applicants/${applicantName}/documents/${documentId}-${cleanDocumentName}`;
  }

  /**
   * Upload a document to Firebase Storage using resumable upload
   */
  async uploadDocument(
    data: DocumentUploadData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<{ downloadURL: string; metadata: DocumentMetadata }>> {
    try {
      // Ensure Firebase authentication (optional in development)
      await ensureFirebaseAuth();
      
      const filePath = this.generateFilePath(data);
      console.log('Uploading to Firebase Storage path:', filePath);
      
      const storageRef = ref(storage, filePath);

      // Add custom metadata
      const metadata = {
        contentType: data.file.type || 'application/octet-stream',
        customMetadata: {
          documentId: data.documentId,
          coachId: data.coachId,
          clientId: data.clientId,
          applicantName: data.applicantName,
          submissionId: data.submissionId || '',
          uploadedAt: new Date().toISOString(),
          originalFileName: data.file.name
        }
      };

      // Use resumable upload for better reliability and progress tracking
      const uploadTask = uploadBytesResumable(storageRef, data.file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress({
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: Math.round(progress)
              });
            }
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            // Upload failed
            console.error('Upload failed:', error);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const fileMetadata = await getMetadata(uploadTask.snapshot.ref);
              
              const documentMetadata: DocumentMetadata = {
                name: fileMetadata.name,
                size: fileMetadata.size,
                contentType: fileMetadata.contentType || 'application/octet-stream',
                timeCreated: fileMetadata.timeCreated,
                updated: fileMetadata.updated,
                downloadURL,
                fullPath: fileMetadata.fullPath,
                md5Hash: fileMetadata.md5Hash
              };

              console.log('Document uploaded successfully:', {
                path: filePath,
                downloadURL,
                metadata: documentMetadata
              });

              resolve({
                success: true,
                message: 'Document uploaded successfully',
                data: { downloadURL, metadata: documentMetadata }
              });
            } catch (metadataError) {
              console.error('Error getting file metadata:', metadataError);
              reject(metadataError);
            }
          }
        );
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simple upload method (fallback)
   */
  async uploadDocumentSimple(
    data: DocumentUploadData
  ): Promise<ApiResponse<{ downloadURL: string; metadata: DocumentMetadata }>> {
    try {
      // Ensure Firebase authentication (optional in development)
      await ensureFirebaseAuth();
      
      const filePath = this.generateFilePath(data);
      console.log('Simple upload to Firebase Storage path:', filePath);
      
      const storageRef = ref(storage, filePath);

      // Add custom metadata
      const metadata = {
        contentType: data.file.type || 'application/octet-stream',
        customMetadata: {
          documentId: data.documentId,
          coachId: data.coachId,
          clientId: data.clientId,
          applicantName: data.applicantName,
          submissionId: data.submissionId || '',
          uploadedAt: new Date().toISOString(),
          originalFileName: data.file.name
        }
      };

      // Use simple uploadBytes
      const snapshot = await uploadBytes(storageRef, data.file, metadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Get file metadata
      const fileMetadata = await getMetadata(snapshot.ref);
      
      const documentMetadata: DocumentMetadata = {
        name: fileMetadata.name,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType || 'application/octet-stream',
        timeCreated: fileMetadata.timeCreated,
        updated: fileMetadata.updated,
        downloadURL,
        fullPath: fileMetadata.fullPath,
        md5Hash: fileMetadata.md5Hash
      };

      console.log('Document uploaded successfully (simple):', {
        path: filePath,
        downloadURL,
        metadata: documentMetadata
      });

      return {
        success: true,
        message: 'Document uploaded successfully',
        data: { downloadURL, metadata: documentMetadata }
      };

    } catch (error) {
      console.error('Error uploading document (simple):', error);
      return {
        success: false,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download a document URL from Firebase Storage
   */
  async getDocumentURL(data: DocumentDownloadData): Promise<ApiResponse<string>> {
    try {
      // Ensure Firebase authentication (optional in development)
      await ensureFirebaseAuth();
      
      const filePath = this.generateFilePath(data);
      const storageRef = ref(storage, filePath);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        success: true,
        message: 'Document URL retrieved successfully',
        data: downloadURL
      };

    } catch (error) {
      console.error('Error getting document URL:', error);
      return {
        success: false,
        message: 'Failed to get document URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(data: DocumentDownloadData): Promise<ApiResponse<DocumentMetadata>> {
    try {
      const filePath = this.generateFilePath(data);
      const storageRef = ref(storage, filePath);
      
      const metadata = await getMetadata(storageRef);
      const downloadURL = await getDownloadURL(storageRef);
      
      const documentMetadata: DocumentMetadata = {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType || 'application/octet-stream',
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        downloadURL,
        fullPath: metadata.fullPath,
        md5Hash: metadata.md5Hash
      };

      return {
        success: true,
        message: 'Document metadata retrieved successfully',
        data: documentMetadata
      };

    } catch (error) {
      console.error('Error getting document metadata:', error);
      return {
        success: false,
        message: 'Failed to get document metadata',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Replace/Update a document (upload new version)
   */
  async replaceDocument(
    data: DocumentUploadData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<{ downloadURL: string; metadata: DocumentMetadata }>> {
    try {
      // First delete the existing document if it exists
      await this.deleteDocument({
        coachId: data.coachId,
        clientId: data.clientId,
        applicantName: data.applicantName,
        documentName: data.documentName,
        documentId: data.documentId
      });

      // Upload the new document
      return await this.uploadDocument(data, onProgress);

    } catch (error) {
      console.error('Error replacing document:', error);
      return {
        success: false,
        message: 'Failed to replace document',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a document from Firebase Storage
   */
  async deleteDocument(data: DocumentDownloadData): Promise<ApiResponse<void>> {
    try {
      const filePath = this.generateFilePath(data);
      const storageRef = ref(storage, filePath);
      
      await deleteObject(storageRef);
      
      console.log('Document deleted successfully:', filePath);
      
      return {
        success: true,
        message: 'Document deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting document:', error);
      // If file doesn't exist, consider it a success
      if (error instanceof Error && error.message.includes('object-not-found')) {
        return {
          success: true,
          message: 'Document was already deleted or does not exist'
        };
      }
      
      return {
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all documents for a specific applicant
   */
  async listApplicantDocuments(
    coachId: string,
    clientId: string,
    applicantName: string
  ): Promise<ApiResponse<DocumentMetadata[]>> {
    try {
      const folderPath = `coaches/${coachId}/clients/${clientId}/applicants/${applicantName}/documents/`;
      const storageRef = ref(storage, folderPath);
      
      const listResult = await listAll(storageRef);
      
      const documents: DocumentMetadata[] = [];
      
      for (const item of listResult.items) {
        try {
          const metadata = await getMetadata(item);
          const downloadURL = await getDownloadURL(item);
          
          documents.push({
            name: metadata.name,
            size: metadata.size,
            contentType: metadata.contentType || 'application/octet-stream',
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            downloadURL,
            fullPath: metadata.fullPath,
            md5Hash: metadata.md5Hash
          });
        } catch (itemError) {
          console.warn('Error getting metadata for item:', item.fullPath, itemError);
        }
      }

      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: documents
      };

    } catch (error) {
      console.error('Error listing applicant documents:', error);
      return {
        success: false,
        message: 'Failed to list documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all documents for a specific client (all applicants)
   */
  async listClientDocuments(
    coachId: string,
    clientId: string
  ): Promise<ApiResponse<{ [applicantName: string]: DocumentMetadata[] }>> {
    try {
      const clientPath = `coaches/${coachId}/clients/${clientId}/applicants/`;
      const storageRef = ref(storage, clientPath);
      
      const listResult = await listAll(storageRef);
      
      const documentsByApplicant: { [applicantName: string]: DocumentMetadata[] } = {};
      
      // List each applicant folder
      for (const applicantFolder of listResult.prefixes) {
        const applicantName = applicantFolder.name;
        const applicantDocsResult = await this.listApplicantDocuments(coachId, clientId, applicantName);
        
        if (applicantDocsResult.success && applicantDocsResult.data) {
          documentsByApplicant[applicantName] = applicantDocsResult.data;
        }
      }

      return {
        success: true,
        message: 'Client documents retrieved successfully',
        data: documentsByApplicant
      };

    } catch (error) {
      console.error('Error listing client documents:', error);
      return {
        success: false,
        message: 'Failed to list client documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a document exists
   */
  async documentExists(data: DocumentDownloadData): Promise<boolean> {
    try {
      const filePath = this.generateFilePath(data);
      const storageRef = ref(storage, filePath);
      
      await getMetadata(storageRef);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size without downloading
   */
  async getDocumentSize(data: DocumentDownloadData): Promise<ApiResponse<number>> {
    try {
      const filePath = this.generateFilePath(data);
      const storageRef = ref(storage, filePath);
      
      const metadata = await getMetadata(storageRef);
      
      return {
        success: true,
        message: 'File size retrieved successfully',
        data: metadata.size
      };

    } catch (error) {
      console.error('Error getting document size:', error);
      return {
        success: false,
        message: 'Failed to get document size',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService; 