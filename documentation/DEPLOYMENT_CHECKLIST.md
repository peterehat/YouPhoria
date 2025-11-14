# Railway Deployment Checklist

Follow these steps to deploy your backend to Railway.

---

## ✅ Pre-Deployment (Already Done)

- [x] Updated `package.json` scripts for production
- [x] Created `railway.json` configuration
- [x] Backend code is ready

---

## 📋 Your Action Items

### Step 1: Install Railway CLI

Open your terminal and run:

```bash
npm install -g @railway/cli
```

**Expected output:**
```
added 1 package in 2s
```

---

### Step 2: Login to Railway

```bash
railway login
```

**What happens:**
- Opens browser to authenticate
- You'll need to sign up/login with GitHub
- Terminal will confirm: "Logged in as [your-email]"

---

### Step 3: Navigate to Backend Directory

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo/backend
```

---

### Step 4: Initialize Railway Project

```bash
railway init
```

**You'll be asked:**
- "Create a new project or link to existing?"
  - Choose: **"Create a new project"**
- "Project name?"
  - Enter: **`youphoria-backend`**

**Expected output:**
```
✓ Created project youphoria-backend
✓ Linked to project youphoria-backend
```

---

### Step 5: Deploy Your Backend

```bash
railway up
```

**What happens:**
- Uploads your code
- Installs dependencies
- Builds TypeScript
- Starts server

**Expected output:**
```
✓ Deployment successful
✓ Service is live at: https://youphoria-backend-production-xxxx.up.railway.app
```

⏱️ **This takes 2-3 minutes**

---

### Step 6: Set Environment Variables

You need to set 4 environment variables. Run these commands:

#### 6.1 Set Supabase URL
```bash
railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
```

#### 6.2 Set Supabase Service Role Key

**First, get the key:**
1. Go to https://supabase.com/dashboard
2. Select your project (empmaiqjpyhanrpuabou)
3. Click **Settings** (gear icon)
4. Click **API**
5. Scroll to "Project API keys"
6. Copy the **`service_role`** key (NOT the anon key!)
   - It's a long string starting with `eyJhbGci...`

**Then set it:**
```bash
railway variables set SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
```

#### 6.3 Set Gemini API Key

**First, get the key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click **"Create API key"**
3. Select **"Create API key in new project"** (or use existing)
4. Copy the key (starts with `AIzaSy...`)

**Then set it:**
```bash
railway variables set GEMINI_API_KEY=paste_your_key_here
```

#### 6.4 Set Node Environment
```bash
railway variables set NODE_ENV=production
```

**Verify all variables are set:**
```bash
railway variables
```

**Expected output:**
```
SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
```

---

### Step 7: Restart Service (to apply variables)

```bash
railway restart
```

**Expected output:**
```
✓ Service restarted successfully
```

Wait 30 seconds for restart to complete.

---

### Step 8: Get Your Production URL

```bash
railway domain
```

**Expected output:**
```
youphoria-backend-production-xxxx.up.railway.app
```

**Your full API URL will be:**
```
https://youphoria-backend-production-xxxx.up.railway.app/api/v1
```

📝 **Copy this URL - you'll need it for the next step!**

---

### Step 9: Test Your Backend

Replace `YOUR_URL` with the URL from Step 8:

```bash
curl https://YOUR_URL/api/v1/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T...",
  "uptime": 123,
  "environment": "production"
}
```

✅ **If you see this, your backend is working!**

❌ **If you see an error:**
```bash
# Check logs
railway logs

# Look for errors about missing environment variables or other issues
```

---

### Step 10: Update Mobile App Configuration

Open this file in your editor:
```
/Users/peterehat/Documents/Work/YouPhoria/Monorepo/reactapp/app.json
```

Find line 49 and update it:

**Before:**
```json
"apiUrl": "http://192.168.7.89:3000/api/v1"
```

**After:**
```json
"apiUrl": "https://YOUR_RAILWAY_URL/api/v1"
```

Replace `YOUR_RAILWAY_URL` with the domain from Step 8.

**Example:**
```json
"apiUrl": "https://youphoria-backend-production-abc123.up.railway.app/api/v1"
```

---

### Step 11: Test Mobile App Locally First

Before rebuilding for production, test with your local development app:

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo/reactapp
npm start
```

1. Open app on your phone
2. Go to Insights page
3. Try asking a question in chat
4. It should now work! ✅

---

### Step 12: Rebuild for Production

Once local testing works:

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo/reactapp
eas build --platform ios --profile production
```

This will take 10-15 minutes.

---

### Step 13: Submit to TestFlight

```bash
eas submit --platform ios
```

Follow the prompts to submit to TestFlight.

---

## 🎉 You're Done!

Your backend is now running in production on Railway!

---

## 📊 Monitoring

### View Logs
```bash
railway logs --follow
```

### View Dashboard
```bash
railway open
```

Or go to: https://railway.app

---

## 🐛 Troubleshooting

### Issue: "railway: command not found"

**Solution:**
```bash
npm install -g @railway/cli
```

### Issue: Deployment failed

**Check logs:**
```bash
railway logs
```

**Common causes:**
- Missing dependencies
- TypeScript compilation errors
- Port configuration issues

### Issue: Health check fails

**Check environment variables:**
```bash
railway variables
```

**Verify all 4 are set:**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- NODE_ENV

**Restart after fixing:**
```bash
railway restart
```

### Issue: Chat still not working

**Check app.json:**
- Verify URL is correct (https://, not http://)
- Verify it ends with `/api/v1`
- Verify no typos

**Check backend logs:**
```bash
railway logs --follow
```

**Test endpoint directly:**
```bash
curl https://your-url/api/v1/health
```

---

## 💰 Cost Estimate

**Development:**
- $5 free credit per month
- Resets monthly

**Production:**
- ~$5-10/month for typical usage
- Billed based on actual usage

---

## 📞 Need Help?

If you get stuck:

1. **Check logs:** `railway logs`
2. **Check this file:** `RAILWAY_DEPLOYMENT_GUIDE.md`
3. **Railway Discord:** https://discord.gg/railway

---

**Last Updated:** November 14, 2025  
**Estimated Time:** 15-20 minutes  
**Difficulty:** ⭐ Easy

