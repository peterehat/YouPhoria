# Chat Testing Guide

## ✅ What's Been Fixed

1. **Database tables created** - `chat_conversations` and `chat_messages` tables now exist
2. **Gemini model updated** - Changed from deprecated `gemini-pro` to `gemini-1.5-flash`
3. **Environment configured** - Backend `.env` file has all required credentials

## 🧪 How to Test

### Option 1: Test with React Native App (Recommended)

This is the easiest way since you'll have a real authenticated user:

1. **Make sure backend is running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your React Native app:**
   ```bash
   cd reactapp
   npm start
   ```

3. **Sign in to the app** (with Google, Apple, or email)

4. **Open the chat** and send a message like:
   - "What is a healthy resting heart rate?"
   - "Tell me about sleep quality"
   - "How much water should I drink daily?"

5. **You should get an AI response!** ✨

### Option 2: Test with CURL (Advanced)

To test with CURL, you need a real user ID from your database.

#### Get a Real User ID:

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/sql/new

2. Run this query:
   ```sql
   SELECT id, email FROM auth.users LIMIT 1;
   ```

3. Copy the `id` (it's a UUID)

#### Test with CURL:

```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is a healthy resting heart rate?",
    "userId": "PASTE_YOUR_USER_ID_HERE"
  }' | jq .
```

**Expected successful response:**
```json
{
  "success": true,
  "conversationId": "uuid-here",
  "message": "A healthy resting heart rate for adults typically ranges from 60 to 100 beats per minute..."
}
```

## 🐛 Troubleshooting

### Error: "Could not find the table"
✅ **FIXED** - Tables have been created

### Error: "models/gemini-pro is not found"
✅ **FIXED** - Updated to `gemini-1.5-flash`

### Error: "violates foreign key constraint"
This means you're testing with a fake user ID. Use Option 1 (React Native app) or get a real user ID for CURL testing.

### Error: "Gemini API key is not configured"
Check your `backend/.env` file has:
```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

### Error: "Network request failed"
- Make sure backend is running: `cd backend && npm run dev`
- Check backend logs for errors
- Verify `EXPO_PUBLIC_API_URL` in your React Native app

## 📊 Verify Everything is Working

### Check Backend Status:

```bash
curl http://localhost:3000/health | jq .
```

Should show:
```json
{
  "success": true,
  "message": "Server is healthy",
  ...
}
```

### Check Backend Logs:

When backend starts, you should see:
```
✅ All required environment variables are set
```

If you see ❌ errors, check your `.env` file.

### Check Database Tables:

Go to: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/editor

You should see:
- `chat_conversations` table
- `chat_messages` table

## 🎉 Success Indicators

When everything works, you'll see:

**In React Native app:**
- Send a message → Get AI response
- Conversation is saved
- Can view chat history

**In backend logs:**
```
info: Incoming request {"method":"POST","url":"/api/v1/chat/message",...}
info: Request completed {"statusCode":200,...}
```

**In frontend logs:**
```
LOG [ChatService] Message sent successfully
```

## 📝 What Changed

### Files Modified:
1. `backend/src/controllers/chatController.ts` - Updated Gemini model to `gemini-1.5-flash`
2. `backend/src/index.ts` - Added configuration check on startup
3. `reactapp/services/chatService.js` - Improved error messages and logging

### Database:
- Created `chat_conversations` table
- Created `chat_messages` table
- Set up RLS policies
- Created indexes for performance

### Configuration:
- Backend `.env` file configured with Supabase and Gemini credentials

## 🚀 Next Steps

1. Test the chat in your React Native app
2. Try different types of questions
3. Verify conversations are saved in Supabase
4. Check that chat history persists across app restarts

If you encounter any issues, check the backend logs for detailed error messages!

