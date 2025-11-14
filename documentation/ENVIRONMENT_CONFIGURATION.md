# Environment Configuration

Your app now automatically switches between development and production backends!

---

## 🔄 How It Works

The app uses the `__DEV__` flag to automatically determine which backend to use:

### Development Mode (`npm start`)
- **Backend:** `http://192.168.7.89:3000/api/v1` (local)
- **When:** Running with Expo Go or development builds
- **Logs show:** `environment: 'DEVELOPMENT'`

### Production Mode (`eas build`)
- **Backend:** `https://you-i-api-production.up.railway.app/api/v1`
- **When:** Building for TestFlight or App Store
- **Logs show:** `environment: 'PRODUCTION'`

---

## 📝 Configuration Priority

The app checks for the API URL in this order:

1. **Environment Variable** `EXPO_PUBLIC_API_URL` (highest priority)
2. **app.json** `extra.apiUrl`
3. **Auto-detection** based on `__DEV__` flag

---

## 🛠️ Override Options

### Option 1: Environment Variable (Temporary Override)

```bash
# Use a different backend temporarily
export EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
npm start
```

### Option 2: Update app.json (Permanent)

Edit `reactapp/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-custom-backend.com/api/v1"
    }
  }
}
```

This will override the auto-detection for ALL builds.

---

## 🔍 Checking Current Configuration

When the app starts, check the console logs:

```javascript
[ChatService] API Configuration: {
  environment: 'DEVELOPMENT',  // or 'PRODUCTION'
  apiUrl: 'http://192.168.7.89:3000/api/v1',
  isLocalhost: false,
  isLocalIP: true,
  isProduction: false
}
```

---

## 🧪 Testing Different Environments

### Test with Local Backend
```bash
cd reactapp
npm start
# Opens Expo Go with local backend
```

### Test with Production Backend (in development)
```bash
export EXPO_PUBLIC_API_URL=https://you-i-api-production.up.railway.app/api/v1
npm start
```

### Build for Production
```bash
eas build --platform ios --profile production
# Automatically uses production backend
```

---

## 📍 Current Configuration

### Development (Local)
- **Backend:** `http://192.168.7.89:3000/api/v1`
- **Requires:** Local backend running on your Mac
- **Network:** Same WiFi as your phone

### Production (Railway)
- **Backend:** `https://you-i-api-production.up.railway.app/api/v1`
- **Requires:** Nothing! It's always available
- **Network:** Any internet connection

---

## 🔧 Updating Backend URLs

### Change Local Development URL

Edit `reactapp/services/chatService.js` and `uploadService.js`:

```javascript
if (__DEV__) {
  return 'http://YOUR_NEW_IP:3000/api/v1';  // Change this
}
```

### Change Production URL

Edit `reactapp/services/chatService.js` and `uploadService.js`:

```javascript
} else {
  return 'https://your-new-backend.railway.app/api/v1';  // Change this
}
```

Or update `app.json`:
```json
"apiUrl": "https://your-new-backend.railway.app/api/v1"
```

---

## ⚠️ Important Notes

1. **Local backend must be running** for development mode to work
   ```bash
   cd backend
   npm run dev
   ```

2. **Same WiFi network** required for local development (phone and Mac)

3. **Production builds** always use Railway backend (no local backend needed)

4. **app.json is committed to git**, so production URL is shared with team

5. **Environment variables are NOT committed**, good for personal overrides

---

## 🐛 Troubleshooting

### "Network request failed" in development

**Cause:** Local backend not running or wrong IP

**Fix:**
1. Start backend: `cd backend && npm run dev`
2. Check IP matches your Mac's IP
3. Verify phone and Mac on same WiFi

### "Network request failed" in production

**Cause:** Railway backend down or wrong URL

**Fix:**
1. Check Railway dashboard: https://railway.app
2. Test backend: `curl https://you-i-api-production.up.railway.app/health`
3. Check logs: `cd backend && railway logs`

### Wrong backend being used

**Check logs:**
```
[ChatService] API Configuration: { environment: '...', apiUrl: '...' }
```

**If wrong:**
1. Clear environment variables: `unset EXPO_PUBLIC_API_URL`
2. Check app.json doesn't have override
3. Restart Metro bundler: `r` in terminal

---

## 📊 Summary

| Mode | Backend | When | Requires |
|------|---------|------|----------|
| **Development** | Local (`192.168.7.89:3000`) | `npm start` | Backend running locally |
| **Production** | Railway (`you-i-api-production.up.railway.app`) | `eas build` | Nothing! |

---

**Last Updated:** November 14, 2025  
**Status:** ✅ Automatic environment switching enabled

