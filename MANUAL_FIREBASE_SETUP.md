# Manual Firebase Setup Guide

Since Google Cloud SDK is not installed, you need to manually configure Firebase in the Firebase Console.

## 🚨 **CRITICAL: These steps MUST be completed for uploads to work**

### **Step 1: Update Firebase Storage Rules**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ywc-storage**
3. Go to **Storage** in the left sidebar
4. Click **Rules** tab
5. **Replace all content** with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **Publish**
7. Wait for "Rules published successfully" message

### **Step 2: Enable Anonymous Authentication (Optional but Recommended)**

1. In the same Firebase project, go to **Authentication**
2. Click **Sign-in method** tab
3. Find **Anonymous** and click on it
4. Toggle **Enable** to ON
5. Click **Save**

### **Step 3: Verify Project Settings**

Make sure your Firebase project has these settings:

- **Project ID**: `ywc-storage`
- **Storage Bucket**: `ywc-storage.firebasestorage.app`
- **Region**: Choose the closest region to your users

### **Step 4: Create .env File**

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=AIzaSyDlYMYl0llL-mSF7yDo21sQP2tF4X9xol4
VITE_FIREBASE_AUTH_DOMAIN=ywc-storage.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ywc-storage
VITE_FIREBASE_STORAGE_BUCKET=ywc-storage.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=685075746401
VITE_FIREBASE_APP_ID=1:685075746401:web:bc281fa4ba9233d0eee420
VITE_NODE_ENV=development
```

### **Step 5: Restart Development Server**

After making these changes:

1. Stop your development server (Ctrl+C)
2. Restart with: `npm run dev`
3. Clear browser cache (Ctrl+F5)

## 🔍 **Verification Steps**

After completing the setup:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try uploading a file
4. You should see:
   - ✅ "Development mode: Skipping Firebase authentication"
   - ✅ "Simple upload to Firebase Storage path: coaches/..."
   - ✅ "Document uploaded successfully (simple): ..."

## ❌ **If Still Getting CORS Errors**

1. **Double-check Firebase Storage Rules** are published
2. **Wait 5-10 minutes** for changes to propagate globally
3. **Clear browser cache completely**
4. **Try incognito/private browsing mode**
5. **Check the exact error message** in Network tab

## 🔧 **Alternative: Install Google Cloud SDK**

If you want to use automated CORS setup:

1. Download: https://cloud.google.com/sdk/docs/install
2. Install and restart terminal
3. Run: `gcloud auth login`
4. Run: `gcloud config set project ywc-storage`
5. Run: `gsutil cors set firebase-cors.json gs://ywc-storage.firebasestorage.app`

## 📞 **Getting Help**

If uploads still don't work after following these steps:

1. Check Firebase Console > Storage > Files to see if any files appear
2. Check Network tab in browser dev tools for specific error codes
3. Verify the Storage Rules are exactly as shown above
4. Make sure the project ID matches exactly: `ywc-storage` 