# Apple Sign-In Setup Guide - Complete Walkthrough

## Problem
Getting "WebAuthenticationSession error 1" which means Apple is rejecting the OAuth request before it completes.

## Root Cause
This happens when Apple Developer Console doesn't have the correct Services ID and redirect URL configured.

---

## Part 1: Apple Developer Console Setup

### Step 1: Create or Verify Services ID

1. **Go to**: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. **Look for**: `com.youi.supabase`

#### If it DOESN'T exist:
1. Click the **"+"** button (top left)
2. Select **"Services IDs"**
3. Click **"Continue"**
4. Fill in:
   - **Description**: "YouPhoria Supabase Auth"
   - **Identifier**: `com.youi.supabase`
5. Click **"Continue"**, then **"Register"**

#### Configure the Services ID:
1. Click on `com.youi.supabase` in the list
2. Check the box: **"Sign in with Apple"**
3. Click **"Configure"** next to "Sign in with Apple"
4. In the configuration screen:
   - **Primary App ID**: Select `com.youi.app` (or your main App ID)
   - **Domains and Subdomains**: Add
     ```
     empmaiqjpyhanrpuabou.supabase.co
     ```
   - **Return URLs**: Add (EXACT URL, copy-paste this):
     ```
     https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback
     ```
5. Click **"Save"**
6. Click **"Continue"**
7. Click **"Save"** again

⚠️ **Wait 5-10 minutes** for Apple to propagate these changes.

---

### Step 2: Verify or Create Signing Key

1. **Go to**: https://developer.apple.com/account/resources/authkeys/list
2. **Look for**: A key with "Sign in with Apple" enabled

#### If you have a key with ID `M2C99U6Z38`:
- Make sure it has "Sign in with Apple" checked
- If you have the `.p8` file saved, skip to Part 2
- If you DON'T have the `.p8` file, you must create a NEW key (Apple doesn't let you re-download)

