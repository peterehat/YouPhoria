# Google Gemini API Setup Guide

## Quick Setup Steps

### 1. Get Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click **"Create API Key"** button
   - Select **"Create API key in new project"** (or choose an existing project)
   - Your API key will be generated immediately
   - **Copy the API key** - it looks like: `AIzaSyC...` (starts with `AIza`)

3. **Important Notes**
   - ⚠️ **Keep your API key secret** - don't commit it to git
   - The API key is free to use with rate limits
   - You can create multiple API keys if needed

### 2. Add API Key to Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create or edit `.env` file**
   ```bash
   # If .env doesn't exist, create it
   touch .env
   ```

3. **Add your API key**
   Open the `.env` file and add:
   ```env
   GEMINI_API_KEY=AIzaSyC...your_actual_api_key_here
   ```

   **Important**: Replace `AIzaSyC...your_actual_api_key_here` with your actual API key from step 1.

4. **Complete `.env` file example**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google Gemini API
   GEMINI_API_KEY=AIzaSyC...your_actual_api_key_here

   # CORS Configuration (optional for development)
   CORS_ORIGIN=http://localhost:19006,exp://192.168.1.1:19000
   ```

### 3. Restart Backend Server

After adding the API key, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd backend
npm run dev
```

### 4. Verify Setup

1. **Check backend logs**
   - When the server starts, you should see: `🚀 Server running on port 3000`
   - No errors about missing API key

2. **Test the chat**
   - Open your React Native app
   - Try sending a message in the You-i chat
   - You should get an AI response (not an error)

## Troubleshooting

### Error: "Gemini API key is not configured"

**Solution:**
- Make sure you created a `.env` file in the `backend` directory
- Verify the API key is spelled correctly: `GEMINI_API_KEY=...`
- Make sure there are no spaces around the `=` sign
- Restart the backend server after adding the key

### Error: "Network request failed"

**Possible causes:**
1. **Backend server not running**
   - Start it: `cd backend && npm run dev`
   - Check it's running on port 3000

2. **Wrong API URL in frontend**
   - Check `reactapp/.env` has: `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
   - For physical devices, use your computer's IP: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1`

3. **CORS issues** (should be fixed, but if persists)
   - The backend now allows all origins in development
   - Make sure `NODE_ENV=development` in backend `.env`

### Error: "Gemini API error: API key not valid"

**Solution:**
- Double-check your API key is correct
- Make sure you copied the entire key (they're long!)
- Try creating a new API key if the current one doesn't work
- Verify the key starts with `AIza`

### Error: "Rate limit exceeded"

**Solution:**
- Google Gemini has free tier rate limits
- Wait a few minutes and try again
- Consider upgrading to a paid plan if you need higher limits

## API Key Security Best Practices

1. **Never commit `.env` to git**
   - The `.env` file should be in `.gitignore`
   - Use `.env.example` for documentation

2. **Use different keys for development/production**
   - Create separate API keys for different environments
   - Restrict API keys to specific projects in Google Cloud Console

3. **Rotate keys regularly**
   - If a key is compromised, delete it and create a new one
   - Update your `.env` file with the new key

## Additional Resources

- **Google AI Studio**: https://makersuite.google.com/app/apikey
- **Gemini API Documentation**: https://ai.google.dev/docs
- **Pricing Information**: https://ai.google.dev/pricing

## Next Steps

Once your API key is set up:
1. ✅ Test sending a message in the chat
2. ✅ Verify responses are coming from Gemini
3. ✅ Check that conversations are being saved to the database
4. ✅ Test on both iOS and Android if applicable

If you encounter any issues, check the backend console logs for detailed error messages.

