# SignaturePad Component

A React component for capturing digital signatures using canvas. Built with `react-signature-canvas` and designed to work seamlessly with forms.

## Installation

The required dependency has already been added to the project:

```bash
npm install react-signature-canvas
npm install --save-dev @types/react-signature-canvas
```

## Basic Usage

### Import the Component

```tsx
import { SignaturePad } from '../../components/util';
// or
import SignaturePad from '../../components/util/SignaturePad';
```

### Simple Example

```tsx
import React, { useState } from 'react';
import { SignaturePad } from '../../components/util';

function MyForm() {
  const [signature, setSignature] = useState<string>('');

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    // signatureData is a base64 encoded PNG image
    console.log('Signature saved:', signatureData);
  };

  return (
    <form>
      <div>
        <label>Please provide your signature:</label>
        <SignaturePad 
          onSave={handleSignatureSave}
          initialValue={signature}
        />
      </div>
    </form>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSave` | `(signatureData: string) => void` | Yes | Callback function called when signature is saved. Receives base64 PNG data URL |
| `initialValue` | `string` | No | Initial signature data (base64 PNG) to display when component loads |
| `className` | `string` | No | Additional CSS classes to apply to the container |

## Features

### ✅ **Signature Capture**
- Draw signatures using mouse, touch, or stylus
- High-quality canvas rendering
- Black pen color with smooth drawing

### ✅ **Save & Clear Functions**
- Save signature as base64 PNG data URL
- Clear canvas to start over
- Validation prevents saving empty signatures

### ✅ **State Management**
- Tracks drawing state (signed/not signed)
- Tracks save state (saved/not saved)
- Prevents duplicate saves of same signature

### ✅ **Loading Initial Values**
- Support for pre-loading existing signatures
- Proper handling of image scaling and positioning
- One-time initialization to prevent overwrites

### ✅ **Responsive Design**
- Full width responsive canvas
- Fixed height (11rem/176px)
- Dark mode support
- Consistent styling with form components

### ✅ **Multilingual Support**
- German/English button labels
- Localized user feedback messages

## Advanced Usage

### Form Integration with Validation

```tsx
import React, { useState } from 'react';
import { SignaturePad } from '../../components/util';

interface FormData {
  name: string;
  email: string;
  signature: string;
}

function ContractForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    signature: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleSignatureSave = (signatureData: string) => {
    setFormData(prev => ({
      ...prev,
      signature: signatureData
    }));
    // Clear signature error when signature is provided
    if (errors.signature) {
      setErrors(prev => ({ ...prev, signature: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.signature) newErrors.signature = 'Signature is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    console.log('Form submitted:', {
      ...formData,
      signatureLength: formData.signature.length
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <label>Signature * / Unterschrift *</label>
        <SignaturePad 
          onSave={handleSignatureSave}
          initialValue={formData.signature}
        />
        {errors.signature && <span className="error">{errors.signature}</span>}
      </div>

      <button type="submit">Submit Contract</button>
    </form>
  );
}
```

### Dynamic Forms Integration

To use with dynamic forms, you can manually add signature fields:

```tsx
// In your form renderer function
function renderSignatureField(formData: any, onChange: (name: string, value: any) => void) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        Signature / Unterschrift <span className="text-red-500">*</span>
      </label>
      <SignaturePad
        onSave={(signature) => onChange('client_signature', signature)}
        initialValue={formData.client_signature || ''}
      />
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS classes and supports dark mode. The default styling includes:

- White canvas background (always white, even in dark mode)
- Responsive full-width design
- 11rem fixed height
- Rounded borders matching form inputs
- Hover and focus states for buttons

### Custom Styling

```tsx
<SignaturePad 
  onSave={handleSave}
  className="my-custom-signature-pad border-2 border-blue-500"
/>
```

## Data Format

The signature is saved as a **base64-encoded PNG data URL**:

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD...
```

This format can be:
- Stored directly in databases
- Sent to APIs
- Displayed in `<img>` tags
- Converted to files for download

### Converting to File

```tsx
const dataURLToFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Usage
const signatureFile = dataURLToFile(signature, 'signature.png');
```

## Troubleshooting

### Canvas Not Responsive
The canvas automatically adjusts to container width. Ensure the parent container has proper width constraints.

### Signature Quality Issues
The component uses high DPI settings for crisp signatures. If quality issues persist, check:
- Canvas size settings
- Device pixel ratio
- Image compression when saving

### Touch Devices
The component works with touch devices out of the box. For better mobile experience, consider:
- Adequate canvas size
- Proper viewport settings
- Touch-friendly button sizes

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Example Page

See `SignaturePadExample.tsx` for a complete working example with form integration and debug information. 