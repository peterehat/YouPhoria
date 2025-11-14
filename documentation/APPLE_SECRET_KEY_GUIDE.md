# How to Create Apple Secret Key for Supabase

## Overview

Supabase doesn't generate the `.p8` key file for you - that must be created in Apple Developer Console. However, Supabase provides tools to help you use it.

## Step-by-Step Process

### Step 1: Create the `.p8` Key in Apple Developer Console

1. **Go to Apple Developer Console**
   - Visit: https://developer.apple.com/account/resources/identifiers/list
   - Sign in with your Apple Developer account

2. **Navigate to Keys**
   - Click **"Certificates, Identifiers & Profiles"** in the sidebar
   - Click **"Keys"** in the left sidebar
   - Click the **"+"** button to create a new key

3. **Configure the Key**
   - **Name**: "YouPhoria Sign in with Apple" (or any name you prefer)
   - Check the **"Sign in with Apple"** checkbox
   - Click **"Configure"** next to "Sign in with Apple"
   - Select your App ID from the dropdown
   - Click **"Save"**

4. **Register and Download**
   - Click **"Continue"**
   - Click **"Register"**
   - **IMPORTANT:** Click **"Download"** to get the `.p8` file
   - ⚠️ **You can only download this file once!** Save it securely.
   - **Note the Key ID** displayed on the page (you'll need this)

5. **Get Your Team ID**
   - Look at the top-right corner of Apple Developer Console
   - Your **Team ID** is displayed there (10-character string like `RX9FNDKHNY`)

### Step 2: Generate Client Secret Using Supabase's Web Tool (Recommended)

Supabase provides a **web-based tool** that generates the client secret from your `.p8` file. This is the recommended method:

1. **Go to the Supabase Documentation Page**
   - Visit: https://supabase.com/docs/guides/auth/social-login/auth-apple
   - Scroll down to find the **"Generate Apple Client Secret"** tool section
   - ⚠️ **Important**: The tool doesn't work in Safari - use **Firefox or Chrome**

2. **Prepare Your Information**
   You'll need:
   - **Services ID (Client ID)**: Your Services ID (e.g., `com.youi.app.signin`)
   - **Key ID**: The Key ID from Step 1.4 (e.g., `ABC123XYZ`)
   - **Team ID**: Your Team ID from Step 1.5 (e.g., `RX9FNDKHNY`)
   - **Private Key (`.p8` file contents)**: Open your `.p8` file and copy the entire contents

3. **Use the Tool**
   - Fill in the form fields in the tool:
     - **Services ID**: Paste your Services ID
     - **Key ID**: Paste your Key ID
     - **Team ID**: Paste your Team ID
     - **Private Key**: Paste the entire contents of your `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Click **"Generate Secret"** or the equivalent button
   - **Copy the generated client secret** (it will be a long JWT token)

4. **Add to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers
   - Click on **"Apple"**
   - Fill in:
     - **Services ID (Client ID)**: Your Services ID (e.g., `com.youi.app.signin`)
     - **Secret Key**: The **generated client secret** from the tool (not the raw `.p8` file)
     - **Key ID**: Your Key ID
     - **Team ID**: Your Team ID
   - Click **"Save"**

### Alternative: Direct `.p8` File Contents

Some Supabase configurations accept the raw `.p8` file contents directly. If the tool doesn't work, you can try:

1. **Open the `.p8` file** you downloaded in a text editor
2. **Copy the entire contents** including:
   ```
   -----BEGIN PRIVATE KEY-----
   [long string of characters]
   -----END PRIVATE KEY-----
   ```
3. **Paste it into Supabase's "Secret Key" field** instead of the generated JWT

### Step 3: Create Services ID (If You Haven't Already)

Before you can use the key, you need a Services ID:

1. **Go to Identifiers**
   - Visit: https://developer.apple.com/account/resources/identifiers/list/serviceId
   - Click **"+"** to create a new identifier
   - Select **"Services IDs"**

2. **Register Services ID**
   - **Description**: "YouPhoria Wellness"
   - **Identifier**: `com.youi.app.signin` (or similar)
   - Click **"Continue"** and **"Register"**

3. **Configure Sign in with Apple**
   - Click on your Services ID
   - Check **"Sign in with Apple"**
   - Click **"Configure"**
   - Add redirect URL: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
   - Click **"Save"**, **"Continue"**, **"Register"**

## What Goes Where

### In Supabase Dashboard:
- **Services ID (Client ID)**: `com.youi.app.signin` (your Services ID)
- **Secret Key**: Contents of your `.p8` file (the entire file, including BEGIN/END lines)
- **Key ID**: The Key ID from when you created the key (e.g., `ABC123XYZ`)
- **Team ID**: Your Apple Team ID (top-right of Apple Developer Console)

### In Apple Developer Console:
- **Redirect URL**: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`

## Important Notes

1. **The `.p8` file is created by Apple, not Supabase**
   - Supabase doesn't generate this - you must create it in Apple Developer Console
   - The file can only be downloaded once, so save it securely

2. **Secret Key Rotation Required Every 6 Months**
   - ⚠️ **Critical**: Apple requires you to generate a new client secret every 6 months using the `.p8` file
   - Set a calendar reminder to rotate your secret key
   - Use the same Supabase tool to generate a new secret key when needed
   - If you lose the `.p8` file, you'll need to create a new key in Apple Developer Console
   - This requirement applies to OAuth flow (web-based apps)

3. **Use the Supabase Web Tool**
   - The tool on the documentation page generates the client secret (JWT) from your `.p8` file
   - The generated JWT is what goes into Supabase's "Secret Key" field
   - The tool doesn't work in Safari - use Firefox or Chrome

4. **Keep your `.p8` file secure**
   - Don't commit it to git
   - Store it in a secure password manager
   - You can't re-download it if you lose it
   - You'll need it every 6 months to rotate the secret key

## Troubleshooting

### "Invalid client id"
- Make sure your Services ID is exactly the same in both places
- Verify the Services ID has "Sign in with Apple" enabled

### "Invalid secret key"
- Make sure you copied the ENTIRE `.p8` file contents
- Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- Check that there are no extra spaces or characters

### "Key ID not found"
- Make sure the Key ID matches exactly what Apple shows
- It's case-sensitive

### "Team ID invalid"
- Get your Team ID from the top-right of Apple Developer Console
- It's a 10-character alphanumeric string

## Quick Checklist

- [ ] Created `.p8` key in Apple Developer Console
- [ ] Downloaded and saved the `.p8` file securely
- [ ] Noted the Key ID
- [ ] Found your Team ID
- [ ] Created Services ID
- [ ] Configured Services ID with Supabase callback URL
- [ ] Pasted `.p8` contents into Supabase "Secret Key" field
- [ ] Filled in all 4 fields in Supabase (Services ID, Secret Key, Key ID, Team ID)
- [ ] Enabled Apple provider in Supabase

## Resources

- **Supabase Apple Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-apple
- **Supabase JWT Generator App**: https://apps.apple.com/us/app/jwt-generator-for-supabase/id6745578181
- **Apple Developer Console**: https://developer.apple.com/account/

