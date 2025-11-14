#!/bin/bash

# Update app.json with Railway production URL

echo "📱 Updating Mobile App Configuration"
echo "====================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Please install it first: npm install -g @railway/cli"
    exit 1
fi

# Get Railway domain
cd backend
DOMAIN=$(railway domain 2>/dev/null || echo "")

if [ -z "$DOMAIN" ]; then
    echo "❌ Could not get Railway domain!"
    echo "Make sure you've deployed to Railway first."
    exit 1
fi

cd ..

API_URL="https://$DOMAIN/api/v1"

echo "🌐 Your Railway API URL is:"
echo "   $API_URL"
echo ""

# Backup app.json
cp reactapp/app.json reactapp/app.json.backup
echo "✅ Backed up app.json to app.json.backup"

# Update app.json
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$API_URL\"|g" reactapp/app.json
else
    # Linux
    sed -i "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$API_URL\"|g" reactapp/app.json
fi

echo "✅ Updated reactapp/app.json"
echo ""

# Show the change
echo "📝 New configuration:"
grep -A 1 "apiUrl" reactapp/app.json
echo ""

echo "🎉 Done!"
echo ""
echo "Next steps:"
echo "1. Test locally:"
echo "   cd reactapp && npm start"
echo ""
echo "2. If it works, rebuild for production:"
echo "   eas build --platform ios --profile production"
echo ""
echo "3. Submit to TestFlight:"
echo "   eas submit --platform ios"
echo ""

