# Apple Sign-In Configuration Checklist

## Current Issue
Getting `WebAuthenticationSession error 1` - the authentication sheet is being cancelled/dismissed, usually because Apple is showing an error page.

---

## ✅ COMPLETED CHECKS

### ✅ iOS App Configuration
- [x] Entitlements file has `com.apple.developer.applesignin` enabled
- [x] Xcode project references the entitlements file
- [x] Bundle ID is `com.youi.app`
- [x] URL schemes include `youi` and `com.youi.app`
- [x] Team ID is `RX9FNDKHNY`

---

## 🔍 WHAT YOU NEED TO CHECK NOW

### Step 1: Apple Developer Console - Services ID

**Go to**: https://developer.apple.com/account/resources/identifiers/list/serviceId

**Check if `com.youi.supabase` exists:**
- [ ] Yes, I see `com.youi.supabase` in the list
- [ ] No, I need to create it

**If it exists, click on it and verify:**

1. **"Sign in with Apple" checkbox**
   - [ ] ✅ Checked
   - [ ] ❌ Not checked (CHECK IT!)

2. **Click "Configure" next to "Sign in with Apple"**

3. **Primary App ID**
   - [ ] ✅ Set to `com.youi.app` (or your main App ID)
   - [ ] ❌ Not set or wrong (SELECT `com.youi.app`)

4. **Domains and Subdomains**
   - [ ] ✅ Contains `empmaiqjpyhanrpuabou.supabase.co`
   - [ ] ❌ Empty or different (ADD `empmaiqjpyhanrpuabou.supabase.co`)

5. **Return URLs** (MOST COMMON ISSUE!)
   - [ ] ✅ Contains exactly: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
   - [ ] ❌ Empty, wrong, or different

   **Common mistakes:**
   - ❌ `youi://auth` (this is your app's deep link, not Apple's redirect)
   - ❌ `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/authorize` (wrong path)
   - ❌ Missing `https://`
   - ❌ Extra trailing slash

   **Correct value** (copy-paste this):
   ```
   https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
   ```

6. **After making changes:**
   - [ ] Clicked "Save" in the configure dialog
   - [ ] Clicked "Continue"
   - [ ] Clicked "Save" again on the Services ID page
   - [ ] Waited 5-10 minutes for Apple to propagate changes

---

### Step 2: Apple Developer Console - Signing Key

**Go to**: https://developer.apple.com/account/resources/authkeys/list

**Check for a key with "Sign in with Apple" enabled:**

1. **Do you see a key with ID `M2C99U6Z38`?**
   - [ ] Yes, and I have the `.p8` file saved
   - [ ] Yes, but I don't have the `.p8` file (you'll need to create a NEW key)
   - [ ] No, I need to create a new key

