#!/bin/bash

# Railway Deployment Helper Script
# This script helps you deploy the You-i backend to Railway

set -e  # Exit on error

echo "🚀 You-i Backend Deployment to Railway"
echo "========================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 You need to login to Railway first"
    echo ""
    echo "Running: railway login"
    echo ""
    railway login
    echo ""
fi

echo "✅ Logged in to Railway"
echo ""

# Check if project is initialized
if [ ! -f ".railway" ]; then
    echo "📦 Initializing Railway project..."
    echo ""
    railway init
    echo ""
else
    echo "✅ Railway project already initialized"
    echo ""
fi

# Deploy
echo "🚀 Deploying to Railway..."
echo ""
railway up
echo ""

echo "✅ Deployment complete!"
echo ""

# Get domain
echo "🌐 Getting your production URL..."
echo ""
DOMAIN=$(railway domain 2>/dev/null || echo "")

if [ -z "$DOMAIN" ]; then
    echo "⚠️  No domain found. Generating one..."
    railway domain
    DOMAIN=$(railway domain 2>/dev/null || echo "")
fi

echo ""
echo "📝 Your API URL is:"
echo "   https://$DOMAIN/api/v1"
echo ""

# Check environment variables
echo "🔍 Checking environment variables..."
echo ""

VARS=$(railway variables 2>/dev/null || echo "")

if echo "$VARS" | grep -q "SUPABASE_URL"; then
    echo "✅ SUPABASE_URL is set"
else
    echo "❌ SUPABASE_URL is NOT set"
fi

if echo "$VARS" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
else
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is NOT set"
fi

if echo "$VARS" | grep -q "GEMINI_API_KEY"; then
    echo "✅ GEMINI_API_KEY is set"
else
    echo "❌ GEMINI_API_KEY is NOT set"
fi

if echo "$VARS" | grep -q "NODE_ENV"; then
    echo "✅ NODE_ENV is set"
else
    echo "❌ NODE_ENV is NOT set"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Set environment variables (if not already set):"
echo "   railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co"
echo "   railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key_here"
echo "   railway variables set GEMINI_API_KEY=your_key_here"
echo "   railway variables set NODE_ENV=production"
echo ""
echo "2. Restart service:"
echo "   railway restart"
echo ""
echo "3. Test your backend:"
echo "   curl https://$DOMAIN/api/v1/health"
echo ""
echo "4. Update reactapp/app.json with:"
echo "   \"apiUrl\": \"https://$DOMAIN/api/v1\""
echo ""
echo "🎉 Done! Check the logs with: railway logs --follow"
echo ""

