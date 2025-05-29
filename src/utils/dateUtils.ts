// Date utility functions for form handling

/**
 * Converts an ISO date string to YYYY-MM-DD format for HTML date inputs
 * @param isoDate - Date string in ISO format (e.g., "2009-02-09T23:00:00.000Z")
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const formatDateForInput = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DD for HTML date input
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Converts a date from HTML date input (YYYY-MM-DD) to ISO string format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns ISO date string or the original string if conversion fails
 */
export const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // If it's already in ISO format, return as is
    if (dateString.includes('T')) return dateString;
    
    // Convert YYYY-MM-DD to ISO format
    const date = new Date(dateString + 'T12:00:00.000Z'); // Add time to avoid timezone issues
    if (isNaN(date.getTime())) return dateString;
    
    return date.toISOString();
  } catch (error) {
    console.warn('Error formatting date for API:', error);
    return dateString;
  }
};

/**
 * Formats a date for display in readable format
 * @param isoDate - Date string in ISO format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (isoDate: string | null | undefined, locale: string = 'en-US'): string => {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date for display:', error);
    return '';
  }
}; 