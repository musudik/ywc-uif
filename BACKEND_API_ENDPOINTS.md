# Backend API Endpoints for Document Tracking

This document outlines the API endpoints that need to be implemented in your backend to support the document tracking system.

## 📋 **Required Database Tables**

First, implement the database schema from `database-schema-documents.sql`:

- `form_documents` - Document requirements for form configurations
- `submission_documents` - Actual document uploads for submissions
- `document_versions` - Document replacement history
- Updates to `form_submissions` table for document status tracking

## 🔗 **API Endpoints to Implement**

### **1. Form Documents (Requirements)**

#### `GET /api/form-configurations/{configId}/documents`
Get document requirements for a form configuration.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "form_config_id": "uuid",
      "document_id": "passport",
      "document_name": "Passport",
      "description": "Valid passport copy",
      "required": true,
      "max_size_mb": 10,
      "accepted_file_types": ["pdf", "jpg", "png"],
      "applicant_config": "both",
      "display_order": 1
    }
  ]
}
```

### **2. Submission Documents**

#### `POST /api/submission-documents`
Create a new document record.

**Request:**
```json
{
  "form_submission_id": "uuid",
  "document_id": "passport",
  "applicant_type": "single",
  "original_filename": "passport.pdf",
  "file_size_bytes": 1234567,
  "content_type": "application/pdf",
  "firebase_path": "coaches/xxx/clients/xxx/...",
  "firebase_download_url": "https://...",
  "firebase_metadata": {},
  "uploaded_by": "user_id"
}
```

#### `PUT /api/submission-documents/{documentId}`
Update a document record.

**Request:**
```json
{
  "upload_status": "uploaded",
  "firebase_download_url": "https://...",
  "verification_status": "pending"
}
```

#### `DELETE /api/submission-documents/{documentId}`
Soft delete (mark as replaced) a document.

#### `GET /api/form-submissions/{submissionId}/documents`
Get all documents for a submission.

#### `GET /api/form-submissions/{submissionId}/document-status`
Get document status overview for a submission.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "document_id": "passport",
      "document_name": "Passport",
      "required": true,
      "applicant_type": "single",
      "upload_status": "uploaded",
      "submission_document": {
        "id": "uuid",
        "uploaded_at": "2024-01-15T10:30:00Z",
        "firebase_download_url": "https://..."
      }
    }
  ]
}
```

#### `GET /api/form-submissions/{submissionId}/summary`
Get submission document summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "document_status": "partial",
    "total_required_documents": 5,
    "successfully_uploaded": 3,
    "required_uploaded": 2,
    "first_upload_at": "2024-01-15T10:30:00Z"
  }
}
```

### **3. Convenience Endpoints**

#### `POST /api/submission-documents/mark-uploaded`
Mark a document as successfully uploaded.

**Request:**
```json
{
  "clientId": "e3337879-bb7a-47b8-b14c-3897b1fe6190",
  "formConfigId": "5c3ddc93-6de4-4b81-be99-93bb81b493ef",
  "fileName": "selfDisclosure_en (3).pdf",
  "applicant_type": "single",
  "document_id": "income_proof",
  "firebase_path": "coaches/6b2c586f-7de7-4d54-b927-c9b3e7cdec00/clients/e3337879-bb7a-47b8-b14c-3897b1fe6190/applicants/single/documents/income_proof-proof_of_income",
  "form_submission_id": "7558bd07-42ae-4575-b6e1-7f8552d619e4",
  "upload_status": "uploaded",
  "uploaded_at": "2025-06-02T22:36:10.124Z"
}
```

#### `POST /api/submission-documents/mark-failed`
Mark a document upload as failed.

**Request:**
```json
{
  "form_submission_id": "uuid",
  "document_id": "passport",
  "applicant_type": "single",
  "verification_notes": "Upload failed: file too large"
}
```

## 🔄 **Business Logic Requirements**

### **Status Management**
- Automatically update `form_submissions.document_status` when documents are uploaded/failed
- Calculate progress percentages based on required vs uploaded documents
- Handle dual applicant scenarios where each applicant has separate document requirements

### **Document Status Values**
- `not_required` - No documents required for this form
- `pending` - Documents required but none uploaded
- `partial` - Some documents uploaded but not all required ones
- `complete` - All required documents uploaded
- `under_review` - Documents are being reviewed by coach/admin

### **Upload Status Values**
- `pending` - Document requirement exists but no file uploaded
- `uploading` - File upload in progress
- `uploaded` - Successfully uploaded to Firebase Storage
- `failed` - Upload failed
- `replaced` - Document was replaced with newer version

### **Verification Status Values**
- `pending` - Awaiting review
- `approved` - Document approved by coach/admin
- `rejected` - Document rejected, needs replacement
- `requires_replacement` - Document needs to be replaced

## 🔐 **Security Considerations**

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own submissions (clients) or assigned submissions (coaches)
3. **File Access**: Validate Firebase Storage URLs belong to the authenticated user's allowed paths
4. **Input Validation**: Validate file sizes, types, and metadata before storing

## 📊 **Database Triggers**

The database includes automatic triggers that:
- Update `form_submissions.document_status` when documents are uploaded/deleted
- Calculate completion percentages
- Set completion timestamps
- Maintain audit trails

## 🔄 **Integration Points**

### **Form Submission Flow**
1. User submits form → creates `form_submission` record
2. If documents required → redirect to document upload page
3. User uploads documents → creates `submission_documents` records
4. Database triggers update overall status automatically

### **Coach Dashboard Integration**
- Display document status in submission lists
- Allow coaches to review and approve/reject documents
- Show progress indicators for incomplete submissions

### **Client Dashboard Integration**
- Show document upload progress
- Allow clients to replace rejected documents
- Display approval status from coaches

This system provides comprehensive document tracking that integrates seamlessly with your existing form submission workflow! 