-- Document Tracking Database Schema
-- This schema tracks document uploads for form submissions

-- Table: form_documents
-- Tracks each document requirement for a form configuration
CREATE TABLE form_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_config_id UUID NOT NULL,
    document_id VARCHAR(255) NOT NULL, -- From form config
    document_name VARCHAR(255) NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT true,
    max_size_mb INTEGER NOT NULL DEFAULT 10,
    accepted_file_types TEXT[] NOT NULL, -- Array of file extensions
    applicant_config VARCHAR(50), -- 'single', 'dual', 'both'
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_form_documents_config FOREIGN KEY (form_config_id) 
        REFERENCES form_configurations(config_id) ON DELETE CASCADE,
    CONSTRAINT unique_form_document UNIQUE (form_config_id, document_id)
);

-- Table: submission_documents
-- Tracks actual document uploads for each form submission
CREATE TABLE submission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_submission_id UUID NOT NULL,
    document_id VARCHAR(255) NOT NULL, -- Links to form_documents.document_id
    applicant_type VARCHAR(50) NOT NULL, -- 'single', 'applicant1', 'applicant2'
    
    -- Document details
    original_filename VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    
    -- Firebase Storage details
    firebase_path TEXT NOT NULL,
    firebase_download_url TEXT,
    firebase_metadata JSONB,
    
    -- Upload tracking
    upload_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'uploading', 'uploaded', 'failed', 'replaced'
    uploaded_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID NOT NULL, -- User who uploaded
    
    -- Verification and approval
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'requires_replacement'
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_submission_documents_submission FOREIGN KEY (form_submission_id) 
        REFERENCES form_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_documents_uploader FOREIGN KEY (uploaded_by) 
        REFERENCES users(id),
    CONSTRAINT fk_submission_documents_verifier FOREIGN KEY (verified_by) 
        REFERENCES users(id),
    CONSTRAINT unique_submission_document UNIQUE (form_submission_id, document_id, applicant_type)
);

-- Table: document_versions
-- Tracks document replacement history
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    
    -- Previous document details
    previous_firebase_path TEXT NOT NULL,
    previous_download_url TEXT,
    previous_filename VARCHAR(500) NOT NULL,
    
    -- Replacement details
    replaced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    replaced_by UUID NOT NULL,
    replacement_reason TEXT,
    
    CONSTRAINT fk_document_versions_document FOREIGN KEY (submission_document_id) 
        REFERENCES submission_documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_versions_user FOREIGN KEY (replaced_by) 
        REFERENCES users(id)
);

-- Update form_submissions table to include document status
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS document_status VARCHAR(50) DEFAULT 'not_required', -- 'not_required', 'pending', 'partial', 'complete', 'under_review'
ADD COLUMN IF NOT EXISTS documents_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_documents_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_documents_uploaded INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_form_documents_config_id ON form_documents(form_config_id);
CREATE INDEX idx_form_documents_required ON form_documents(required);

CREATE INDEX idx_submission_documents_submission_id ON submission_documents(form_submission_id);
CREATE INDEX idx_submission_documents_status ON submission_documents(upload_status);
CREATE INDEX idx_submission_documents_applicant ON submission_documents(applicant_type);
CREATE INDEX idx_submission_documents_uploaded_at ON submission_documents(uploaded_at);

CREATE INDEX idx_document_versions_document_id ON document_versions(submission_document_id);
CREATE INDEX idx_document_versions_replaced_at ON document_versions(replaced_at);

-- Views for easier querying
CREATE VIEW submission_document_summary AS
SELECT 
    fs.id AS submission_id,
    fs.user_id,
    fs.form_config_id,
    fs.status AS form_status,
    fs.document_status,
    COUNT(fd.id) AS total_required_documents,
    COUNT(sd.id) AS total_uploaded_documents,
    COUNT(CASE WHEN sd.upload_status = 'uploaded' THEN 1 END) AS successfully_uploaded,
    COUNT(CASE WHEN sd.upload_status = 'failed' THEN 1 END) AS failed_uploads,
    COUNT(CASE WHEN fd.required = true THEN 1 END) AS required_documents,
    COUNT(CASE WHEN fd.required = true AND sd.upload_status = 'uploaded' THEN 1 END) AS required_uploaded,
    MIN(sd.uploaded_at) AS first_upload_at,
    MAX(sd.uploaded_at) AS last_upload_at
FROM form_submissions fs
LEFT JOIN form_documents fd ON fs.form_config_id = fd.form_config_id
LEFT JOIN submission_documents sd ON fs.id = sd.form_submission_id AND fd.document_id = sd.document_id
GROUP BY fs.id, fs.user_id, fs.form_config_id, fs.status, fs.document_status;

-- Function to update document status
CREATE OR REPLACE FUNCTION update_submission_document_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the form submission document status
    UPDATE form_submissions 
    SET 
        total_documents_uploaded = (
            SELECT COUNT(*) 
            FROM submission_documents 
            WHERE form_submission_id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
            AND upload_status = 'uploaded'
        ),
        document_status = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM form_documents fd 
                WHERE fd.form_config_id = (
                    SELECT form_config_id 
                    FROM form_submissions 
                    WHERE id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                )
                AND fd.required = true
            ) = 0 THEN 'not_required'
            WHEN (
                SELECT COUNT(*) 
                FROM form_documents fd 
                WHERE fd.form_config_id = (
                    SELECT form_config_id 
                    FROM form_submissions 
                    WHERE id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                )
                AND fd.required = true
            ) = (
                SELECT COUNT(*) 
                FROM submission_documents sd 
                JOIN form_documents fd ON sd.document_id = fd.document_id 
                WHERE sd.form_submission_id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                AND sd.upload_status = 'uploaded'
                AND fd.required = true
            ) THEN 'complete'
            WHEN (
                SELECT COUNT(*) 
                FROM submission_documents sd 
                WHERE sd.form_submission_id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                AND sd.upload_status = 'uploaded'
            ) > 0 THEN 'partial'
            ELSE 'pending'
        END,
        documents_completed_at = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM form_documents fd 
                WHERE fd.form_config_id = (
                    SELECT form_config_id 
                    FROM form_submissions 
                    WHERE id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                )
                AND fd.required = true
            ) = (
                SELECT COUNT(*) 
                FROM submission_documents sd 
                JOIN form_documents fd ON sd.document_id = fd.document_id 
                WHERE sd.form_submission_id = COALESCE(NEW.form_submission_id, OLD.form_submission_id)
                AND sd.upload_status = 'uploaded'
                AND fd.required = true
            ) THEN CURRENT_TIMESTAMP
            ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.form_submission_id, OLD.form_submission_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update document status
CREATE TRIGGER trigger_update_submission_document_status
    AFTER INSERT OR UPDATE OR DELETE ON submission_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_document_status(); 