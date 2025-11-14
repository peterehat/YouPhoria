# Generate Apple Client Secret (JWT) - Step by Step

## What You Need

From your screenshots, I can see:
- **Services ID**: `com.youi.supabase` ✅
- **Team ID**: `RX9FNDKHNY` ✅
- **Domain**: `empmaiqjpyhanrpuabou.supabase.co` ✅
- **Return URL**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback` ✅

Now you need to generate a fresh JWT (client secret).

---

## ⚠️ IMPORTANT: Fix Supabase Client ID First!

I noticed in your Supabase screenshot that **Client IDs** shows `com.youi.app`.

**This should be `com.youi.supabase`** (your Services ID, not your App ID)!

### Fix This:
1. In Supabase, change **Client IDs** from `com.youi.app` to `com.youi.supabase`
2. Then continue with generating the secret key below

---

## Step 1: Find or Create Your Apple Signing Key

### Go to: https://developer.apple.com/account/resources/authkeys/list

**Look for a key with "Sign in with Apple" enabled**

### Option A: You Have the .p8 File Already
- [ ] I have a `.p8` file saved (looks like `AuthKey_ABC123XYZ.p8`)
- [ ] I know the Key ID (looks like `M2C99U6Z38` or similar)
- **If YES**: Skip to Step 2

### Option B: You Don't Have the .p8 File
⚠️ **Apple doesn't let you re-download .p8 files!**

You need to create a NEW key:

1. Click the **"+"** button (top left)
2. **Key Name**: "YouPhoria Apple Sign In Key 2024"
3. Check: **"Sign in with Apple"**
4. Click **"Configure"** next to it
5. **Primary App ID**: Select `Youi (RX9FNDKHNY.com.youi.app)` or `com.youi.app`
6. Click **"Save"**
7. Click **"Continue"**
8. Click **"Register"**
9. **DOWNLOAD THE .p8 FILE NOW** (you can't download it again!)
10. **Save the Key ID** that's shown (e.g., `ABC123XYZ`)

**Write your Key ID here**: `_________________`

---

## Step 2: Generate the JWT Using Supabase's Tool

### Go to: https://supabase.com/docs/guides/auth/social-login/auth-apple

1. **Scroll down** to the "Generate Apple Client Secret" section
2. You'll see a form with 4 fields

### Use Firefox or Chrome (Safari has issues with this tool!)

### Fill in the form:

**Team ID (Account ID):**
```
RX9FNDKHNY
```

**Client ID (Services ID):**
```
com.youi.supabase
```
⚠️ **Important**: Use `com.youi.supabase` (Services ID), NOT `com.youi.app` (App ID)

**Key ID:**
```
M2C99U6Z38
```
(Or your new Key ID if you created a new key in Step 1)

**Private Key:**
1. Open your `.p8` file in a text editor (TextEdit, VS Code, etc.)
2. Copy the **ENTIRE contents**, including the BEGIN and END lines:
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(many more lines of random characters)
...xyzABC123==
-----END PRIVATE KEY-----
```
3. Paste it into the "Private Key" field

### Click "Generate Secret Key"

