# Environment Variables Setup

## Create .env File

Create a `.env` file in your project root directory with the following content:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDlYMYl0llL-mSF7yDo21sQP2tF4X9xol4
VITE_FIREBASE_AUTH_DOMAIN=ywc-storage.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ywc-storage
VITE_FIREBASE_STORAGE_BUCKET=ywc-storage.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=685075746401
VITE_FIREBASE_APP_ID=1:685075746401:web:bc281fa4ba9233d0eee420

# Development Environment
VITE_NODE_ENV=development
```

## Important Notes

1. **File Location**: The `.env` file should be in the same directory as your `package.json`
2. **Git Ignore**: The `.env` file should be in your `.gitignore` to avoid committing sensitive data
3. **Vite Prefix**: Environment variables must start with `VITE_` to be accessible in the browser
4. **Restart**: After creating/modifying `.env`, restart your development server

## Verification

To verify your environment variables are loaded:

1. Check browser console for: "Development mode: Skipping Firebase authentication"
2. Ensure no "configuration-not-found" errors
3. File uploads should work without authentication errors

## Production Setup

For production deployment:

1. Set environment variables in your hosting platform
2. Enable Firebase Authentication
3. Update Firebase Storage Rules to require authentication
4. Remove `VITE_NODE_ENV=development` or set to `production` 