# Firebase Storage Setup

This document explains how to configure Firebase Storage for document uploads in the YWC application.

## Environment Variables

Create a `.env` file in the root directory with the following Firebase configuration variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDlYMYl0llL-mSF7yDo21sQP2tF4X9xol4
VITE_FIREBASE_AUTH_DOMAIN=ywc-storage.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ywc-storage
VITE_FIREBASE_STORAGE_BUCKET=ywc-storage.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=685075746401
VITE_FIREBASE_APP_ID=1:685075746401:web:bc281fa4ba9233d0eee420

# Development
VITE_NODE_ENV=development
```

## Firebase Storage Structure

Documents are organized in a systematic folder structure:

```
coaches/
├── {coachId}/
│   └── clients/
│       └── {clientId}/
│           └── applicants/
│               ├── single/
│               │   └── documents/
│               │       └── {documentId}-{documentName}
│               ├── applicant1/
│               │   └── documents/
│               │       └── {documentId}-{documentName}
│               └── applicant2/
│                   └── documents/
│                       └── {documentId}-{documentName}
```

### Folder Structure Examples:

**Single Applicant:**
```
coaches/coach-123/clients/client-456/applicants/single/documents/doc-1-passport.pdf
```

**Dual Applicant:**
```
coaches/coach-123/clients/client-456/applicants/applicant1/documents/doc-1-passport.pdf
coaches/coach-123/clients/client-456/applicants/applicant2/documents/doc-1-passport.pdf
```

## Service Features

The `firebaseStorageService` provides the following functionality:

### Core Operations
- **Upload Document**: Upload files with proper organization and metadata
- **Download Document**: Get download URLs for uploaded files
- **Replace Document**: Update existing documents
- **Delete Document**: Remove documents from storage
- **List Documents**: Get all documents for an applicant or client

### Metadata
Each uploaded document includes metadata:
- Document ID and name
- Coach and client IDs
- Applicant information
- Submission ID (if applicable)
- Upload timestamp
- Original filename

### Error Handling
- File size validation
- File type validation
- Upload progress tracking
- Comprehensive error messages

## Usage Examples

### Single Applicant Upload
```typescript
const uploadResult = await firebaseStorageService.uploadDocument({
  file: selectedFile,
  coachId: 'coach-123',
  clientId: 'client-456',
  applicantName: 'single',
  documentName: 'passport',
  documentId: 'doc-1',
  submissionId: 'sub-789'
});
```

### Dual Applicant Upload
```typescript
const uploadResult = await firebaseStorageService.uploadDocument({
  file: selectedFile,
  coachId: 'coach-123',
  clientId: 'client-456',
  applicantName: 'applicant1', // or 'applicant2'
  documentName: 'income_statement',
  documentId: 'doc-2',
  submissionId: 'sub-789'
});
```

### List All Documents for a Client
```typescript
const documentsResult = await firebaseStorageService.listClientDocuments(
  'coach-123',
  'client-456'
);
// Returns: { applicant1: DocumentMetadata[], applicant2: DocumentMetadata[] }
```

## Security Considerations

1. **Authentication**: Ensure users are authenticated before allowing uploads
2. **Authorization**: Validate user permissions for coach-client relationships
3. **File Validation**: Check file types and sizes before upload
4. **Path Validation**: Ensure users can only access their authorized paths

## Storage Rules (Firebase Console)

Configure Firebase Storage Rules to secure document access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to access their coach-client documents
    match /coaches/{coachId}/clients/{clientId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == coachId || 
         request.auth.uid == clientId ||
         // Add admin check here
         request.auth.token.role == 'ADMIN');
    }
  }
}
```

## Integration Notes

The document upload components (`DocumentUploadSingle` and `DocumentUploadDual`) automatically:

1. Determine the correct coach-client relationship based on user role
2. Extract context from form submissions when available
3. Use systematic file naming and organization
4. Provide upload progress and error handling
5. Store download URLs for future access

This ensures consistent, organized, and secure document storage across the application. 