2. **If you need to create a NEW key:**
   - [ ] Clicked "+" button
   - [ ] Named it: "YouPhoria Apple Sign In Key"
   - [ ] Checked "Sign in with Apple"
   - [ ] Configured it with Primary App ID: `com.youi.app`
   - [ ] Downloaded the `.p8` file (SAVE IT - you can't download again!)
   - [ ] Saved the new Key ID (e.g., `ABC123XYZ`)

3. **Key ID to use:**
   - If using existing key: `M2C99U6Z38`
   - If created new key: `____________` (write it here)

---

### Step 3: Generate Apple Client Secret (JWT)

**Go to**: https://supabase.com/docs/guides/auth/social-login/auth-apple

1. **Scroll down to "Generate Apple Client Secret" tool**

2. **Use Firefox or Chrome** (Safari has issues)

3. **Fill in the form:**
   - **Team ID**: `RX9FNDKHNY`
   - **Client ID (Services ID)**: `com.youi.supabase`
   - **Key ID**: `M2C99U6Z38` (or your new Key ID)
   - **Private Key**: Paste ENTIRE `.p8` file contents, including:
     ```
     -----BEGIN PRIVATE KEY-----
     [key content]
     -----END PRIVATE KEY-----
     ```

4. **Click "Generate Secret Key"**

5. **Copy the JWT** (starts with `eyJ...`)
   - [ ] Copied the JWT
   - [ ] JWT starts with `eyJ`
   - [ ] JWT is very long (several hundred characters)

6. **Save the JWT** - you'll paste it into Supabase next

---

### Step 4: Supabase Configuration

**Go to**: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers

1. **Find "Apple" in the providers list**

2. **Click on it**

3. **Enable the provider:**
   - [ ] ✅ Toggle is ON (green)
   - [ ] ❌ Toggle is OFF (TURN IT ON!)

4. **Services ID (Client ID):**
   - [ ] ✅ Contains exactly: `com.youi.supabase`
   - [ ] ❌ Empty or different (ENTER `com.youi.supabase`)

5. **Secret Key:**
   - [ ] ✅ Contains a JWT starting with `eyJ`
   - [ ] ❌ Empty, contains `.p8` file, or starts with `-----BEGIN`
   
   **If wrong:**
   - [ ] Pasted the JWT you generated in Step 3
   - [ ] Verified it starts with `eyJ`
   - [ ] Verified it's NOT the raw `.p8` file contents

6. **Key ID:**
   - [ ] ✅ Contains: `M2C99U6Z38` (or your new Key ID)
   - [ ] ❌ Empty or different (ENTER your Key ID)

7. **Team ID:**
   - [ ] ✅ Contains: `RX9FNDKHNY`
   - [ ] ❌ Empty or different (ENTER `RX9FNDKHNY`)

8. **After making changes:**
   - [ ] Clicked "Save"
   - [ ] Waited 5-10 minutes for Supabase to propagate changes

---

## 🧪 TESTING

### Before Testing:
- [ ] Waited at least 10 minutes after saving all configuration
- [ ] Restarted Expo dev server: `npm start -- --clear`
- [ ] Or rebuilt the app if using standalone build

### During Testing:
1. **Tap "Sign in with Apple" button**
2. **What happens?**
   - [ ] Safari/WebView opens with Apple's sign-in page
   - [ ] I see an error page (take a screenshot!)
   - [ ] Nothing happens
   - [ ] App crashes

3. **If you see Apple's sign-in page:**
   - [ ] I can enter my Apple ID
   - [ ] After signing in, it redirects back to the app
   - [ ] I'm successfully signed in

4. **If you see an error page, what does it say?**
   - [ ] "Invalid client id or web redirect url"
   - [ ] "redirect_uri_mismatch"
   - [ ] Something else: `_______________________`

### Console Logs:
After testing, check the console logs for these key lines:

```
LOG  === APPLE OAUTH DEBUG START ===
LOG  Auth redirectUrl (Apple): youi://auth
LOG  Supabase URL: https://empmaiqjpyhanrpuabou.supabase.co
LOG  Starting Apple OAuth with redirectUrl: youi://auth
LOG  OAuth response data: {"provider": "apple", "url": "..."}
LOG  Opening Apple auth URL: ...
```

**Share these logs if it still doesn't work!**

---

## 🎯 MOST COMMON ISSUES (Check These First!)

### Issue #1: Wrong Return URL in Apple Developer Console
**This is the #1 cause of the error you're seeing!**

**Check**: Apple Developer Console → Services ID → Configure
**Must be exactly**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`

**Common mistakes:**
- ❌ `youi://auth`
- ❌ `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/authorize`
- ❌ Missing or wrong domain

### Issue #2: Raw .p8 File in Supabase Secret Key
**Check**: Supabase → Apple Provider → Secret Key
**Must start with**: `eyJ` (JWT token)
**NOT**: `-----BEGIN PRIVATE KEY-----` (raw .p8 file)

### Issue #3: Apple Provider Not Enabled
**Check**: Supabase → Apple Provider → Toggle
**Must be**: ON (green)

### Issue #4: Services ID Doesn't Exist
**Check**: Apple Developer Console → Services IDs
**Must have**: `com.youi.supabase` in the list

### Issue #5: Not Waiting for Propagation
**Both Apple and Supabase need 5-10 minutes** to propagate configuration changes.

---

## 📋 QUICK SUMMARY

**Your configuration should be:**

| Setting | Value |
|---------|-------|
| **Apple Bundle ID** | `com.youi.app` |
| **Apple Services ID** | `com.youi.supabase` |
| **Apple Team ID** | `RX9FNDKHNY` |
| **Apple Key ID** | `M2C99U6Z38` (or your new one) |
| **Apple Return URL** | `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback` |
| **Supabase URL** | `https://empmaiqjpyhanrpuabou.supabase.co` |
| **Supabase Services ID** | `com.youi.supabase` |
| **Supabase Secret Key** | JWT starting with `eyJ` |
| **Supabase Key ID** | `M2C99U6Z38` (or your new one) |
| **Supabase Team ID** | `RX9FNDKHNY` |
| **App Deep Link** | `youi://auth` |

---

## 🆘 IF IT STILL DOESN'T WORK

Please provide:
1. ✅ Confirmation that you've checked ALL items above
2. 📸 Screenshot of Apple Developer Console Services ID configuration (show domains and return URLs)
3. 📸 Screenshot of Supabase Apple provider settings (blur the secret key)
4. 📝 Complete console logs from the app
5. 📸 Screenshot of any error page Apple shows
6. ⏱️ Confirmation that you waited 10+ minutes after saving configuration

---

## 📚 ADDITIONAL RESOURCES

- **Full Setup Guide**: See `APPLE_SIGNIN_SETUP_GUIDE.md` in this directory
- **Apple Developer Console**: https://developer.apple.com/account/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers
- **Supabase Apple Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-apple

