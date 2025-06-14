import jsPDF from 'jspdf';

interface FormMetadata {
  formName: string;
  formType: string;
  version: string;
  description: string;
  submissionDate: string;
  clientName: string;
  clientEmail: string;
  status: string;
}

interface FormSectionData {
  title: string;
  description?: string;
  fields: Array<{
    label: string;
    value: any;
    type: string;
  }>;
}

export class PDFExporter {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private lineHeight: number;
  private currentY: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 20;
    this.lineHeight = 7;
    this.currentY = this.margin;
  }

  private addNewPageIfNeeded(spaceNeeded: number = 20): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private async addLogo(): Promise<void> {
    try {
      // Create an image element to load the logo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Create canvas to convert image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve();
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const dataURL = canvas.toDataURL('image/png');
            
            // Add logo to PDF (top right corner)
            const logoWidth = 30;
            const logoHeight = (img.height / img.width) * logoWidth;
            const logoX = this.pageWidth - this.margin - logoWidth;
            
            this.pdf.addImage(dataURL, 'PNG', logoX, this.margin, logoWidth, logoHeight);
            resolve();
          } catch (error) {
            console.warn('Error processing logo:', error);
            resolve();
          }
        };
        
        img.onerror = () => {
          console.warn('Could not load logo');
          resolve();
        };
        
        img.src = '/YWC.png';
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }
  }

  private addMetadataPage(metadata: FormMetadata, t?: (key: string) => string): void {
    const translate = t || ((key: string) => key);
    
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Your Wealth Coach', this.margin, this.currentY);
    this.currentY += 15;

    // Subtitle
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(translate('forms.pdf.formSubmissionReport') || 'Form Submission Report', this.margin, this.currentY);
    this.currentY += 20;

    // Metadata section
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.pdf.formInformation') || 'Form Information', this.margin, this.currentY);
    this.currentY += 10;

    // Draw separator line
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    // Form details
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    
    const details = [
      [translate('forms.pdf.formName') || 'Form Name:', metadata.formName],
      [translate('forms.pdf.formType') || 'Form Type:', metadata.formType],
      [translate('forms.pdf.version') || 'Version:', metadata.version],
      [translate('forms.pdf.description') || 'Description:', metadata.description],
      [translate('forms.pdf.submissionDate') || 'Submission Date:', metadata.submissionDate],
      [translate('forms.pdf.status') || 'Status:', metadata.status],
      ['', ''],
      [translate('forms.pdf.clientInformation') || 'Client Information', ''],
      [translate('forms.pdf.name') || 'Name:', metadata.clientName],
      [translate('forms.pdf.email') || 'Email:', metadata.clientEmail]
    ];

    details.forEach(([label, value]) => {
      if (label === (translate('forms.pdf.clientInformation') || 'Client Information')) {
        this.currentY += 5;
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(label, this.margin, this.currentY);
        this.currentY += 8;
      } else if (label && value) {
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(label, this.margin, this.currentY);
        this.pdf.setFont('helvetica', 'normal');
        
        // Wrap long text
        const maxWidth = this.pageWidth - this.margin - 50;
        const wrappedText = this.pdf.splitTextToSize(value, maxWidth);
        this.pdf.text(wrappedText, this.margin + 40, this.currentY);
        
        this.currentY += wrappedText.length * this.lineHeight;
      } else if (label === '') {
        this.currentY += 5;
      }
    });
  }

  private addSectionContent(sections: FormSectionData[], t?: (key: string) => string): void {
    const translate = t || ((key: string) => key);
    
    this.pdf.addPage();
    this.currentY = this.margin;

    // Page title
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.pdf.formContent') || 'Form Content', this.margin, this.currentY);
    this.currentY += 15;

    sections.forEach((section, index) => {
      this.addNewPageIfNeeded(30);

      // Section title
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${section.title}`, this.margin, this.currentY);
      this.currentY += 8;

      // Section description
      if (section.description) {
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'italic');
        const wrappedDesc = this.pdf.splitTextToSize(section.description, this.pageWidth - 2 * this.margin);
        this.pdf.text(wrappedDesc, this.margin, this.currentY);
        this.currentY += wrappedDesc.length * 5 + 5;
      }

      // Section fields
      this.pdf.setFontSize(10);
      section.fields.forEach((field) => {
        this.addNewPageIfNeeded(10);

        // Field label
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`${field.label}:`, this.margin + 5, this.currentY);
        
        // Field value
        this.pdf.setFont('helvetica', 'normal');
        let displayValue = this.formatFieldValue(field.value, field.type, translate);
        
        // Handle long values
        const maxWidth = this.pageWidth - this.margin - 60;
        const wrappedValue = this.pdf.splitTextToSize(displayValue, maxWidth);
        this.pdf.text(wrappedValue, this.margin + 50, this.currentY);
        
        this.currentY += Math.max(wrappedValue.length * 5, 7);
      });

      this.currentY += 10; // Space between sections
    });
  }

  private async addSignature(signatureData: string, t?: (key: string) => string): Promise<void> {
    if (!signatureData) return;

    const translate = t || ((key: string) => key);
    
    this.addNewPageIfNeeded(60);
    
    // Signature section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.pdf.digitalSignature') || 'Digital Signature', this.margin, this.currentY);
    this.currentY += 15;

    try {
      // Add signature image
      const signatureWidth = 80;
      const signatureHeight = 40;
      
      this.pdf.addImage(signatureData, 'PNG', this.margin, this.currentY, signatureWidth, signatureHeight);
      this.currentY += signatureHeight + 10;

      // Signature info
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(`${translate('forms.pdf.signedOn') || 'Signed on'}: ${new Date().toLocaleString()}`, this.margin, this.currentY);
    } catch (error) {
      console.warn('Error adding signature to PDF:', error);
      this.pdf.setFontSize(10);
      this.pdf.text(translate('forms.pdf.signatureError') || 'Digital signature was provided but could not be rendered in PDF.', this.margin, this.currentY);
      this.currentY += 10;
    }
  }

  private formatFieldValue(value: any, type: string, t?: (key: string) => string): string {
    const translate = t || ((key: string) => key);
    
    if (value === null || value === undefined || value === '') {
      return translate('forms.pdf.notProvided') || 'Not provided';
    }

    switch (type) {
      case 'checkbox':
        return value ? (translate('forms.pdf.yes') || 'Yes') : (translate('forms.pdf.no') || 'No');
      case 'date':
        if (value) {
          try {
            return new Date(value).toLocaleDateString();
          } catch {
            return value.toString();
          }
        }
        return translate('forms.pdf.notProvided') || 'Not provided';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      default:
        return value.toString();
    }
  }

  private addFooter(): void {
    const pageCount = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Footer line
      this.pdf.setLineWidth(0.3);
      this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        'Your Wealth Coach - Confidential Form Submission',
        this.margin,
        this.pageHeight - 10
      );
      
      // Page number
      this.pdf.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 10
      );
    }
  }

  public async generatePDF(
    metadata: FormMetadata,
    sections: FormSectionData[],
    signatureData?: string,
    t?: (key: string) => string,
    language?: string
  ): Promise<void> {
    try {
      // Add logo first
      await this.addLogo();

      // Add metadata page
      this.addMetadataPage(metadata, t);

      // Add form content
      this.addSectionContent(sections, t);

      // Add signature if provided
      if (signatureData) {
        await this.addSignature(signatureData, t);
      }

      // Add footer to all pages
      const pageCount = (this.pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.pdf.setPage(i);
        this.addFooter();
      }

      // Save the PDF
      const filename = `${metadata.formName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${metadata.submissionDate.replace(/\//g, '-')}.pdf`;
      this.pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  public async generateDualApplicantPDF(
    metadata: FormMetadata,
    sections: FormSectionData[],
    signatures: { applicant1: string; applicant2: string },
    t?: (key: string) => string,
    language?: string,
    formConfig?: any,
    consentData?: Record<string, boolean>
  ): Promise<void> {
    try {
      // Add logo first
      await this.addLogo();

      // Add metadata page
      this.addMetadataPage(metadata, t);

      // Add dual applicant content in table format
      this.addDualApplicantContent(sections, t);

      // Add consent section if provided
      if (formConfig && consentData) {
        this.addDualApplicantConsentSection(formConfig, consentData, t);
      }

      // Add dual signatures if provided
      await this.addDualSignatures(signatures, t);

      // Add footer to all pages
      const pageCount = (this.pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.pdf.setPage(i);
        this.addFooter();
      }

      // Save the PDF
      const filename = `dual_applicant_${metadata.formName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${metadata.submissionDate.replace(/\//g, '-')}.pdf`;
      this.pdf.save(filename);
    } catch (error) {
      console.error('Error generating dual applicant PDF:', error);
      throw error;
    }
  }

  private addDualApplicantContent(sections: FormSectionData[], t?: (key: string) => string): void {
    const translate = t || ((key: string) => key);
    
    this.pdf.addPage();
    this.currentY = this.margin;

    // Page title
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.pdf.formContent') || 'Form Content', this.margin, this.currentY);
    this.currentY += 15;

    // Group sections by type (remove applicant suffixes for table format)
    const groupedSections = this.groupSectionsByType(sections);

    Object.entries(groupedSections).forEach(([sectionType, sectionData]) => {
      this.addNewPageIfNeeded(40);

      // Section title
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(sectionType, this.margin, this.currentY);
      this.currentY += 12;

      // Table headers
      this.addDualApplicantTableHeaders(translate);

      // Table content
      this.addDualApplicantTableContent(sectionData, translate);

      this.currentY += 15; // Space between sections
    });
  }

  private addDualApplicantConsentSection(formConfig: any, consentData: Record<string, boolean>, t?: (key: string) => string): void {
    const translate = t || ((key: string) => key);
    
    if (!formConfig?.consent_forms || formConfig.consent_forms.length === 0 || !consentData) {
      return;
    }

    this.addNewPageIfNeeded(60);

    // Consent section title
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.consent.title') || 'Consent Forms', this.margin, this.currentY);
    this.currentY += 15;

    formConfig.consent_forms.forEach((consentForm: any, index: number) => {
      this.addNewPageIfNeeded(40);

      // Consent form title
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(consentForm.title, this.margin, this.currentY);
      this.currentY += 8;

      // Consent form content (truncated for PDF)
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      const contentLines = consentForm.content.split('\n').slice(0, 10); // First 10 lines only
      contentLines.forEach((line: string) => {
        if (line.trim()) {
          const wrappedLines = this.pdf.splitTextToSize(line.trim(), this.pageWidth - 2 * this.margin);
          wrappedLines.forEach((wrappedLine: string) => {
            this.addNewPageIfNeeded(5);
            this.pdf.text(wrappedLine, this.margin + 5, this.currentY);
            this.currentY += 4;
          });
        }
      });

      if (consentForm.content.split('\n').length > 10) {
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text('... (content truncated for PDF)', this.margin + 5, this.currentY);
        this.currentY += 6;
      }

      // Consent status
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      const consentGiven = consentData[`consent_${index}`] || false;
      const statusText = consentGiven ? 
        (translate('forms.pdf.consentGiven') || '✓ Consent Given') : 
        (translate('forms.pdf.consentNotGiven') || '✗ Consent Not Given');
      
      this.pdf.setTextColor(consentGiven ? 0 : 255, consentGiven ? 128 : 0, 0);
      this.pdf.text(statusText, this.margin + 5, this.currentY);
      this.pdf.setTextColor(0, 0, 0); // Reset color
      this.currentY += 15;
    });
  }

  private groupSectionsByType(sections: FormSectionData[]): Record<string, { applicant1Fields: any[], applicant2Fields: any[] }> {
    const grouped: Record<string, { applicant1Fields: any[], applicant2Fields: any[] }> = {};

    sections.forEach(section => {
      // Extract section type by removing applicant suffix
      const sectionType = section.title.replace(/ - (Applicant [12]|Antragsteller [12]|Solicitante [12]).*$/, '');
      
      if (!grouped[sectionType]) {
        grouped[sectionType] = { applicant1Fields: [], applicant2Fields: [] };
      }

      if (section.title.includes('Applicant 1') || section.title.includes('Antragsteller 1') || section.title.includes('Solicitante 1')) {
        grouped[sectionType].applicant1Fields = section.fields;
      } else if (section.title.includes('Applicant 2') || section.title.includes('Antragsteller 2') || section.title.includes('Solicitante 2')) {
        grouped[sectionType].applicant2Fields = section.fields;
      }
    });

    return grouped;
  }

  private addDualApplicantTableHeaders(translate: (key: string) => string): void {
    const rowHeight = 8;
    const col1Width = 70; // Field label column
    const col2Width = 60; // Applicant 1 column  
    const col3Width = 60; // Applicant 2 column

    // Draw header background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, this.currentY, col1Width + col2Width + col3Width, rowHeight, 'F');

    // Draw header borders
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(this.margin, this.currentY, col1Width, rowHeight);
    this.pdf.rect(this.margin + col1Width, this.currentY, col2Width, rowHeight);
    this.pdf.rect(this.margin + col1Width + col2Width, this.currentY, col3Width, rowHeight);

    // Header text
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);

    // Field label header
    this.pdf.text('Field', this.margin + 2, this.currentY + 5.5);
    
    // Applicant headers
    this.pdf.text(translate('forms.list.applicant1') || 'Applicant 1', this.margin + col1Width + 2, this.currentY + 5.5);
    this.pdf.text(translate('forms.list.applicant2') || 'Applicant 2', this.margin + col1Width + col2Width + 2, this.currentY + 5.5);

    this.currentY += rowHeight;
  }

  private addDualApplicantTableContent(sectionData: { applicant1Fields: any[], applicant2Fields: any[] }, translate: (key: string) => string): void {
    const rowHeight = 8;
    const col1Width = 70;
    const col2Width = 60;
    const col3Width = 60;

    // Get all unique field labels from both applicants
    const allFieldLabels = new Set<string>();
    const fieldDataMap = new Map<string, { applicant1: any, applicant2: any }>();

    // Process applicant 1 fields
    sectionData.applicant1Fields.forEach(field => {
      allFieldLabels.add(field.label);
      fieldDataMap.set(field.label, { 
        applicant1: field, 
        applicant2: fieldDataMap.get(field.label)?.applicant2 
      });
    });

    // Process applicant 2 fields
    sectionData.applicant2Fields.forEach(field => {
      allFieldLabels.add(field.label);
      const existing = fieldDataMap.get(field.label);
      fieldDataMap.set(field.label, { 
        applicant1: existing?.applicant1, 
        applicant2: field 
      });
    });

    // Create table rows
    Array.from(allFieldLabels).forEach((fieldLabel, index) => {
      this.addNewPageIfNeeded(rowHeight + 2);

      const fieldData = fieldDataMap.get(fieldLabel);
      const isEvenRow = index % 2 === 0;

      // Alternate row background
      if (isEvenRow) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(this.margin, this.currentY, col1Width + col2Width + col3Width, rowHeight, 'F');
      }

      // Draw cell borders
      this.pdf.setLineWidth(0.2);
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin, this.currentY, col1Width, rowHeight);
      this.pdf.rect(this.margin + col1Width, this.currentY, col2Width, rowHeight);
      this.pdf.rect(this.margin + col1Width + col2Width, this.currentY, col3Width, rowHeight);

      // Cell content
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);

      // Field label (bold)
      this.pdf.setFont('helvetica', 'bold');
      const labelText = this.pdf.splitTextToSize(fieldLabel, col1Width - 4);
      this.pdf.text(labelText[0], this.margin + 2, this.currentY + 5.5);

      // Applicant 1 value
      this.pdf.setFont('helvetica', 'normal');
      const app1Value = fieldData?.applicant1 ? 
        this.formatFieldValue(fieldData.applicant1.value, fieldData.applicant1.type, translate) : 
        (translate('forms.pdf.notProvided') || 'Not provided');
      const app1Text = this.pdf.splitTextToSize(app1Value, col2Width - 4);
      this.pdf.text(app1Text[0], this.margin + col1Width + 2, this.currentY + 5.5);

      // Applicant 2 value  
      const app2Value = fieldData?.applicant2 ? 
        this.formatFieldValue(fieldData.applicant2.value, fieldData.applicant2.type, translate) : 
        (translate('forms.pdf.notProvided') || 'Not provided');
      const app2Text = this.pdf.splitTextToSize(app2Value, col3Width - 4);
      this.pdf.text(app2Text[0], this.margin + col1Width + col2Width + 2, this.currentY + 5.5);

      this.currentY += rowHeight;
    });
  }

  private async addDualSignatures(signatures: { applicant1: string; applicant2: string }, t?: (key: string) => string): Promise<void> {
    const translate = t || ((key: string) => key);
    
    if (!signatures.applicant1 && !signatures.applicant2) return;

    this.pdf.addPage();
    this.currentY = this.margin;

    // Signatures section title
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(translate('forms.dynamic.signatures') || 'Digital Signatures', this.margin, this.currentY);
    this.currentY += 15;

    const pageCenter = this.pageWidth / 2;
    const signatureWidth = (this.pageWidth - 3 * this.margin) / 2;
    const signatureHeight = 40;

    // Applicant 1 Signature
    if (signatures.applicant1) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(translate('forms.list.applicant1') || 'Applicant 1', this.margin, this.currentY);
      this.currentY += 8;

      try {
        this.pdf.addImage(
          signatures.applicant1,
          'PNG',
          this.margin,
          this.currentY,
          signatureWidth,
          signatureHeight
        );
      } catch (error) {
        console.warn('Error adding applicant 1 signature to PDF:', error);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text(translate('forms.pdf.signatureError') || 'Digital signature was provided but could not be rendered in PDF.', this.margin, this.currentY + 10);
      }

      // Signature date
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        `${translate('forms.pdf.signedOn') || 'Signed on'} ${new Date().toLocaleDateString()}`,
        this.margin,
        this.currentY + signatureHeight + 5
      );
    }

    // Applicant 2 Signature
    if (signatures.applicant2) {
      const applicant2X = pageCenter + this.margin / 2;
      
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(translate('forms.list.applicant2') || 'Applicant 2', applicant2X, this.currentY);

      try {
        this.pdf.addImage(
          signatures.applicant2,
          'PNG',
          applicant2X,
          this.currentY + 8,
          signatureWidth,
          signatureHeight
        );
      } catch (error) {
        console.warn('Error adding applicant 2 signature to PDF:', error);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text(translate('forms.pdf.signatureError') || 'Digital signature was provided but could not be rendered in PDF.', applicant2X, this.currentY + 18);
      }

      // Signature date
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        `${translate('forms.pdf.signedOn') || 'Signed on'} ${new Date().toLocaleDateString()}`,
        applicant2X,
        this.currentY + signatureHeight + 13
      );
    }

    this.currentY += signatureHeight + 20;
  }
}

