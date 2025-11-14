# Railway Deployment Guide

Quick guide to deploy your You-i backend to Railway.

---

## Why Railway?

- ✅ **No refactoring needed** - Express server works as-is
- ✅ **Fast deployment** - 5 minutes to production
- ✅ **No cold starts** - Always-on server
- ✅ **Easy logging** - `railway logs`
- ✅ **Automatic HTTPS** - SSL included
- ✅ **Fair pricing** - $5 credit/month free, ~$5-10/month for production

---

## 🚀 Step-by-Step Deployment

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### 3. Initialize Project

```bash
cd backend
railway init
```

**Select:**
- "Create a new project"
- Enter project name: `youphoria-backend`

### 4. Deploy

```bash
railway up
```

This will:
- Upload your code
- Install dependencies
- Build your app
- Start the server

### 5. Set Environment Variables

```bash
railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
railway variables set GEMINI_API_KEY=your_gemini_api_key_here
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

**Where to find keys:**

**SUPABASE_SERVICE_ROLE_KEY:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy `service_role` key (NOT the anon key!)

**GEMINI_API_KEY:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy the key (starts with `AIzaSy...`)

### 6. Get Your Production URL

```bash
railway domain
```

**Example output:**
```
youphoria-backend-production.up.railway.app
```

Your API will be at:
```
https://youphoria-backend-production.up.railway.app/api/v1
```

### 7. Test Your Deployment

```bash
# Test health endpoint
curl https://youphoria-backend-production.up.railway.app/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-14T...","uptime":123}
```

### 8. Update Mobile App

Edit `reactapp/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://youphoria-backend-production.up.railway.app/api/v1"
    }
  }
}
```

### 9. Rebuild Mobile App

```bash
cd ../reactapp
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
railway logs --follow

# Last 100 lines
railway logs

# Filter by service
railway logs --service backend
```

### View in Dashboard

1. Go to [railway.app](https://railway.app)
2. Select your project
3. Click "Deployments" tab
4. View logs, metrics, and deployment history

---

## 🔧 Managing Your Deployment

### View Environment Variables

```bash
railway variables
```

### Update Environment Variable

```bash
railway variables set GEMINI_API_KEY=new_key_here
```

### Restart Service

```bash
railway restart
```

### Redeploy

```bash
railway up
```

### View Service Info

```bash
railway status
```

---

## 💰 Pricing

### Free Tier
- **$5 credit per month**
- Good for development/testing
- Resets monthly

### Usage-Based Pricing
- **~$5-10/month** for typical production use
- Pay only for what you use
- No minimum commitment

**Your backend will likely cost:**
- Small traffic: $5-7/month
- Medium traffic: $10-15/month
- Includes: compute, memory, bandwidth

---

## 🐛 Troubleshooting

### Deployment Failed

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing `package.json` scripts
- Missing dependencies
- Port configuration

**Fix:**
Ensure `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### Environment Variables Not Working

**Verify they're set:**
```bash
railway variables
```

**Set them again:**
```bash
railway variables set KEY=value
```

**Restart after setting:**
```bash
railway restart
```

### Can't Access API

**Check domain:**
```bash
railway domain
```

**Test health endpoint:**
```bash
curl https://your-domain.railway.app/api/v1/health
```

**Check logs for errors:**
```bash
railway logs --follow
```

### CORS Errors

Update `backend/src/index.ts`:

```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://youphoria.app', 'exp://'] // Add your domains
    : true,
  credentials: true,
};
```

Redeploy:
```bash
railway up
```

---

## 🔐 Security Checklist

- [ ] All environment variables set (not hardcoded)
- [ ] Using SUPABASE_SERVICE_ROLE_KEY (not anon key)
- [ ] GEMINI_API_KEY is secret
- [ ] NODE_ENV=production
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (automatic with Railway)

---

## 📈 Scaling

Railway automatically scales based on usage. For high traffic:

1. **Upgrade plan** in Railway dashboard
2. **Add more resources** (CPU/memory)
3. **Enable autoscaling**

---

## 🔄 CI/CD (Optional)

### Auto-Deploy from GitHub

1. **Connect GitHub repo:**
   ```bash
   railway link
   ```

2. **Enable auto-deploy:**
   - Go to Railway dashboard
   - Project Settings → GitHub
   - Enable "Auto-deploy"

3. **Now every push to main auto-deploys!**

---

## 📝 Quick Commands

```bash
# Deploy
railway up

# View logs
railway logs --follow

# Set environment variable
railway variables set KEY=value

# Get domain
railway domain

# Restart
railway restart

# Open dashboard
railway open

# View status
railway status
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Update mobile app with production URL
3. ✅ Rebuild and submit app
4. ✅ Set up monitoring (optional: add Sentry)
5. ✅ Test on real device
6. ✅ Monitor logs for issues

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

---

**Last Updated:** November 14, 2025  
**Deployment Time:** ~5 minutes  
**Difficulty:** ⭐ Easy

