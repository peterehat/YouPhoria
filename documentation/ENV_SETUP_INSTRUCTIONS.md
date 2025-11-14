# Backend Environment Setup - URGENT FIX NEEDED

## ⚠️ CRITICAL: Chat is failing because `.env` file is missing!

The backend needs a `.env` file with proper credentials to work. Follow these steps:

## Step 1: Create `.env` file

In the `backend` directory, create a file named `.env` with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG1haXFqcHloYW5ycHVhYm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTU1MjAsImV4cCI6MjA3NzI5MTUyMH0.rRZsoyrEfvkNiBkOjBUQPjw38_bhIOBJarrjwusWXmM
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Google Gemini API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 2: Get Supabase Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `empmaiqjpyhanrpuabou`
3. Go to **Settings** → **API**
4. Find the **`service_role`** key (NOT the `anon` key)
5. Copy it and replace `YOUR_SERVICE_ROLE_KEY_HERE` in your `.env` file

⚠️ **IMPORTANT**: The service role key is SECRET - never commit it to git!

## Step 3: Get Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza`)
5. Replace `YOUR_GEMINI_API_KEY_HERE` in your `.env` file

## Step 4: Verify Database Tables Exist

Run this SQL in your Supabase SQL Editor to ensure chat tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_conversations', 'chat_messages');
```

If they don't exist, run the migration:
- File: `reactapp/database-migrations/005_create_chat_tables.sql`

## Step 5: Restart Backend

After creating the `.env` file:

```bash
cd backend
npm run dev
```

## Verification

Test if it's working:

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok"}`

## Current Error

The error you're seeing:
```
ERROR [ChatService] Error sending message: [Error: Failed to create conversation]
```

This happens because:
1. ❌ No `.env` file exists
2. ❌ `SUPABASE_SERVICE_ROLE_KEY` is empty/undefined
3. ❌ `GEMINI_API_KEY` is empty/undefined
4. ❌ Backend can't connect to database to create conversations

Once you complete the steps above, the chat will work! 🎉

