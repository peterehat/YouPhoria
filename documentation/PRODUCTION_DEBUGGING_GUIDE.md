# Production Debugging Guide

## Overview
This guide helps you debug issues in the production You-i app, including how to access logs, diagnose errors, and fix common deployment issues.

---

## 🔍 Current Issue: Chat Error on Insights Page

### Symptoms
- User asks a question in the chat (e.g., "How many steps did I take yesterday?")
- Error message appears: "Sorry, I encountered an error. Please try again."
- No AI response is generated

### Root Cause
The production app is configured with a **development API URL** that cannot be reached from production devices.

**Current Configuration (app.json):**
```json
"apiUrl": "http://192.168.7.89:3000/api/v1"
```

This is a local network IP address that only works when:
- The backend server is running on your development machine
- The mobile device is on the same WiFi network
- The backend is accessible at port 3000

**In production, this will NOT work because:**
1. The backend is not deployed to a public server
2. Mobile devices cannot reach local IP addresses (192.168.x.x)
3. The connection will timeout or fail immediately

---

## 🚀 Solution: Deploy Backend to Production

### Option 1: Deploy to Railway (Recommended)

Railway is a simple platform for deploying Node.js backends.

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy Backend:**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   railway variables set GEMINI_API_KEY=your_gemini_api_key
   railway variables set NODE_ENV=production
   ```

5. **Get Production URL:**
   ```bash
   railway domain
   ```
   This will give you a URL like: `https://youphoria-backend.railway.app`

6. **Update app.json:**
   ```json
   "apiUrl": "https://youphoria-backend.railway.app/api/v1"
   ```

7. **Rebuild and Deploy App:**
   ```bash
   cd ../reactapp
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

### Option 2: Deploy to Render

1. **Create account at [render.com](https://render.com)**

2. **Create New Web Service:**
   - Connect your GitHub repository
   - Select the `backend` directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Environment Variables:**
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - GEMINI_API_KEY
   - NODE_ENV=production

4. **Get Service URL** (e.g., `https://youphoria-backend.onrender.com`)

5. **Update app.json** with the new URL

### Option 3: Deploy to Heroku

1. **Install Heroku CLI:**
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login and Create App:**
   ```bash
   heroku login
   cd backend
   heroku create youphoria-backend
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Get URL:**
   ```bash
   heroku info
   ```

---

## 📱 Accessing Production Logs

### Method 1: React Native Debugger (Development Mode)

If you're running the app in development mode on a physical device:

1. **Shake device** to open developer menu
2. Select **"Debug"**
3. Open Chrome DevTools at `chrome://inspect`
4. View console logs

### Method 2: Xcode Console (iOS)

For production builds on iOS:

1. **Connect device to Mac**
2. **Open Xcode**
3. Go to **Window > Devices and Simulators**
4. Select your device
5. Click **"Open Console"**
6. Filter by "YouPhoria" or "You-i"

You'll see logs like:
```
[ChatService] API Configuration: { apiUrl: "http://192.168.7.89:3000/api/v1", ... }
[ChatService] Error sending message: Network request failed
[ChatService] Error details: { message: "Network request failed", apiUrl: "..." }
```

### Method 3: TestFlight Crash Reports

For TestFlight builds:

1. **App Store Connect > TestFlight**
2. Select your build
3. View **Crash Reports** and **Feedback**

### Method 4: Sentry (Recommended for Production)

Add Sentry for production error tracking:

1. **Install Sentry:**
   ```bash
   cd reactapp
   npm install @sentry/react-native
   ```

2. **Initialize in App.js:**
   ```javascript
   import * as Sentry from "@sentry/react-native";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: __DEV__ ? "development" : "production",
   });
   ```

