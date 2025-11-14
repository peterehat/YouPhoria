# Fix Google OAuth "redirect_uri_mismatch" Error

## Problem
You're seeing this error when trying to sign in with Google:
```
Error 400: redirect_uri_mismatch
Access blocked: youphoria's request is invalid
```

## Root Cause
The redirect URL that your app sends to Google doesn't match the URLs configured in your Supabase project's Google OAuth settings.

## Solution

### Step 1: Configure Supabase Redirect URLs

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou

2. **Navigate to Authentication → URL Configuration**
   - Click "Authentication" in the left sidebar
   - Click "URL Configuration" tab

3. **Add Redirect URLs**
   In the "Redirect URLs" section, add these URLs (one per line):
   
   ```
   youi://auth
   exp://127.0.0.1:8081
   exp://localhost:8081
   https://auth.expo.io/@peterehat/youphoria
   ```

   **Explanation:**
   - `youi://auth` - For production/standalone builds
   - `exp://127.0.0.1:8081` - For Expo Go development (iOS Simulator)
   - `exp://localhost:8081` - For Expo Go development (alternative)
   - `https://auth.expo.io/@peterehat/youphoria` - For Expo's OAuth proxy

4. **Click "Save"**

### Step 2: Verify Google OAuth Provider

1. **Go to Authentication → Providers**
   - Still in the Supabase Dashboard

2. **Find "Google" provider**
   - Make sure it's **enabled** (toggle should be ON)

3. **Verify credentials are configured**
   - You should see:
     - Client ID (from Google Cloud Console)
     - Client Secret (from Google Cloud Console)
   
4. **If not configured, you need to:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     ```
     https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
     ```
   - Copy the Client ID and Client Secret to Supabase

### Step 3: Test the Fix

1. **Restart your app** (if it's running)
   ```bash
   cd reactapp
   # Stop the current process (Ctrl+C)
   npx expo start
   ```

2. **Try Google Sign In again**
   - The app will now log the redirect URL to the console
   - Check the console to see what URL is being used
   - Make sure that URL is in your Supabase Redirect URLs list

3. **Check the console logs**
   You should see:
   ```
   Auth redirectUrl (Google): youi://auth
   Environment: { isExpoGo: false, appOwnership: 'standalone' }
   ```
   Or for Expo Go:
   ```
   Auth redirectUrl (Google): https://auth.expo.io/@peterehat/youphoria
   Environment: { isExpoGo: true, appOwnership: 'expo' }
   ```

## Common Issues

### Issue 1: Still getting redirect_uri_mismatch
**Solution:** 
- Check the console logs to see the exact redirect URL being used
- Make sure that EXACT URL is added to Supabase Redirect URLs
- Wait a few minutes after saving (Supabase may cache settings)

### Issue 2: Different redirect URL in production vs development
**Solution:**
- Make sure ALL possible redirect URLs are added to Supabase
- The app automatically detects the environment and uses the correct URL

### Issue 3: Google Cloud Console also needs configuration
**Solution:**
- In Google Cloud Console, add this redirect URI:
  ```
  https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
  ```
- This is the URL Google redirects to (Supabase), not your app

## Code Changes Made

Updated `reactapp/store/authStore.js`:
- Improved redirect URL generation for both Google and Apple sign-in
- Added better logging to debug redirect URL issues
- Ensured correct URL format for both Expo Go and standalone builds

## Testing Checklist

- [ ] Added all redirect URLs to Supabase
- [ ] Google OAuth provider is enabled in Supabase
- [ ] Google Cloud Console has Supabase callback URL configured
- [ ] Restarted the app
- [ ] Checked console logs for redirect URL
- [ ] Tested Google sign-in
- [ ] Tested Apple sign-in (if configured)

## Need More Help?

If you're still having issues:
1. Check the console logs and share the exact redirect URL being generated
2. Verify the URL is in your Supabase Redirect URLs list
3. Try clearing the app cache and restarting
4. Check Supabase logs in the Dashboard → Logs section



