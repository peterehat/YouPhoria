#!/bin/bash
# Helper script to push Supabase migrations using the stored database password

# Load password from .env file
if [ -f .env ]; then
  export SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD .env | cut -d '=' -f2)
fi

# If password not found in root .env, try backend/.env
if [ -z "$SUPABASE_DB_PASSWORD" ] && [ -f backend/.env ]; then
  export SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD backend/.env | cut -d '=' -f2)
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD not found in .env files"
  echo "Please add SUPABASE_DB_PASSWORD=your_password to .env or backend/.env"
  exit 1
fi

# Push migrations (auto-confirm prompts)
echo "🚀 Pushing Supabase migrations..."
echo "Y" | npx supabase db push --password "$SUPABASE_DB_PASSWORD" "$@"