// Helper function to extract form data into structured format
export function extractFormSections(
  formConfig: any,
  formData: Record<string, any>,
  t: (key: string) => string
): FormSectionData[] {
  const sections: FormSectionData[] = [];

  // Check if this is dual applicant data
  const isDualApplicant = formData.applicant1 || formData.applicant2;

  if (formConfig?.sections) {
    formConfig.sections
      .sort((a: any, b: any) => a.order - b.order)
      .forEach((section: any) => {
        if (isDualApplicant) {
          // Handle dual applicant structure
          const applicant1Data = formData.applicant1 || {};
          const applicant2Data = formData.applicant2 || {};
          
          // Create sections for both applicants
          if (Object.keys(applicant1Data).length > 0) {
            const fields1: Array<{ label: string; value: any; type: string }> = [];
            
            if (section.fields && section.fields.length > 0) {
              section.fields.forEach((field: any) => {
                fields1.push({
                  label: formatFieldLabel(field.name, t) || field.label || field.name,
                  value: applicant1Data[field.name],
                  type: field.type || 'text'
                });
              });
            } else {
              Object.entries(applicant1Data).forEach(([key, value]) => {
                fields1.push({
                  label: formatFieldLabel(key, t),
                  value: value,
                  type: guessFieldType(key, value)
                });
              });
            }
            
            if (fields1.length > 0) {
              sections.push({
                title: `${section.title} - ${t('forms.list.applicant1') || 'Applicant 1'}`,
                description: section.description,
                fields: fields1
              });
            }
          }
          
          if (Object.keys(applicant2Data).length > 0) {
            const fields2: Array<{ label: string; value: any; type: string }> = [];
            
            if (section.fields && section.fields.length > 0) {
              section.fields.forEach((field: any) => {
                fields2.push({
                  label: formatFieldLabel(field.name, t) || field.label || field.name,
                  value: applicant2Data[field.name],
                  type: field.type || 'text'
                });
              });
            } else {
              Object.entries(applicant2Data).forEach(([key, value]) => {
                fields2.push({
                  label: formatFieldLabel(key, t),
                  value: value,
                  type: guessFieldType(key, value)
                });
              });
            }
            
            if (fields2.length > 0) {
              sections.push({
                title: `${section.title} - ${t('forms.list.applicant2') || 'Applicant 2'}`,
                description: section.description,
                fields: fields2
              });
            }
          }
        } else {
          // Handle single applicant structure (original logic)
          const sectionData = formData[section.id] || {};
          const fields: Array<{ label: string; value: any; type: string }> = [];

          console.log(`🔍 Processing section: ${section.title}, has fields: ${!!(section.fields && section.fields.length > 0)}`);

          // Process section fields
          if (section.fields && section.fields.length > 0) {
            console.log(`🔍 Using defined fields for section: ${section.title}`);
            section.fields.forEach((field: any) => {
              fields.push({
                label: formatFieldLabel(field.name, t) || field.label || field.name,
                value: sectionData[field.name],
                type: field.type || 'text'
              });
            });
          } else {
            console.log(`🔍 Using hardcoded fields for section: ${section.title}`);
            // Handle hardcoded sections (personal, family, etc.)
            Object.entries(sectionData).forEach(([key, value]) => {
              fields.push({
                label: formatFieldLabel(key, t),
                value: value,
                type: guessFieldType(key, value)
              });
            });
          }

          if (fields.length > 0) {
            sections.push({
              title: section.title,
              description: section.description,
              fields: fields
            });
          }
        }
      });
  }

  return sections;
}

