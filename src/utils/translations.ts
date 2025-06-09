// Translation utility for PDF export
import enTranslations from '../languages/en.json';
import deTranslations from '../languages/de.json';
import esTranslations from '../languages/es.json';

type TranslationObject = Record<string, any>;

const translations: Record<string, TranslationObject> = {
  'en': enTranslations,
  'de': deTranslations,
  'es': esTranslations
};

export function getTranslation(language: string, key: string): string {
  const langTranslations = translations[language] || translations['en'];
  
  // Debug: show what translations are loaded for the language
  if (key.startsWith('forms.pdf.') && key === 'forms.pdf.formSubmissionReport') {
    console.log(`🔍 Available translations for ${language}:`, Object.keys(langTranslations));
    console.log(`🔍 PDF section exists:`, !!langTranslations.forms?.pdf);
    console.log(`🔍 PDF section content:`, langTranslations.forms?.pdf);
  }
  
  const keys = key.split('.');
  let value: any = langTranslations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined || value === null) {
      // Fallback to English if key not found in selected language
      if (language !== 'en') {
        return getTranslation('en', key);
      }
      console.warn(`Translation key not found: ${key} for language: ${language}`);
      return key;
    }
  }
  
  const result = typeof value === 'string' ? value : key;
  // Debug log for PDF keys
  if (key.startsWith('forms.pdf.')) {
    console.log(`PDF Translation [${language}]: ${key} -> ${result}`);
  }
  return result;
}

export function createTranslationFunction(language: string) {
  return (key: string): string => getTranslation(language, key);
} 