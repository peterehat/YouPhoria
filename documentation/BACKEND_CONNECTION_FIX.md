# Backend Connection Fix

## Problem
The React Native app was getting network timeout errors when trying to connect to the backend chat service:
```
ERROR [ChatService] Error fetching conversations: [TypeError: Network request failed]
ERROR [ChatService] Error sending message: [TypeError: Network request timed out]
```

## Root Cause
The app was trying to connect to `http://localhost:3000`, but on mobile devices and simulators, `localhost` refers to the device itself, not your development computer.

## Solution
Updated the backend API URL to use your computer's local IP address instead of localhost.

### Changes Made

1. **Added API URL to `app.json`** (line 49):
   ```json
   "apiUrl": "http://192.168.7.89:3000/api/v1"
   ```

2. **Updated `chatService.js`** to read from app.json:
   ```javascript
   import Constants from 'expo-constants';
   const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || ...
   ```

3. **Installed `expo-constants`** package (if not already present)

## How It Works

- The app now reads the backend URL from `app.json` extra configuration
- Uses your local IP address (192.168.7.89) instead of localhost
- Mobile devices/simulators can now reach your backend server

## Testing

After restarting the app, you should see:
- ✅ Conversations load successfully
- ✅ Chat messages send and receive
- ✅ No more network timeout errors

## If Your IP Address Changes

If your computer's IP address changes (e.g., different WiFi network), update the `apiUrl` in `app.json`:

1. Get your new IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
   ```

2. Update `app.json`:
   ```json
   "apiUrl": "http://YOUR_NEW_IP:3000/api/v1"
   ```

3. Restart the Expo app

## Alternative: Environment Variables

You can also set the API URL via environment variable:
```bash
export EXPO_PUBLIC_API_URL=http://192.168.7.89:3000/api/v1
npm start
```

The app checks in this order:
1. `app.json` extra.apiUrl (highest priority)
2. `EXPO_PUBLIC_API_URL` environment variable
3. `http://localhost:3000/api/v1` (fallback)

## Production Deployment

For production, update the API URL to your production backend:
```json
"apiUrl": "https://api.youphoria.com/api/v1"
```

## Troubleshooting

### Still getting network errors?

1. **Check backend is running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify port 3000 is accessible:**
   ```bash
   curl http://192.168.7.89:3000/api/v1/health
   ```

3. **Check firewall settings:**
   - Ensure your firewall allows connections on port 3000
   - On macOS: System Settings > Network > Firewall

4. **Verify devices are on same network:**
   - Computer and phone/simulator must be on the same WiFi network
   - Corporate/public WiFi may block device-to-device connections

5. **Try a different IP:**
   - If you have multiple network interfaces, try a different IP
   - Run `ifconfig` to see all available IPs

---

**Fixed**: November 14, 2025  
**Status**: ✅ Ready to use

