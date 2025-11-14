# 🚀 Production Deployment - Quick Start

This guide will deploy your You-i backend to Railway in production.

---

## ⚡ Super Quick Method (Recommended)

Run this **ONE command** from the Monorepo directory:

```bash
./deploy-to-production.sh
```

This script will:
- ✅ Install Railway CLI
- ✅ Login to Railway
- ✅ Deploy your backend
- ✅ Set environment variables (you'll need to provide 2 API keys)
- ✅ Test the deployment
- ✅ Update your mobile app configuration

**Time:** ~10 minutes (mostly waiting for deployment)

---

## 📋 What You'll Need

Before running the script, have these ready:

### 1. Supabase Service Role Key
1. Go to https://supabase.com/dashboard
2. Select your project: `empmaiqjpyhanrpuabou`
3. Click **Settings** → **API**
4. Copy the **`service_role`** key (NOT the anon key!)
   - It's a long string starting with `eyJhbGci...`

### 2. Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Click **"Create API key"**
3. Copy the key (starts with `AIzaSy...`)

---

## 🎯 Step-by-Step

### 1. Open Terminal

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo
```

### 2. Run Deployment Script

```bash
./deploy-to-production.sh
```

### 3. Follow the Prompts

The script will:
1. Install Railway CLI (if needed)
2. Open browser for Railway login
3. Deploy backend to Railway
4. Ask for your 2 API keys
5. Set environment variables
6. Test the deployment
7. Update app.json with production URL

### 4. Test Locally

```bash
cd reactapp
npm start
```

Open app on your phone → Insights → Try chat

### 5. Rebuild for Production

If local testing works:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 🛠️ Alternative: Manual Step-by-Step

If you prefer to do it manually, use these individual scripts:

### Deploy Backend Only
```bash
cd backend
./deploy.sh
```

### Set Environment Variables Only
```bash
cd backend
./setup-env.sh
```

### Update App Configuration Only
```bash
./update-app-url.sh
```

---

## 📊 Monitoring & Management

### View Logs
```bash
cd backend
railway logs --follow
```

### View Dashboard
```bash
cd backend
railway open
```

### Test Backend
```bash
# Get your URL first
cd backend
railway domain

# Test it
curl https://YOUR_URL/api/v1/health
```

### Update Environment Variable
```bash
cd backend
railway variables set KEY=value
railway restart
```

---

## 🐛 Troubleshooting

### Script Permission Denied

```bash
chmod +x deploy-to-production.sh
./deploy-to-production.sh
```

### Railway CLI Not Found

```bash
npm install -g @railway/cli
```

### Deployment Failed

Check logs:
```bash
cd backend
railway logs
```

Common issues:
- Missing dependencies → Check package.json
- TypeScript errors → Check src/ files
- Port issues → Railway handles this automatically

### Health Check Failed

1. Check environment variables:
```bash
cd backend
railway variables
```

2. Verify all 4 are set:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - GEMINI_API_KEY
   - NODE_ENV

3. Restart:
```bash
railway restart
```

### App Still Shows Error

1. Check app.json has correct URL:
```bash
grep apiUrl reactapp/app.json
```

2. Should show:
```json
"apiUrl": "https://youphoria-backend-production-xxxx.up.railway.app/api/v1"
```

3. Rebuild app:
```bash
cd reactapp
eas build --platform ios --profile production
```

---

## 💰 Cost

- **Development:** $5 free credit/month
- **Production:** ~$5-10/month for typical usage

---

## 📚 Additional Documentation

- **`documentation/DEPLOYMENT_CHECKLIST.md`** - Detailed manual steps
- **`documentation/RAILWAY_DEPLOYMENT_GUIDE.md`** - Complete Railway reference
- **`documentation/PRODUCTION_DEBUGGING_GUIDE.md`** - Debugging guide
- **`documentation/QUICK_LOG_ACCESS.md`** - How to access logs

---

## 🎉 That's It!

Your backend will be deployed to Railway and your app will be configured to use it.

**Questions?** Check the documentation files above or Railway's docs at https://docs.railway.app

---

**Last Updated:** November 14, 2025  
**Estimated Time:** 10 minutes  
**Difficulty:** ⭐ Easy

