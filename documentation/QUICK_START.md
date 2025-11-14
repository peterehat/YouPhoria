# ⚡ QUICK START - Deploy to Production

## 🎯 One Command to Rule Them All

```bash
cd /Users/peterehat/Documents/Work/YouPhoria/Monorepo
./deploy-to-production.sh
```

That's it! The script handles everything.

---

## 📝 What You'll Be Asked For

### 1. Railway Login
- Browser will open
- Sign up/login with GitHub
- Return to terminal

### 2. Project Name
- Enter: `youphoria-backend`
- Press Enter

### 3. Supabase Service Role Key
Get it here: https://supabase.com/dashboard
- Settings → API → Copy `service_role` key
- Paste into terminal (won't show while typing)
- Press Enter

### 4. Gemini API Key
Get it here: https://makersuite.google.com/app/apikey
- Create API key
- Copy it
- Paste into terminal (won't show while typing)
- Press Enter

---

## ⏱️ Timeline

- **0:00** - Start script
- **0:30** - Railway login (browser)
- **1:00** - Deployment starts
- **3:00** - Deployment completes
- **3:30** - Enter API keys
- **4:00** - Environment variables set
- **4:30** - Service restarts
- **5:00** - Backend tested
- **5:30** - App.json updated
- **✅ DONE!**

---

## ✅ Success Looks Like This

```
🎉 Deployment Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Backend deployed to Railway
✅ Environment variables configured
✅ Mobile app configuration updated

Your production API URL:
  https://youphoria-backend-production-abc123.up.railway.app/api/v1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Test It

```bash
cd reactapp
npm start
```

Open app → Insights → Ask a question → Should work! ✅

---

## 🚀 Deploy to TestFlight

```bash
cd reactapp
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 🆘 Need Help?

```bash
# View logs
cd backend && railway logs --follow

# View dashboard
cd backend && railway open

# Test backend
curl https://YOUR_URL/api/v1/health
```

---

## 📚 More Info

- `DEPLOYMENT_README.md` - Detailed guide
- `documentation/` - All documentation

---

**Ready? Run this:**

```bash
./deploy-to-production.sh
```

