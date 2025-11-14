# Conversations Not Showing - Quick Start Guide

## Problem
Conversations exist in the database but aren't showing on the You-i Insights page in the app.

## Quick Diagnosis

### Step 1: Run the Test Script (Recommended)
```bash
node test-conversations-api.js
```

This will test:
- ✅ Backend health check
- ✅ API info endpoint
- ✅ Conversations endpoint with your user ID

**Expected output:**
```
✅ All tests completed!
Found X conversation(s)
```

**If you see 0 conversations:** The backend is working but no data is being returned. Check the database.

**If you see errors:** The backend isn't accessible. See troubleshooting below.

### Step 2: Check the App

1. Open the You-i app
2. Go to "You-i Insights" tab
3. Look for the debug text at the top: `Debug: X conversations, loading: yes/no`
4. Pull down to refresh
5. Check the console logs

### Step 3: Check Console Logs

**Frontend logs should show:**
```
[InsightsScreen] Loading conversations for user: 90ecdf1e-ac7f-4ef4-978e-a01ef1d86473
[ChatService] Fetching conversations for userId: ...
[ChatService] Response status: 200
[ChatService] Conversations count: X
```

**Backend logs should show:**
```
[getConversations] Request received for userId: ...
[getConversations] Conversations count: X
```

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptom:** Connection errors, timeout
**Solution:**
```bash
cd backend
npm run dev
```

### Issue 2: Wrong IP Address
**Symptom:** Connection refused, network errors
**Solution:** 
1. Find your computer's IP address:
   - Mac: System Settings → Network → WiFi → Details → TCP/IP
   - Or run: `ipconfig getifaddr en0`
2. Update `reactapp/app.json`:
   ```json
   "extra": {
     "apiUrl": "http://YOUR_IP:3000/api/v1"
   }
   ```
3. Update `test-conversations-api.js`:
   ```javascript
   const API_HOST = 'YOUR_IP';
   ```

### Issue 3: Empty Conversations Array
**Symptom:** Status 200 but no conversations
**Solution:** Check the database:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM chat_conversations 
WHERE user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';
```

If no results: Conversations don't exist in database for this user.
If results exist: There's a mismatch in user IDs or data format.

### Issue 4: Different User ID
**Symptom:** Database has conversations but API returns empty
**Solution:** Verify the user ID:

1. Check what user ID the app is using (look in console logs)
2. Compare with database:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'peterehat@gmail.com';
   ```
3. If they don't match, you may have multiple accounts

### Issue 5: Firewall Blocking
**Symptom:** Timeout on physical device but works on simulator
**Solution:**
- Allow port 3000 through your firewall
- Make sure device is on same WiFi network
- Try accessing `http://YOUR_IP:3000/health` in device browser

## Files Modified for Debugging

All files have been enhanced with comprehensive logging:

1. **reactapp/components/InsightsScreen.js**
   - Added console logging
   - Added on-screen debug info

2. **reactapp/services/chatService.js**
   - Added detailed request/response logging

3. **backend/src/controllers/chatController.ts**
   - Added logging for database queries and responses

## Testing Tools

### 1. Test Script (Recommended)
```bash
node test-conversations-api.js
```

### 2. Manual curl Test
```bash
# Health check
curl http://192.168.7.89:3000/health

# Get conversations
curl "http://192.168.7.89:3000/api/v1/chat/conversations?userId=90ecdf1e-ac7f-4ef4-978e-a01ef1d86473"
```

### 3. Database Query
```sql
-- Count conversations
SELECT COUNT(*) FROM chat_conversations 
WHERE user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';

-- Get details
SELECT 
  cc.id,
  cc.title,
  cc.created_at,
  cc.updated_at,
  COUNT(cm.id) as message_count
FROM chat_conversations cc
LEFT JOIN chat_messages cm ON cm.conversation_id = cc.id
WHERE cc.user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473'
GROUP BY cc.id, cc.title, cc.created_at, cc.updated_at
ORDER BY cc.updated_at DESC;
```

## What to Check First

1. ✅ **Backend is running** - Run `npm run dev` in backend directory
2. ✅ **Backend is accessible** - Run `node test-conversations-api.js`
3. ✅ **Data exists** - Check database with SQL query above
4. ✅ **Correct user ID** - Verify in logs and database
5. ✅ **App can reach backend** - Check on-screen debug info and logs

## Expected Data Flow

```
User pulls to refresh
    ↓
InsightsScreen.loadConversations()
    ↓
chatService.getConversations(userId)
    ↓
HTTP GET /api/v1/chat/conversations?userId=...
    ↓
Backend: chatController.getConversations()
    ↓
Supabase: SELECT from chat_conversations
    ↓
Backend: Format and return data
    ↓
Frontend: Update state
    ↓
UI: Render conversations
```

The logs will show you exactly where in this flow the issue occurs.

## Need More Help?

If the issue persists, share:

1. **Output from test script:** `node test-conversations-api.js`
2. **Console logs** from the app (both frontend and backend)
3. **Database query results** (conversation count and details)
4. **On-screen debug info** (the text showing conversation count)
5. **Backend configuration:**
   - Is `.env` file present?
   - Does it have `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`?

## Additional Documentation

- **TEST_CONVERSATIONS_DEBUG.md** - Detailed debugging guide
- **CONVERSATIONS_DEBUG_SUMMARY.md** - Summary of changes made
- **test-conversations-api.js** - Automated test script

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Test API
node test-conversations-api.js

# Check your IP
ipconfig getifaddr en0  # Mac
ipconfig                # Windows

# Restart app with fresh logs
# In Expo: Press 'r' to reload
```

## Success Indicators

You'll know it's working when:
- ✅ Test script shows conversations
- ✅ Backend logs show requests coming in
- ✅ Frontend logs show data being received
- ✅ On-screen debug shows conversation count > 0
- ✅ Conversations appear in the UI

