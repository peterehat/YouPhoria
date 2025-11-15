# Supabase Database Password Setup

## Password Stored

The Supabase database password has been stored in:
- **Root**: `.env` (for Supabase CLI usage)
- **Backend**: `backend/.env` (for backend services if needed)

**Password**: `LrBXmfzj7OScInWd`

⚠️ **IMPORTANT**: These `.env` files are in `.gitignore` and will NOT be committed to git.

## Using the Password

### Option 1: Use the Helper Script (Recommended)

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo
./supabase-push.sh
```

This script automatically loads the password from `.env` and runs `supabase db push`.

### Option 2: Manual CLI Usage

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo

# Load password from .env
export SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD .env | cut -d '=' -f2)

# Use with Supabase CLI
npx supabase db push --password "$SUPABASE_DB_PASSWORD"
```

### Option 3: Direct Password (Not Recommended)

```bash
npx supabase db push --password LrBXmfzj7OScInWd
```

## Linking Project

If you need to re-link the project:

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo
export SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD .env | cut -d '=' -f2)
npx supabase link --project-ref empmaiqjpyhanrpuabou --password "$SUPABASE_DB_PASSWORD" --skip-pooler
```

## Security Notes

1. ✅ `.env` files are in `.gitignore` - password won't be committed
2. ✅ `supabase/.temp/` is in `.gitignore` - CLI temp files won't be committed
3. ⚠️ Never commit `.env` files to git
4. ⚠️ Never share the password publicly
5. ⚠️ If password is compromised, reset it in Supabase Dashboard

## Resetting Password

If you need to reset the password:

1. Go to: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/settings/database
2. Click "Reset database password"
3. Update the password in `.env` and `backend/.env` files

## Troubleshooting

### CLI Connection Issues

If the CLI still can't connect (network issues), use the SQL Editor instead:
- See: `documentation/RUN_IMPERIAL_MIGRATION.md`

### Password Not Found

If the script can't find the password:
1. Check that `.env` exists in the root directory
2. Verify the line: `SUPABASE_DB_PASSWORD=LrBXmfzj7OScInWd`
3. Make sure there are no extra spaces around the `=`