3. **View errors at [sentry.io](https://sentry.io)**

---

## 🔧 Backend Logging

### Accessing Backend Logs

#### Development (Local)
```bash
cd backend
tail -f logs/combined.log    # All logs
tail -f logs/error.log        # Errors only
```

#### Production (Railway)
```bash
railway logs
```

#### Production (Render)
- View logs in Render dashboard
- Or use Render CLI: `render logs`

#### Production (Heroku)
```bash
heroku logs --tail
```

### Understanding Backend Logs

The backend uses Winston logger with structured JSON logging:

**Successful Request:**
```json
{
  "level": "info",
  "message": "POST /api/v1/chat/message",
  "statusCode": 200,
  "responseTime": "1234ms",
  "timestamp": "2025-11-14T10:25:00.000Z"
}
```

**Error:**
```json
{
  "level": "error",
  "message": "Error occurred:",
  "error": "Gemini API error: Invalid API key",
  "url": "/api/v1/chat/message",
  "method": "POST",
  "statusCode": 500,
  "stack": "...",
  "timestamp": "2025-11-14T10:25:00.000Z"
}
```

---

## 🐛 Common Production Issues

### Issue 1: "Network request failed"

**Cause:** App cannot reach backend server

**Solutions:**
1. ✅ Deploy backend to production (see above)
2. ✅ Update `app.json` with production URL
3. ✅ Rebuild and redeploy app

**Debug:**
```bash
# Check if backend is accessible
curl https://your-backend-url.com/api/v1/health
```

### Issue 2: "Gemini API error"

**Cause:** Invalid or missing Gemini API key

**Solutions:**
1. Check environment variables on production server
2. Verify API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Update environment variable and restart server

**Debug:**
```bash
# Railway
railway variables get GEMINI_API_KEY

# Heroku
heroku config:get GEMINI_API_KEY
```

### Issue 3: "Failed to create conversation"

**Cause:** Supabase connection issue

**Solutions:**
1. Verify SUPABASE_URL is correct
2. Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)
3. Check Supabase database has required tables

**Debug:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM chat_conversations LIMIT 1;
SELECT * FROM chat_messages LIMIT 1;
```

### Issue 4: CORS Errors

**Cause:** Backend not allowing requests from app

**Solutions:**
1. Update backend CORS configuration
2. Add production URL to allowed origins

**Fix (backend/src/index.ts):**
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://youphoria.app', 'exp://'] // Add your domains
    : true,
  credentials: true,
};
```

---

## 📊 Monitoring Production

### Health Check Endpoint

Test backend health:
```bash
curl https://your-backend-url.com/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:25:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

### Set Up Monitoring

1. **Uptime Monitoring:**
   - Use [UptimeRobot](https://uptimerobot.com) (free)
   - Monitor `/api/v1/health` endpoint
   - Get alerts if backend goes down

2. **Error Tracking:**
   - Use Sentry (recommended)
   - Get real-time error notifications
   - View stack traces and user context

3. **Performance Monitoring:**
   - Railway/Render/Heroku dashboards
   - Monitor response times
   - Track memory/CPU usage

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Environment variables are set (not hardcoded)
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept secret
- [ ] GEMINI_API_KEY is kept secret
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include sensitive data

---

## 📝 Quick Debugging Checklist

When you see an error in production:

1. **Check app logs** (Xcode Console or Sentry)
   - Look for `[ChatService]` logs
   - Note the API URL being used
   - Check for network errors

2. **Check backend logs** (Railway/Render/Heroku)
   - Look for error messages
   - Check if requests are reaching the backend
   - Verify environment variables

3. **Test backend directly**
   ```bash
   curl -X POST https://your-backend-url.com/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message":"test","userId":"test-user"}'
   ```

4. **Verify configuration**
   - `app.json` has correct production API URL
   - Backend has all required environment variables
   - Supabase database has required tables

5. **Check external services**
   - Supabase is accessible
   - Gemini API key is valid
   - No service outages

---

## 🎯 Next Steps

1. **Deploy backend to production** (Railway recommended)
2. **Update app.json** with production API URL
3. **Rebuild and redeploy app** via EAS
4. **Set up monitoring** (Sentry + UptimeRobot)
5. **Test thoroughly** before releasing to users

---

## 📞 Getting Help

If you're still stuck:

1. Check backend logs for specific error messages
2. Test API endpoints directly with curl
3. Verify all environment variables are set
4. Check Supabase dashboard for database issues
5. Review this guide's troubleshooting section

---

**Last Updated:** November 14, 2025  
**Status:** 🚨 Action Required - Backend needs production deployment

