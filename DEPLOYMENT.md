# 🚀 Aura Connect - Deployment Guide

This guide walks you through deploying Aura Connect to production using **Render** (backend) and **Vercel** (frontend).

---

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Render account ([render.com](https://render.com))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] OpenAI API key ([platform.openai.com](https://platform.openai.com))
- [ ] Daily.co API key ([dashboard.daily.co](https://dashboard.daily.co))
- [ ] Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- [ ] Code pushed to GitHub (make sure all changes are committed)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (we'll use this in Render)

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select your `aura-connect-ver2` repository
5. Configure the service:

**Basic Settings:**

- **Name**: `aura-connect-backend`
- **Region**: Choose closest to your users (e.g., Oregon)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

**Build Settings:**

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Instance Type:**

- **Free** (for testing) or **Starter** ($7/mo for no cold starts)

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=sk-your-openai-key-here
DAILY_API_KEY=your-daily-key-here
FIREBASE_PROJECT_ID=your-project-id
```

### Step 4: Add Firebase Service Account as File

1. In Render dashboard, go to **Environment** → **Secret Files**
2. Click **Add Secret File**
3. **Filename**: `firebase-key.json`
4. **Contents**: Paste the entire JSON from Step 1
5. Save

### Step 5: Deploy

1. Click **Create Web Service**
2. Render will automatically deploy
3. Wait 5-10 minutes for build to complete
4. Once deployed, you'll get a URL like: `https://aura-connect-backend.onrender.com`
5. **SAVE THIS URL** - you'll need it for frontend deployment

### Step 6: Test Backend

Visit: `https://your-backend-url.onrender.com/health`

You should see:

```json
{
  "status": "ok",
  "timestamp": "2025-12-02T..."
}
```

✅ Backend is live!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Environment Variables

You'll need these values:

- Backend URL from Render (from Part 1, Step 5)
- Firebase config from [Firebase Console](https://console.firebase.google.com) → Project Settings → General → Your apps → SDK setup

Create a `.env.production` file in `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project root
cd aura_connect_ver2

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - What's your project name? aura-connect
# - In which directory is your code? ./frontend
# - Want to override settings? No
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Add Environment Variables in Vercel

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add all variables from `.env.production`:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. Set environment: **Production, Preview, Development** (all three)

### Step 4: Redeploy with Environment Variables

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Wait for build to complete (2-3 minutes)
4. You'll get a URL like: `https://aura-connect.vercel.app`

✅ Frontend is live!

---

## Part 3: Connect Frontend & Backend

### Step 1: Update CORS in Backend

Your backend needs to allow requests from your Vercel domain.

1. Go to Render dashboard
2. Open your backend service
3. Go to **Environment** tab
4. Add new environment variable:
   ```
   ALLOWED_ORIGINS=https://aura-connect.vercel.app,https://aura-connect-*.vercel.app
   ```
5. Save and wait for auto-redeploy

### Step 2: Update Backend Code (if needed)

Check `backend/src/server.ts` has this CORS config:

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3001",
  "https://aura-connect.vercel.app",
  "https://aura-connect-*.vercel.app",
];
```

If you need to update, commit and push - Render will auto-deploy.

### Step 3: Test the Connection

1. Visit your Vercel URL: `https://aura-connect.vercel.app`
2. Try to sign up or login
3. Check browser console for errors
4. Check Render logs for backend errors

**Common Issues:**

- **CORS Error**: Check ALLOWED_ORIGINS in Render
- **Cannot connect to backend**: Check NEXT_PUBLIC_API_URL in Vercel
- **Firebase errors**: Check Firebase config vars in Vercel
- **WebSocket fails**: Render free tier has 30s timeout (upgrade to paid)

---

## Part 4: Production Checklist

### Security

- [ ] API keys are in environment variables (not in code)
- [ ] Firebase rules restrict access
- [ ] CORS only allows your domains
- [ ] HTTPS enabled (automatic on Vercel/Render)

### Performance

- [ ] Backend on paid plan (no cold starts) OR accept 30s initial delay
- [ ] Frontend on Vercel edge network (automatic)
- [ ] Images optimized with Next.js Image component

### Monitoring

- [ ] Check Render logs for backend errors
- [ ] Check Vercel logs for frontend errors
- [ ] Set up Render health check alerts
- [ ] Monitor OpenAI API usage/costs

### Testing

- [ ] Test signup/login flow
- [ ] Test student finding senior
- [ ] Test senior accepting request
- [ ] Test chat messages
- [ ] Test voice calling
- [ ] Test AI features (icebreaker, suggestions)
- [ ] Test on mobile device
- [ ] Test with slow internet

---

## Part 5: Post-Deployment

### Custom Domain (Optional)

**Vercel:**

1. Buy domain (e.g., Namecheap, GoDaddy)
2. In Vercel: Settings → Domains → Add
3. Follow DNS instructions

**Render:**

1. Settings → Custom Domain
2. Add domain
3. Update DNS records

### Set Up Monitoring

**Render:**

- Notifications → Add email for deploy failures
- Check logs daily: Dashboard → Logs

**Vercel:**

- Analytics enabled by default
- Check usage: Project → Analytics

**OpenAI:**

- Monitor usage: [platform.openai.com/usage](https://platform.openai.com/usage)
- Set spending limits

### Scaling Considerations

**When to upgrade Render:**

- Backend responds slowly (cold starts)
- Consistent traffic (>100 users/day)
- Need background workers

**Cost Estimates:**

- Render Starter: $7/mo (always-on)
- Vercel Pro: $20/mo (if needed, usually free tier enough)
- OpenAI: ~$0.01 per session (20 sessions = $0.20)
- Daily.co: Free up to 10,000 minutes/month

---

## Troubleshooting

### Backend Won't Start

**Check Render Logs:**

```
Deploy Logs → Look for errors
Common issues:
  - Missing environment variable
  - firebase-key.json not found
  - npm install failed
```

**Fix:**

- Verify all env vars are set
- Check firebase-key.json in Secret Files
- Try manual deploy

### Frontend Build Fails

**Check Vercel Logs:**

```
Common issues:
  - Missing NEXT_PUBLIC_ vars
  - TypeScript errors
  - Module not found
```

**Fix:**

- Add all env vars in Vercel
- Check code pushed to GitHub
- Try local build: `npm run build`

### CORS Errors

**Symptoms:**

```
Access to fetch at 'https://backend.onrender.com/api/...'
from origin 'https://frontend.vercel.app' has been blocked by CORS
```

**Fix:**

1. Add Vercel URL to ALLOWED_ORIGINS in Render
2. Redeploy backend
3. Clear browser cache

### WebSocket Connection Fails

**Symptoms:**

```
Socket.io connection timeout
Cannot send messages
```

**Fix:**

- Render free tier has 30s idle timeout
- Upgrade to Starter plan ($7/mo)
- OR implement reconnection logic (already in code)

### AI Features Not Working

**Check:**

- OpenAI API key valid: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- API key in Render environment variables
- OpenAI account has credits
- Check backend logs for API errors

---

## Useful Commands

**Redeploy Backend:**

```bash
# Trigger manual deploy in Render
# Or commit + push to GitHub (auto-deploys)
git add .
git commit -m "Update backend"
git push
```

**Redeploy Frontend:**

```bash
# From project root
vercel --prod

# Or commit + push (auto-deploys)
git add .
git commit -m "Update frontend"
git push
```

**Check Logs:**

```bash
# Backend (Render)
# Dashboard → Your Service → Logs

# Frontend (Vercel)
vercel logs
# Or Dashboard → Deployments → View Function Logs
```

**Rollback Deployment:**

```bash
# Vercel: Dashboard → Deployments → Previous deploy → Promote to Production
# Render: Dashboard → Deploys → Redeploy (select previous)
```

---

## URLs to Save

**Production:**

- Frontend: `https://aura-connect.vercel.app`
- Backend: `https://aura-connect-backend.onrender.com`

**Dashboards:**

- Vercel: [vercel.com/dashboard](https://vercel.com/dashboard)
- Render: [dashboard.render.com](https://dashboard.render.com)
- Firebase: [console.firebase.google.com](https://console.firebase.google.com)
- OpenAI: [platform.openai.com](https://platform.openai.com)
- Daily.co: [dashboard.daily.co](https://dashboard.daily.co)

---

## Next Steps

1. ✅ Share your live URL with users!
2. 📊 Monitor usage and errors
3. 🐛 Fix bugs as they appear
4. 🚀 Add new features based on feedback
5. 💰 Monitor costs (OpenAI, Render)

**Congratulations! Your app is live! 🎉**
