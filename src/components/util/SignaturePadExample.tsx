import React, { useState } from 'react';
import { SignaturePad } from './SignaturePad';

/**
 * Example of how to use the SignaturePad component in forms
 * 
 * To use in your forms:
 * 1. Import: import { SignaturePad } from '../../components/util';
 * 2. Add to your form state: const [signature, setSignature] = useState('');
 * 3. Use the component: <SignaturePad onSave={setSignature} initialValue={signature} />
 */

export const SignaturePadExample: React.FC = () => {
  const [signature, setSignature] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    signature: ''
  });

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setFormData(prev => ({
      ...prev,
      signature: signatureData
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.signature) {
      alert('Please provide your signature before submitting.');
      return;
    }

    console.log('Form submitted with data:', {
      ...formData,
      signatureLength: formData.signature.length
    });
    
    // Here you would typically send the data to your API
    alert('Form submitted successfully!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        SignaturePad Component Example
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Signature * / Unterschrift *
          </label>
          <SignaturePad 
            onSave={handleSignatureSave}
            initialValue={signature}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({ name: '', email: '', signature: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit Form
          </button>
        </div>
      </form>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Form Data (Debug):
        </h3>
        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
          {JSON.stringify(
            {
              ...formData,
              signature: formData.signature ? `[${formData.signature.length} chars]` : 'empty'
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default SignaturePadExample; 