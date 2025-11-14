# Quick Log Access Guide

Quick reference for accessing logs in production and development.

---

## 📱 Mobile App Logs (iOS)

### Method 1: Xcode Console (Recommended)
```bash
# 1. Connect iPhone to Mac via USB
# 2. Open Xcode
# 3. Window → Devices and Simulators
# 4. Select your device
# 5. Click "Open Console"
# 6. Filter by: "ChatService" or "InsightsScreen"
```

**What to look for:**
```
[ChatService] API Configuration: { apiUrl: "...", isProduction: true }
[ChatService] Error sending message: Network request failed
[ChatService] Error details: { message: "...", apiUrl: "..." }
```

### Method 2: React Native Debugger (Development Only)
```bash
# 1. Shake device
# 2. Tap "Debug"
# 3. Open Chrome: chrome://inspect
# 4. Click "inspect" under your app
```

### Method 3: Safari Web Inspector (Development Only)
```bash
# 1. Settings → Safari → Advanced → Web Inspector (ON)
# 2. Connect device to Mac
# 3. Open Safari → Develop → [Your iPhone] → [Your App]
```

---

## 🖥️ Backend Logs

### Local Development
```bash
cd backend

# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# View last 50 lines
tail -n 50 logs/combined.log

# Search for specific error
grep "Error" logs/combined.log
grep "chat/message" logs/combined.log
```

### Railway Production
```bash
# Install CLI (one time)
npm install -g @railway/cli

# Login (one time)
railway login

# View logs
railway logs

# Follow logs (real-time)
railway logs --follow

# Filter by service
railway logs --service backend
```

### Render Production
```bash
# Via Dashboard
# 1. Go to render.com
# 2. Select your service
# 3. Click "Logs" tab

# Via CLI
render logs
```

### Heroku Production
```bash
# Install CLI (one time)
brew install heroku/brew/heroku

# Login (one time)
heroku login

# View logs
heroku logs --tail

# View last 200 lines
heroku logs -n 200

# Filter by app
heroku logs --app youphoria-backend --tail
```

---

## 🔍 What to Look For

### Successful Chat Request
```json
{
  "level": "info",
  "message": "POST /api/v1/chat/message",
  "statusCode": 200,
  "responseTime": "2341ms"
}
```

### Network Error (App Side)
```
[ChatService] Error sending message: Network request failed
[ChatService] Error details: {
  message: "Network request failed",
  apiUrl: "http://192.168.7.89:3000/api/v1"
}
```

### Backend Error
```json
{
  "level": "error",
  "message": "Error occurred:",
  "error": "Gemini API error: Invalid API key",
  "url": "/api/v1/chat/message",
  "statusCode": 500
}
```

### Configuration Warning
```
⚠️ [ChatService] WARNING: Production build using development URL!
⚠️ [ChatService] Current API URL: http://192.168.7.89:3000/api/v1
```

---

## 🧪 Testing Backend Directly

### Health Check
```bash
# Local
curl http://localhost:3000/api/v1/health

# Production
curl https://your-backend-url.railway.app/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-14T10:25:00.000Z"}
```

### Test Chat Endpoint
```bash
# Get auth token from Supabase
# 1. Log into app
# 2. Check Xcode console for token
# 3. Or use Supabase dashboard to generate token

# Test request
curl -X POST https://your-backend-url/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "message": "Hello",
    "userId": "your-user-id"
  }'
```

---

## 🚨 Common Error Patterns

### 1. "Network request failed"
**Cause:** Can't reach backend  
**Check:**
- Is backend running? (curl health endpoint)
- Is API URL correct in app.json?
- Is device on internet?

### 2. "Connection timeout"
**Cause:** Backend too slow or not responding  
**Check:**
- Backend logs for errors
- Backend resource usage (CPU/memory)
- Database connection issues

### 3. "Gemini API error"
**Cause:** Invalid or missing API key  
**Check:**
```bash
# Railway
railway variables get GEMINI_API_KEY

# Heroku
heroku config:get GEMINI_API_KEY

# Should start with: AIzaSy...
```

### 4. "Failed to create conversation"
**Cause:** Supabase connection issue  
**Check:**
```bash
# Verify service role key is set
railway variables get SUPABASE_SERVICE_ROLE_KEY

# Test Supabase connection
# Go to Supabase dashboard → SQL Editor
SELECT * FROM chat_conversations LIMIT 1;
```

---

## 📊 Log Levels

### Info (Normal Operation)
```
[ChatService] Sending message
[ChatService] Message sent successfully
```

### Warning (Potential Issues)
```
⚠️ [ChatService] WARNING: Production build using development URL!
```

### Error (Something Failed)
```
[ChatService] Error sending message: Network request failed
ERROR [Backend] Gemini API error: Invalid API key
```

---

## 🔧 Quick Debugging Workflow

1. **Check app logs** (Xcode Console)
   - Look for `[ChatService]` errors
   - Note the API URL being used
   - Check error message

2. **Test backend directly** (curl)
   ```bash
   curl https://your-backend-url/api/v1/health
   ```

3. **Check backend logs**
   ```bash
   railway logs
   # or
   heroku logs --tail
   ```

4. **Verify configuration**
   - app.json has correct API URL
   - Backend has all environment variables
   - Supabase tables exist

5. **Test specific endpoint**
   ```bash
   curl -X POST https://your-backend-url/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"message":"test","userId":"test"}'
   ```

---

## 📞 Quick Commands Reference

```bash
# App logs (Xcode)
# Window → Devices and Simulators → Open Console

# Backend logs (Railway)
railway logs --follow

# Backend logs (Heroku)
heroku logs --tail

# Test health
curl https://your-backend-url/api/v1/health

# Check environment variables (Railway)
railway variables

# Check environment variables (Heroku)
heroku config

# Restart backend (Railway)
railway restart

# Restart backend (Heroku)
heroku restart
```

---

**Last Updated:** November 14, 2025  
**Related Docs:** 
- `PRODUCTION_DEBUGGING_GUIDE.md` - Full debugging guide
- `PRODUCTION_ERROR_FIX.md` - Current error fix

