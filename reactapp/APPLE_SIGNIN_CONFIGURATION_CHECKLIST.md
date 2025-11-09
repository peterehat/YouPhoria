# Apple Sign-In Configuration Checklist

## Current Error
```
invalid_request
Invalid client id or web redirect url
```

## What This Means
Apple is rejecting the OAuth request because:
1. ❌ Apple provider is not configured in Supabase, OR
2. ❌ Services ID (Client ID) is missing/incorrect, OR
3. ❌ Redirect URL is not in Apple Developer Console

## Step-by-Step Fix

### ✅ Step 1: Check Supabase Apple Provider Status

**Go to:** https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers

**Look for the Apple provider and check:**
- [ ] Is the Apple provider **enabled** (toggle is ON)?
- [ ] Is the **Services ID (Client ID)** field filled in?
- [ ] Is the **Secret Key** field filled in?
- [ ] Is the **Key ID** field filled in?
- [ ] Is the **Team ID** field filled in?

**If ANY field is empty, Apple Sign-In will NOT work.**

---

### ✅ Step 2: Create Services ID in Apple Developer Console

**Only do this if you haven't created one yet.**

1. **Go to:** https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click the **"+"** button
3. Select **"Services IDs"**
4. Fill in:
   - **Description**: "YouPhoria Wellness"
   - **Identifier**: `com.youi.app.signin` (or similar - this is your Client ID)
5. Click **"Continue"** and **"Register"**

**Save this Services ID - you'll need it for Supabase!**

---

### ✅ Step 3: Configure Services ID with Redirect URL

**This is critical - Apple must know where to redirect after authentication.**

1. **Go to:** https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click on your Services ID (e.g., `com.youi.app.signin`)
3. Check the **"Sign in with Apple"** checkbox
4. Click **"Configure"** next to "Sign in with Apple"
5. In the "Redirect URLs" section, add:
   ```
   https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
   ```
6. Click **"Save"**
7. Click **"Continue"**
8. Click **"Register"**

**This MUST be the Supabase callback URL, not your app's deep link!**

---

### ✅ Step 4: Create Signing Key (.p8 file)

**Only do this if you haven't created a key yet.**

1. **Go to:** https://developer.apple.com/account/resources/authkeys/list
2. Click the **"+"** button
3. Fill in:
   - **Name**: "YouPhoria Sign in with Apple"
4. Check **"Sign in with Apple"**
5. Click **"Configure"** next to "Sign in with Apple"
6. Select your App ID from the dropdown
7. Click **"Save"**
8. Click **"Continue"**
9. Click **"Register"**
10. **IMPORTANT:** Click **"Download"** to get the `.p8` file
11. **Save the file securely** (you can only download it once!)
12. **Note the Key ID** shown on the page

---

### ✅ Step 5: Generate Client Secret Using Supabase Tool

1. **Go to:** https://supabase.com/docs/guides/auth/social-login/auth-apple
2. Scroll down to find the **"Generate Apple Client Secret"** tool
3. **Use Firefox or Chrome** (Safari doesn't work)
4. Fill in the tool:
   - **Services ID**: Your Services ID (e.g., `com.youi.app.signin`)
   - **Key ID**: The Key ID from Step 4.12
   - **Team ID**: Your Apple Team ID (top-right of Apple Developer Console)
   - **Private Key**: Open your `.p8` file in a text editor and paste the entire contents
5. Click **"Generate Secret"**
6. **Copy the generated JWT token**

---

### ✅ Step 6: Configure Supabase with Apple Credentials

1. **Go to:** https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers
2. Find **"Apple"** in the list
3. Click on it
4. **Enable the provider** (toggle ON)
5. Fill in:
   - **Services ID (Client ID)**: Your Services ID from Step 2 (e.g., `com.youi.app.signin`)
   - **Secret Key**: The JWT token generated in Step 5
   - **Key ID**: The Key ID from Step 4.12
   - **Team ID**: Your Apple Team ID (top-right of Apple Developer Console)
6. Click **"Save"**

---

### ✅ Step 7: Verify Supabase Redirect URLs

1. **Go to:** https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/url-configuration
2. Make sure these URLs are in the **Redirect URLs** list:
   ```
   youi://auth
   exp://127.0.0.1:8081
   exp://localhost:8081
   https://auth.expo.io/@peterehat/youphoria
   ```
3. These are where Supabase redirects your app after authentication

---

### ✅ Step 8: Test Again

1. **Restart your app** (stop and start Expo)
2. **Try Apple Sign-In**
3. **Check the logs** - you should see the WebBrowser session return
4. **Dismiss the error page** (if you still see one) to see the full logs

---

## Quick Verification

### In Supabase Dashboard:
- [ ] Apple provider is **enabled** (toggle ON)
- [ ] Services ID field is filled: `com.youi.app.signin` (or your ID)
- [ ] Secret Key field is filled (long JWT token)
- [ ] Key ID field is filled (10 characters)
- [ ] Team ID field is filled (10 characters)

### In Apple Developer Console:
- [ ] Services ID exists: `com.youi.app.signin`
- [ ] Services ID has "Sign in with Apple" enabled
- [ ] Redirect URL is configured: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- [ ] Signing key (.p8 file) exists and is downloaded

---

## Common Mistakes

### ❌ Mistake 1: Using App ID instead of Services ID
- **Wrong**: Using your bundle ID (e.g., `com.youi.app`)
- **Right**: Using your Services ID (e.g., `com.youi.app.signin`)

### ❌ Mistake 2: Wrong redirect URL in Apple Developer Console
- **Wrong**: `youi://auth` (your app's deep link)
- **Right**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback` (Supabase callback)

### ❌ Mistake 3: Pasting .p8 file contents into Supabase
- **Wrong**: Pasting raw `.p8` file contents into Secret Key field
- **Right**: Using the Supabase tool to generate a JWT, then pasting that

### ❌ Mistake 4: Apple provider not enabled
- **Wrong**: Configuring everything but forgetting to toggle the provider ON
- **Right**: Make sure the toggle is ON in Supabase

---

## Still Not Working?

### Check the logs after dismissing the error:
```
LOG  WebBrowser session returned: [timestamp]
LOG  WebBrowser result: [result object]
LOG  Auth session result type (Apple): [type]
```

### If you see `type: "cancel"`:
- The user dismissed the auth page (expected if there's an error)

### If you see `type: "dismiss"`:
- The auth session was dismissed by the system

### If you don't see "WebBrowser session returned":
- The browser is still open - dismiss the error page to continue

---

## Resources

- **Apple Developer Console**: https://developer.apple.com/account/
- **Supabase Apple Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-apple
- **Supabase Dashboard**: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou
- **Detailed Guide**: See `APPLE_SECRET_KEY_GUIDE.md` in this directory