function formatFieldLabel(key: string, t: (key: string) => string): string {
  // Map common field names to translated labels
  const labelMap: Record<string, string> = {
    // Personal Details
    coach_id: t('forms.personalDetails.assignedCoach'),
    applicant_type: t('forms.personalDetails.applicantType'),
    first_name: t('forms.personalDetails.firstName'),
    last_name: t('forms.personalDetails.lastName'),
    email: t('forms.personalDetails.email'),
    phone: t('forms.personalDetails.phone'),
    whatsapp: t('forms.personalDetails.whatsapp'),
    street: t('forms.personalDetails.street'),
    house_number: t('forms.personalDetails.houseNumber'),
    postal_code: t('forms.personalDetails.postalCode'),
    city: t('forms.personalDetails.city'),
    birth_date: t('forms.personalDetails.dateOfBirth'),
    birth_place: t('forms.personalDetails.placeOfBirth'),
    nationality: t('forms.personalDetails.nationality'),
    marital_status: t('forms.personalDetails.maritalStatus'),
    housing: t('forms.personalDetails.housingSituation'),
    eu_citizen: t('forms.personalDetails.euCitizen'),
    salutation: t('forms.personalDetails.salutation'),
    tax_id: t('forms.personalDetails.taxId'),
    iban: t('forms.personalDetails.iban'),
    residence_permit: t('forms.personalDetails.residencePermit'),
    
    // Income Details
    gross_income: t('forms.income.grossIncome'),
    net_income: t('forms.income.netIncome'),
    tax_class: t('forms.income.taxClass'),
    number_of_salaries: t('forms.income.numberOfSalaries'),
    child_benefit: t('forms.income.childBenefit'),
    other_income: t('forms.income.otherIncome'),
    
    // Employment Details
    occupation: t('forms.employment.occupation'),
    contract_type: t('forms.employment.contractType'),
    employer_name: t('forms.employment.employerName'),
    employed_since: t('forms.employment.employedSince'),
    contract_duration: t('forms.employment.contractDuration'),
    
    // Expenses
    cold_rent: t('forms.expenses.coldRent'),
    electricity: t('forms.expenses.electricity'),
    living_expenses: t('forms.expenses.livingExpenses'),
    other_expenses: t('forms.expenses.otherExpenses'),
    gas: t('forms.expenses.gas'),
    telecommunication: t('forms.expenses.telecommunication'),
    
    // Assets
    real_estate: t('forms.assets.realEstate'),
    securities: t('forms.assets.securities'),
    bank_deposits: t('forms.assets.bankDeposits'),
    building_savings: t('forms.assets.buildingSavings'),
    insurance_values: t('forms.assets.insuranceValues'),
    other_assets: t('forms.assets.otherAssets'),
    
    // Liabilities
    loan_type: t('forms.liabilities.loanType'),
    loan_bank: t('forms.liabilities.loanBank'),
    loan_amount: t('forms.liabilities.loanAmount'),
    loan_monthly_rate: t('forms.liabilities.loanMonthlyRate'),
    loan_interest: t('forms.liabilities.loanInterest'),
    
    // Family Details
    relation: t('forms.familyDetails.relation'),
  };

  const translated = labelMap[key];
  
  // Debug logging to see what's happening
  console.log(`🔍 Field label translation: ${key} -> ${translated || 'NOT FOUND'}`);
  
  if (translated && translated !== key && translated.trim() !== '') {
    console.log(`🔍 Using translation for ${key}: ${translated}`);
    return translated;
  }
  
  // Fallback: format the key nicely
  const fallback = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  console.log(`🔍 Using fallback for ${key}: ${fallback}`);
  return fallback;
}

function guessFieldType(key: string, value: any): string {
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (key.includes('date') || key.includes('_at')) return 'date';
  if (key.includes('email')) return 'email';
  return 'text';
} 