The tool will generate a JWT that looks like:
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik0yQzk5VTZaMzgifQ.eyJpc3MiOiJSWDlGTkRLSE5ZIiwiaWF0IjoxNzMxNjc4...
```

**Copy this entire JWT** (it's very long, several hundred characters)

---

## Step 3: Update Supabase Configuration

### Go to: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers

1. Find **"Apple"** in the list
2. Click on it
3. **Update these fields:**

**Enable Sign in with Apple:**
- [x] Toggle should be ON (green) ✅

**Client IDs:**
```
com.youi.supabase
```
⚠️ **Change this from `com.youi.app` to `com.youi.supabase`**

**Secret Key (for OAuth):**
- Delete the old value
- Paste the JWT you just generated (starts with `eyJ`)
- **Make sure it starts with `eyJ`, NOT `-----BEGIN PRIVATE KEY-----`**

**Authorized Client IDs:**
```
com.youi.app
```
(This can stay as `com.youi.app` - this is for native iOS sign-in)

4. Click **"Save"**
5. **Wait 10 minutes** for Supabase to propagate the changes

---

## Step 4: Verify Your Configuration

### Apple Developer Console:
- [x] Services ID: `com.youi.supabase`
- [x] "Sign in with Apple" is checked
- [x] Primary App ID: `com.youi.app`
- [x] Domain: `empmaiqjpyhanrpuabou.supabase.co`
- [x] Return URL: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- [x] Signing key exists with "Sign in with Apple" enabled

### Supabase Dashboard:
- [ ] Apple provider toggle is ON (green)
- [ ] **Client IDs** = `com.youi.supabase` (NOT `com.youi.app`)
- [ ] **Secret Key** = JWT starting with `eyJ` (NOT `.p8` file contents)
- [ ] **Authorized Client IDs** = `com.youi.app`

---

## Step 5: Test

1. **Wait 10 minutes** after saving the Supabase configuration
2. **Restart your app** or Expo dev server:
   ```bash
   npm start -- --clear
   ```
3. **Try Apple Sign-In**

### Expected Behavior:
- Safari/WebView opens
- You see Apple's sign-in page (not an error)
- You can sign in with your Apple ID
- App redirects back and you're signed in

### If It Still Fails:
- Check the console logs
- Make sure you changed **Client IDs** to `com.youi.supabase`
- Make sure the secret key starts with `eyJ`
- Wait the full 10 minutes

---

## Troubleshooting

### Issue: "The tool won't generate the JWT"
- Try a different browser (Firefox or Chrome, not Safari)
- Make sure you pasted the entire `.p8` file including BEGIN/END lines
- Make sure there are no extra spaces or line breaks

### Issue: "I don't have the .p8 file"
- You must create a new key in Apple Developer Console
- Download it immediately (you can't download it again)
- Use the new Key ID when generating the JWT

### Issue: "Invalid private key" error
- Make sure you copied the entire `.p8` file
- Make sure it includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Try opening the file in a plain text editor (not Word or Pages)

### Issue: Still getting "invalid client id or web redirect url"
- **Most likely**: You forgot to change Client IDs from `com.youi.app` to `com.youi.supabase` in Supabase
- Wait the full 10 minutes after saving
- Clear your browser cache and restart the app

---

## Alternative: Generate JWT Using Command Line

If the web tool doesn't work, you can use Ruby:

```bash
# Install jwt gem
gem install jwt

# Create script
cat > generate_apple_secret.rb << 'EOF'
require 'jwt'

team_id = 'RX9FNDKHNY'
client_id = 'com.youi.supabase'  # Services ID, not App ID!
key_id = 'M2C99U6Z38'  # Replace with your Key ID
key_file = 'AuthKey_M2C99U6Z38.p8'  # Replace with your .p8 filename

ecdsa_key = OpenSSL::PKey::EC.new(File.read(key_file))

headers = { 'kid' => key_id }

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

Copy the output and paste it into Supabase's "Secret Key" field.

---

## Quick Reference

**Your Configuration:**
- **Bundle ID (App ID)**: `com.youi.app`
- **Services ID**: `com.youi.supabase` ⚠️ **Use this in Supabase Client IDs!**
- **Team ID**: `RX9FNDKHNY`
- **Key ID**: `M2C99U6Z38` (or your new one)
- **Domain**: `empmaiqjpyhanrpuabou.supabase.co`
- **Return URL**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`

**In Supabase:**
- **Client IDs**: `com.youi.supabase` (Services ID)
- **Secret Key**: JWT starting with `eyJ`
- **Authorized Client IDs**: `com.youi.app` (App ID for native)

---

## Need Help?

If you get stuck:
1. Which step are you on?
2. Do you have the `.p8` file?
3. What error message do you see?
4. Screenshot of the Supabase Apple provider settings after updating

