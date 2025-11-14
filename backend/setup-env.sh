#!/bin/bash

# Railway Environment Variables Setup Script

echo "🔐 Setting up Railway Environment Variables"
echo "==========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Please install it first: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway!"
    echo "Please run: railway login"
    exit 1
fi

echo "You need to provide 2 API keys:"
echo ""
echo "1. Supabase Service Role Key"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Select your project: empmaiqjpyhanrpuabou"
echo "   - Settings → API"
echo "   - Copy the 'service_role' key (NOT anon key)"
echo ""
echo "2. Gemini API Key"
echo "   - Go to: https://makersuite.google.com/app/apikey"
echo "   - Create API key"
echo "   - Copy the key (starts with AIzaSy...)"
echo ""
read -p "Press Enter when you have both keys ready..."
echo ""

# Get Supabase Service Role Key
echo "📝 Enter your Supabase Service Role Key:"
read -s SUPABASE_KEY
echo ""

if [ -z "$SUPABASE_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

# Get Gemini API Key
echo "📝 Enter your Gemini API Key:"
read -s GEMINI_KEY
echo ""

if [ -z "$GEMINI_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

echo "🚀 Setting environment variables..."
echo ""

# Set Supabase URL
railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
echo "✅ Set SUPABASE_URL"

# Set Supabase Service Role Key
railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_KEY"
echo "✅ Set SUPABASE_SERVICE_ROLE_KEY"

# Set Gemini API Key
railway variables set GEMINI_API_KEY="$GEMINI_KEY"
echo "✅ Set GEMINI_API_KEY"

# Set Node Environment
railway variables set NODE_ENV=production
echo "✅ Set NODE_ENV"

echo ""
echo "🎉 All environment variables set!"
echo ""

# Verify
echo "🔍 Verifying..."
echo ""
railway variables
echo ""

# Restart
echo "🔄 Restarting service to apply changes..."
railway restart
echo ""

echo "✅ Done! Wait 30 seconds for service to restart."
echo ""
echo "Test your backend with:"
DOMAIN=$(railway domain 2>/dev/null || echo "your-domain")
echo "  curl https://$DOMAIN/api/v1/health"
echo ""

