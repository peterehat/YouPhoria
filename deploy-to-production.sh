#!/bin/bash

# Master Deployment Script
# This script deploys the You-i backend to Railway and updates the mobile app

set -e  # Exit on error

echo "🚀 You-i Production Deployment"
echo "=============================="
echo ""
echo "This script will:"
echo "  1. Install Railway CLI (if needed)"
echo "  2. Login to Railway"
echo "  3. Deploy backend"
echo "  4. Set environment variables"
echo "  5. Update mobile app configuration"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Step 1: Check/Install Railway CLI
echo "📦 Step 1: Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi
echo ""

# Step 2: Login
echo "🔐 Step 2: Login to Railway..."
if ! railway whoami &> /dev/null; then
    echo "Opening browser for authentication..."
    railway login
else
    echo "✅ Already logged in"
fi
echo ""

# Step 3: Deploy Backend
echo "🚀 Step 3: Deploying backend..."
cd backend

if [ ! -f ".railway" ]; then
    echo "Initializing Railway project..."
    railway init
fi

echo "Deploying to Railway (this takes 2-3 minutes)..."
railway up
echo "✅ Backend deployed"
echo ""

# Step 4: Set Environment Variables
echo "🔐 Step 4: Setting environment variables..."
echo ""
echo "You need 2 API keys:"
echo ""
echo "1. Supabase Service Role Key:"
echo "   → Open: https://supabase.com/dashboard"
echo "   → Select project: empmaiqjpyhanrpuabou"
echo "   → Settings → API → Copy 'service_role' key"
echo ""
echo "2. Gemini API Key:"
echo "   → Open: https://makersuite.google.com/app/apikey"
echo "   → Create API key → Copy it"
echo ""
read -p "Press Enter when you have both keys ready..."
echo ""

echo "Enter Supabase Service Role Key:"
read -s SUPABASE_KEY
echo ""

echo "Enter Gemini API Key:"
read -s GEMINI_KEY
echo ""

echo "Setting variables..."
railway variables set SUPABASE_URL=https://empmaiqjpyhanrpuabou.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_KEY"
railway variables set GEMINI_API_KEY="$GEMINI_KEY"
railway variables set NODE_ENV=production

echo "✅ Environment variables set"
echo ""

echo "Restarting service..."
railway restart
echo "✅ Service restarted"
echo ""

# Wait for restart
echo "Waiting 30 seconds for service to restart..."
sleep 30
echo ""

# Step 5: Get URL and test
echo "🌐 Step 5: Getting production URL..."
DOMAIN=$(railway domain 2>/dev/null || echo "")

if [ -z "$DOMAIN" ]; then
    echo "Generating domain..."
    railway domain
    DOMAIN=$(railway domain 2>/dev/null || echo "")
fi

API_URL="https://$DOMAIN/api/v1"
echo "✅ Your API URL: $API_URL"
echo ""

# Test backend
echo "🧪 Testing backend..."
HEALTH_CHECK=$(curl -s "$API_URL/health" || echo "")

if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ Backend is healthy!"
    echo "$HEALTH_CHECK"
else
    echo "⚠️  Health check failed. Response:"
    echo "$HEALTH_CHECK"
    echo ""
    echo "Check logs with: cd backend && railway logs"
    exit 1
fi
echo ""

# Step 6: Update mobile app
echo "📱 Step 6: Updating mobile app configuration..."
cd ..

# Backup
cp reactapp/app.json reactapp/app.json.backup
echo "✅ Backed up app.json"

# Update
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$API_URL\"|g" reactapp/app.json
else
    sed -i "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$API_URL\"|g" reactapp/app.json
fi

echo "✅ Updated app.json with production URL"
echo ""

# Show result
echo "📝 New configuration:"
grep -A 1 "apiUrl" reactapp/app.json
echo ""

# Final steps
echo "🎉 Deployment Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend deployed to Railway"
echo "✅ Environment variables configured"
echo "✅ Mobile app configuration updated"
echo ""
echo "Your production API URL:"
echo "  $API_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Test locally first:"
echo "   cd reactapp"
echo "   npm start"
echo "   → Open app on phone"
echo "   → Go to Insights → Try chat"
echo ""
echo "2. If it works, rebuild for production:"
echo "   eas build --platform ios --profile production"
echo ""
echo "3. Submit to TestFlight:"
echo "   eas submit --platform ios"
echo ""
echo "📊 Useful Commands:"
echo ""
echo "  View logs:      cd backend && railway logs --follow"
echo "  View dashboard: cd backend && railway open"
echo "  Test backend:   curl $API_URL/health"
echo ""
echo "🎉 You're all set!"
echo ""