#### If you need to create a NEW key:
1. Click the **"+"** button
2. **Key Name**: "YouPhoria Apple Sign In Key"
3. Check: **"Sign in with Apple"**
4. Click **"Configure"** next to it
5. Select **Primary App ID**: `com.youi.app`
6. Click **"Save"**
7. Click **"Continue"**
8. Click **"Register"**
9. **IMPORTANT**: Download the `.p8` file NOW (you can't download it again!)
10. **Save the Key ID** (looks like `M2C99U6Z38` or similar)

---

## Part 2: Generate Apple Client Secret (JWT)

Apple requires a JWT token (not the raw `.p8` file) for Supabase.

### Option A: Use Supabase's Tool (Recommended)

1. **Go to**: https://supabase.com/docs/guides/auth/social-login/auth-apple
2. Scroll down to **"Generate Apple Client Secret"** tool
3. **Use Firefox or Chrome** (Safari has issues with this tool)
4. Fill in the form:
   - **Team ID**: `RX9FNDKHNY` (from top-right of Apple Developer Console)
   - **Client ID (Services ID)**: `com.youi.supabase`
   - **Key ID**: Your key ID (e.g., `M2C99U6Z38` or the new one you created)
   - **Private Key**: Open your `.p8` file and paste the ENTIRE contents, including:
     ```
     -----BEGIN PRIVATE KEY-----
     [all the key content]
     -----END PRIVATE KEY-----
     ```
5. Click **"Generate Secret Key"**
6. Copy the generated JWT (starts with `eyJ...`)
7. **Save this JWT** - you'll need it in the next step

### Option B: Use Command Line (Alternative)

If the web tool doesn't work, you can generate the JWT using Ruby:

```bash
# Install jwt gem if needed
gem install jwt

# Create a script
cat > generate_apple_secret.rb << 'EOF'
require 'jwt'

team_id = 'RX9FNDKHNY'
client_id = 'com.youi.supabase'
key_id = 'M2C99U6Z38'  # Replace with your Key ID
key_file = 'AuthKey_M2C99U6Z38.p8'  # Replace with your .p8 filename

ecdsa_key = OpenSSL::PKey::EC.new(File.read(key_file))

headers = {
  'kid' => key_id
}

claims = {
  'iss' => team_id,
  'iat' => Time.now.to_i,
  'exp' => Time.now.to_i + 86400 * 180,  # 6 months
  'aud' => 'https://appleid.apple.com',
  'sub' => client_id
}

token = JWT.encode(claims, ecdsa_key, 'ES256', headers)
puts token
EOF

# Run it
ruby generate_apple_secret.rb
```

---

## Part 3: Configure Supabase

1. **Go to**: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers
2. Find **"Apple"** in the list
3. Click on it
4. **Enable the provider**: Toggle should be **ON** (green)
5. Fill in these fields:

   - **Services ID (Client ID)**: 
     ```
     com.youi.supabase
     ```
   
   - **Secret Key**: 
     Paste the JWT you generated (starts with `eyJ...`, NOT the `.p8` file contents)
   
   - **Key ID**: 
     ```
     M2C99U6Z38
     ```
     (or your new Key ID if you created a new key)
   
   - **Team ID**: 
     ```
     RX9FNDKHNY
     ```

6. Click **"Save"**
7. **Wait 5-10 minutes** for Supabase to propagate the changes

---

## Part 4: Verify Configuration

### In Apple Developer Console:
- [ ] Services ID `com.youi.supabase` exists
- [ ] "Sign in with Apple" is checked
- [ ] Primary App ID is `com.youi.app`
- [ ] Domain is `empmaiqjpyhanrpuabou.supabase.co`
- [ ] Return URL is `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- [ ] Signing key exists with "Sign in with Apple" enabled
- [ ] You have the `.p8` file saved

### In Supabase Dashboard:
- [ ] Apple provider toggle is ON (green)
- [ ] Services ID = `com.youi.supabase`
- [ ] Secret Key starts with `eyJ` (not `-----BEGIN`)
- [ ] Key ID matches your Apple key
- [ ] Team ID = `RX9FNDKHNY`

---

## Part 5: Test

1. **Rebuild your app** (if using a standalone build):
   ```bash
   cd reactapp
   eas build --profile development --platform ios
   ```

2. **Or restart Expo** (if using Expo Go):
   ```bash
   npm start -- --clear
   ```

3. **Try Apple Sign-In** and watch the logs

4. **Expected behavior**:
   - Safari/WebView opens with Apple's sign-in page
   - You can sign in with your Apple ID
   - Page redirects back to your app
   - You're signed in

5. **If it still fails**:
   - Take a screenshot of the error page Apple shows
   - Share the complete console logs
   - Verify the configuration again (wait 10 minutes after saving)

---

## Common Mistakes

### ❌ Mistake 1: Wrong Return URL in Apple Console
**Wrong**: `youi://auth` (this is your app's deep link)
**Wrong**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/authorize`
**Correct**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`

### ❌ Mistake 2: Raw .p8 File in Supabase
**Wrong**: Pasting the `.p8` file contents into Supabase Secret Key field
**Correct**: Generate a JWT using the `.p8` file, then paste the JWT

### ❌ Mistake 3: Services ID Mismatch
**Wrong**: Using `com.youi.app` as the Services ID
**Correct**: Create a separate Services ID like `com.youi.supabase`

### ❌ Mistake 4: Not Waiting for Propagation
Both Apple and Supabase need time to propagate configuration changes. Wait 5-10 minutes after saving.

### ❌ Mistake 5: Expired JWT
The JWT expires after 6 months. If you generated it more than 6 months ago, generate a new one.

---

## Troubleshooting

### Issue: "Invalid client id or web redirect url"
- Verify the Services ID in Apple matches Supabase exactly
- Verify the Return URL in Apple is exactly `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- Wait 10 minutes after saving configuration

### Issue: "WebAuthenticationSession error 1"
- This means the auth sheet was cancelled/dismissed
- Usually caused by Apple showing an error page
- Verify all configuration above
- Make sure the Apple provider is enabled in Supabase

### Issue: "Authentication timed out"
- The auth sheet opened but never completed
- User may have dismissed it
- Or Apple is showing an error page

### Issue: Secret key doesn't work
- Make sure you're using the JWT (starts with `eyJ`), not the `.p8` file
- Regenerate the JWT if it's more than 6 months old
- Use Firefox/Chrome for the web tool (Safari has issues)

---

## Quick Reference

**Your Configuration:**
- Bundle ID: `com.youi.app`
- Services ID: `com.youi.supabase`
- Team ID: `RX9FNDKHNY`
- Key ID: `M2C99U6Z38` (or your new one)
- Supabase URL: `https://empmaiqjpyhanrpuabou.supabase.co`
- Return URL: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- App Deep Link: `youi://auth`

---

## Need Help?

If you've followed all steps and it still doesn't work, please provide:
1. Screenshot of Apple Developer Console Services ID configuration (show domains and return URLs)
2. Screenshot of Supabase Apple provider settings (blur the secret key)
3. Complete console logs from the app
4. Screenshot of any error page Apple shows

