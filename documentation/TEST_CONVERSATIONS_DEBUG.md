# Conversations Not Showing - Debug Guide

## Issue
Conversations exist in the database for user `peterehat@gmail.com` (ID: `90ecdf1e-ac7f-4ef4-978e-a01ef1d86473`) but are not showing on the You-i Insights page in the app.

## Changes Made
I've added comprehensive logging to help debug this issue:

### 1. Frontend Logging (InsightsScreen.js)
- Logs when loadConversations is called
- Logs the user ID being used
- Logs the result from getConversations
- Logs success/failure and conversation count

### 2. Frontend Service Logging (chatService.js)
- Logs the userId and API URL being called
- Logs auth headers (with token masked)
- Logs response status and full response data
- Logs conversation count received

### 3. Backend Logging (chatController.ts)
- Logs when getConversations endpoint is hit
- Logs the userId from the query
- Logs raw conversations from database
- Logs formatted conversations being returned

## Debug Steps

### Step 1: Check if Backend is Running
```bash
cd backend
npm run dev
```

The backend should be running on `http://localhost:3000` (or your configured port).

### Step 2: Test Backend API Directly

Test the conversations endpoint directly with curl:

```bash
# Replace YOUR_ACCESS_TOKEN with your actual Supabase access token
# You can get this from the app logs or by logging in and checking the session

curl -X GET "http://localhost:3000/api/v1/chat/conversations?userId=90ecdf1e-ac7f-4ef4-978e-a01ef1d86473" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conversation-uuid",
      "title": "Conversation title",
      "preview": "Last message preview...",
      "createdAt": "2024-11-14T...",
      "updatedAt": "2024-11-14T...",
      "messageCount": 5
    }
  ]
}
```

### Step 3: Check App Logs

1. Open the app in development mode
2. Navigate to the Insights page
3. Pull down to refresh (this triggers loadConversations)
4. Check the console logs for:

**Frontend logs to look for:**
```
[InsightsScreen] Loading conversations for user: 90ecdf1e-ac7f-4ef4-978e-a01ef1d86473
[ChatService] Fetching conversations for userId: 90ecdf1e-ac7f-4ef4-978e-a01ef1d86473
[ChatService] API URL: http://...
[ChatService] Response status: 200
[ChatService] Response data: { ... }
[ChatService] Conversations count: X
[InsightsScreen] Setting conversations: X
```

**Backend logs to look for:**
```
[getConversations] Request received for userId: 90ecdf1e-ac7f-4ef4-978e-a01ef1d86473
[getConversations] Raw conversations from DB: [...]
[getConversations] Conversations count: X
[getConversations] Formatted conversations: [...]
```

### Step 4: Verify Database Data

Check the database directly in Supabase:

```sql
-- Check conversations for your user
SELECT * FROM chat_conversations 
WHERE user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473'
ORDER BY updated_at DESC;

-- Check messages for each conversation
SELECT cm.*, cc.title 
FROM chat_messages cm
JOIN chat_conversations cc ON cm.conversation_id = cc.id
WHERE cc.user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473'
ORDER BY cm.created_at DESC;

-- Check if RLS is blocking access (this uses service role, so should work)
SELECT * FROM chat_conversations LIMIT 5;
```

## Common Issues and Solutions

### Issue 1: API URL Mismatch
**Symptom:** Network errors or connection refused
**Solution:** Check that the API_BASE_URL in chatService.js matches your backend URL

For physical devices, you need to use your computer's IP address:
```javascript
// In reactapp/services/chatService.js
const API_BASE_URL = 'http://192.168.1.XXX:3000/api/v1';
```

### Issue 2: Backend Not Running
**Symptom:** Connection errors, timeout
**Solution:** Ensure backend is running with `npm run dev` in the backend directory

### Issue 3: Wrong User ID
**Symptom:** Empty conversations array but no errors
**Solution:** Verify the user ID in the app matches the database:
- Check logs for the user ID being sent
- Verify it matches your actual user ID in Supabase auth.users table

### Issue 4: RLS Policies Blocking Access
**Symptom:** Empty results even though data exists
**Solution:** The backend uses service role key which bypasses RLS, but verify:
```sql
-- Check if service role can see data
SELECT COUNT(*) FROM chat_conversations 
WHERE user_id = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';
```

### Issue 5: Supabase Configuration Missing
**Symptom:** Backend errors about Supabase
**Solution:** Check backend/.env has:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## What to Share for Further Debugging

If the issue persists, please share:

1. **Backend logs** when you refresh the Insights page
2. **Frontend logs** from the app console
3. **Direct API test result** from Step 2
4. **Database query results** from Step 4
5. **API_BASE_URL** being used (check the logs)
6. **Backend .env configuration** (without actual keys, just confirm they're set)

## Quick Test Script

Here's a Node.js script to test the backend directly:

```javascript
// test-conversations.js
const fetch = require('node-fetch');

const userId = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';
const apiUrl = 'http://localhost:3000/api/v1';

async function testConversations() {
  try {
    const response = await fetch(`${apiUrl}/chat/conversations?userId=${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConversations();
```

Run with: `node test-conversations.js`

