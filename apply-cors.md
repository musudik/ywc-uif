# Apply CORS Configuration to Firebase Storage

If you continue to have CORS issues after enabling authentication, you may need to apply CORS configuration using Google Cloud SDK.

## Prerequisites
1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project ywc-storage`

## Apply CORS Configuration

Run this command in your terminal:

```bash
gsutil cors set firebase-cors.json gs://ywc-storage.firebasestorage.app
```

## Verify CORS Configuration

Check if CORS is applied:

```bash
gsutil cors get gs://ywc-storage.firebasestorage.app
```

## Alternative: Wait for Propagation

Sometimes Firebase Storage CORS issues resolve themselves after:
1. Enabling Anonymous Authentication
2. Updating Storage Rules
3. Waiting 5-10 minutes for changes to propagate

## Troubleshooting

If issues persist:
1. Check Firebase Storage Rules are published
2. Verify Anonymous Authentication is enabled
3. Clear browser cache and cookies
4. Try in incognito/private browsing mode
5. Check browser dev tools for specific error messages 