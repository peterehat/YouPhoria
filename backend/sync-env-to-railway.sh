#!/bin/bash

# Sync .env file to Railway environment variables

set -e

echo "🔐 Syncing .env to Railway"
echo "=========================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file in the backend directory"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Please install it: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway!"
    echo "Please run: railway login"
    exit 1
fi

echo "📝 Reading .env file..."
echo ""

# Read .env and set variables
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" ]] || [[ "$key" =~ ^#.* ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Skip if value is empty
    if [[ -z "$value" ]]; then
        continue
    fi
    
    echo "Setting $key..."
    railway variables --set "$key=$value"
    
done < .env

echo ""
echo "✅ All environment variables synced!"
echo ""

# Verify
echo "🔍 Verifying variables..."
echo ""
railway variables
echo ""

# Restart
echo "🔄 Restarting service..."
railway restart
echo ""

echo "✅ Done! Your backend should start in ~30 seconds."
echo ""
echo "Check status with: railway logs --follow"
echo ""

