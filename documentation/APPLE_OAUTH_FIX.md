# Fix Apple Sign-In "Invalid client id or web redirect url" Error

## Problem
You're seeing this error when trying to sign in with Apple:
```
invalid_request
Invalid client id or web redirect url
```

## Root Cause
The error indicates that either:
1. The Apple **Client ID** is not configured correctly in Supabase
2. The **Redirect URL** is not configured correctly in Apple Developer Console
3. The redirect URL format doesn't match what Apple expects

## Solution

### Step 1: Configure Apple Sign-In in Apple Developer Console

1. **Go to Apple Developer Console**
   - Visit: https://developer.apple.com/account/resources/identifiers/list
   - Sign in with your Apple Developer account

2. **Create or Find Your Services ID**
   - Click the **"+"** button to create a new identifier
   - Select **"Services IDs"** and click Continue
   - Register a new Services ID:
     - **Description**: "YouPhoria Wellness" (or your app name)
     - **Identifier**: `com.youi.app.signin` (or similar)
   - Click Continue and Register

3. **Configure the Services ID for Sign in with Apple**
   - Click on your newly created Services ID
   - Check the **"Sign in with Apple"** checkbox
   - Click **"Configure"**
   
4. **Add Redirect URLs**
   In the "Redirect URLs" section, add:
   
   ```
   https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
   ```
   
   **Important:** This is the Supabase callback URL, not your app's deep link URL!
   
   - Click **"Save"**
   - Click **"Continue"**
   - Click **"Register"**

5. **Note Your Services ID**
   - Copy the **Services ID** (e.g., `com.youi.app.signin`)
   - This is your **Client ID** for Supabase

### Step 2: Configure Supabase with Apple Credentials

1. **Get Your Apple Key**
   - In Apple Developer Console, go to **"Certificates, Identifiers & Profiles"**
   - Click **"Keys"** in the left sidebar
   - Click the **"+"** button to create a new key
   - Give it a name: "YouPhoria Sign in with Apple"
   - Check **"Sign in with Apple"** checkbox
   - Click **"Continue"** and **"Register"**
   - **IMPORTANT:** Download the `.p8` key file (you can only download it once!)
   - Note the **Key ID** (shown after creation)

2. **Configure Supabase**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou
   - Navigate to **Authentication** → **Providers**
   - Find **"Apple"** provider
   - Enable it (toggle ON)
   - Fill in the following:
     - **Services ID (Client ID)**: Your Services ID from Step 1.5 (e.g., `com.youi.app.signin`)
     - **Secret Key**: The contents of your `.p8` key file (download it from Apple Developer Console)
     - **Key ID**: The Key ID from Step 2.1
     - **Team ID**: Your Apple Team ID (found in your Apple Developer account)
   - Click **"Save"**

### Step 3: Verify Supabase Redirect URLs

1. **Go to Supabase Dashboard**
   - Navigate to **Authentication** → **URL Configuration**
   - Make sure these redirect URLs are in the list:
     ```
     youi://auth
     exp://127.0.0.1:8081
     exp://localhost:8081
     https://auth.expo.io/@peterehat/youphoria
     ```
   - These are where Supabase redirects your app after authentication

### Step 4: Test with Enhanced Logging

1. **Restart your app** to load the new logging code
2. **Try Apple Sign-In again**
3. **Check the console logs** - you should now see detailed debug information:
   ```
   === APPLE OAUTH DEBUG START ===
   Auth redirectUrl (Apple): youi://auth
   Environment: { ... }
   Supabase URL: ...
   Starting Apple OAuth with redirectUrl: ...
   OAuth response data: ...
   Full OAuth URL: ...
   ```

4. **Look for these key pieces of information:**
   - The redirect URL being used
   - The full OAuth URL from Supabase
   - Any error messages from Supabase
   - The callback URL from Apple

## Common Issues

### Issue 1: "Invalid client id"
**Solution:** 
- Make sure the Services ID in Supabase matches exactly what's in Apple Developer Console
- Check that the Services ID has "Sign in with Apple" enabled
- Verify the Services ID is configured with the Supabase callback URL

### Issue 2: "Invalid web redirect url"
**Solution:**
- The redirect URL in Apple Developer Console must be: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- This is NOT your app's deep link URL (`youi://auth`)
- Apple redirects to Supabase first, then Supabase redirects to your app

### Issue 3: "Key file not found" or secret key issues
**Solution:**
- Make sure you downloaded the `.p8` key file from Apple Developer Console
- Copy the entire contents of the `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- Paste it into the "Secret Key" field in Supabase

### Issue 4: Team ID incorrect
**Solution:**
- Find your Team ID in Apple Developer Console (top right corner)
- It's a 10-character alphanumeric string (e.g., `RX9FNDKHNY`)
- Make sure it matches exactly in Supabase

## Debugging Checklist

After trying Apple Sign-In, check the logs for:

- [ ] `=== APPLE OAUTH DEBUG START ===` appears
- [ ] Redirect URL is logged: `youi://auth` (or similar)
- [ ] Supabase OAuth URL is generated successfully
- [ ] No errors from Supabase before opening Apple's auth page
- [ ] Apple auth page loads (or shows specific error)
- [ ] Callback URL is received after authentication
- [ ] Session is created successfully

## Important Notes

1. **Two Different Redirect URLs:**
   - **Apple → Supabase**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback` (configured in Apple Developer Console)
   - **Supabase → Your App**: `youi://auth` (configured in Supabase Dashboard)

2. **Apple Sign-In Flow:**
   ```
   Your App → Supabase → Apple → Supabase → Your App
   ```

3. **Services ID vs App ID:**
   - For Sign in with Apple, you need a **Services ID**, not an App ID
   - The Services ID is your Client ID for Supabase

4. **Testing:**
   - Apple Sign-In may not work in iOS Simulator
   - You may need to test on a real device
   - Make sure you're signed in to iCloud on the device

## Need More Help?

If you're still having issues after checking the logs:

1. **Share the console logs** from the `=== APPLE OAUTH DEBUG START ===` section
2. **Verify all configurations** match the steps above
3. **Check Supabase Dashboard** → **Logs** for any server-side errors
4. **Verify your Apple Developer account** has Sign in with Apple enabled



