# Apple Sign-In Quick Verification Checklist

## The Error
```
invalid_request
Invalid client id or web redirect url
```

This means Apple is rejecting the OAuth request. It's one of two issues:

## ✅ Check 1: Supabase Apple Provider Configuration

**Go to:** https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/auth/providers

1. Find **"Apple"** in the list
2. Click on it
3. **Verify these fields are filled in:**
   - ✅ **Services ID (Client ID)** - Should be something like `com.youi.app.signin`
   - ✅ **Secret Key** - Should contain `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - ✅ **Key ID** - 10-character string (e.g., `ABC123XYZ`)
   - ✅ **Team ID** - 10-character string (e.g., `RX9FNDKHNY`)
4. **Toggle should be ON** (enabled)

**If any field is empty or missing:**
- You need to set up Apple Sign-In in Apple Developer Console first
- See `APPLE_OAUTH_FIX.md` for detailed instructions

## ✅ Check 2: Apple Developer Console Redirect URL

**Go to:** https://developer.apple.com/account/resources/identifiers/list/serviceId

1. Find your **Services ID** (the one matching what's in Supabase)
2. Click on it
3. Make sure **"Sign in with Apple"** is checked
4. Click **"Configure"** next to "Sign in with Apple"
5. **Check the "Redirect URLs" section:**
   - Must include: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
   - This is the Supabase callback URL, NOT your app's deep link URL

**If the redirect URL is missing or wrong:**
- Add: `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`
- Click **"Save"**
- Click **"Continue"** and **"Register"**

## 🔍 What to Look For in Logs

After trying Apple Sign-In, check if you see:
- `WebBrowser session returned:` - This means the browser closed (even if with an error)
- If you DON'T see this, the browser might be stuck on the error page

## 🚨 Most Common Issues

### Issue 1: Supabase Not Configured
**Symptom:** Services ID field is empty in Supabase
**Fix:** Follow `APPLE_OAUTH_FIX.md` Step 2

### Issue 2: Wrong Redirect URL in Apple Developer Console
**Symptom:** Redirect URL is `youi://auth` or something else
**Fix:** Must be `https://empmaiqjpyhanrpuabou.supabase.co/auth/v1/callback`

### Issue 3: Services ID Mismatch
**Symptom:** Services ID in Supabase doesn't match Apple Developer Console
**Fix:** Copy the exact Services ID from Apple Developer Console to Supabase

## 📝 Quick Test

1. Verify Supabase has all 4 fields filled (Services ID, Secret Key, Key ID, Team ID)
2. Verify Apple Developer Console has the Supabase callback URL
3. Try Apple Sign-In again
4. Check logs - you should see `WebBrowser session returned:` after dismissing the error page

## 🆘 Still Not Working?

Share:
1. Screenshot of Supabase Apple provider settings (blur out the secret key)
2. Screenshot of Apple Developer Console redirect URLs
3. Full console logs from `=== APPLE OAUTH DEBUG START ===` to the end



