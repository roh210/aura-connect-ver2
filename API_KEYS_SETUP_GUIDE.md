# 🔑 API Keys Setup Guide

This guide walks you through obtaining all required API keys for Aura Connect.

---

## 1️⃣ AI API Key (Choose One Option)

**What it's for:** AI features (icebreaker generation, stress analysis, safety moderation)

### **Option A: OpenRouter (RECOMMENDED for MVP) ⭐**

**Why OpenRouter?**

- ✅ **Cheaper:** 10-50% cheaper than OpenAI direct
- ✅ **Free credits:** $5-10 to start (no credit card needed!)
- ✅ **Multiple models:** Access GPT-4, Claude, Gemini, Llama
- ✅ **Better rate limits:** Less likely to hit quotas
- ✅ **Same API format:** Drop-in replacement for OpenAI

**Cost:**

- Free trial: $5-10 credit (lasts 2-4 weeks of development)
- Pay-as-you-go: ~$0.30-1.50 per day during active development
- Production estimate: ~$8-25/month for 1000 active users

**Steps:**

1. **Create OpenRouter Account**

   - Go to: https://openrouter.ai/
   - Click "Sign In" (top right)
   - Sign up with Google/GitHub (instant, no email verification needed)

2. **Get Free Credits**

   - After signup, you automatically get $5-10 free credits
   - No credit card required to start!

3. **Generate API Key**

   - Go to: https://openrouter.ai/keys
   - Click "Create Key"
   - Name it: "Aura Connect Dev"
   - **Copy the key immediately** (starts with `sk-or-v1-...`)

4. **Add to .env file**

   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

   **That's it!** We'll configure the OpenAI SDK to use OpenRouter in our code.

5. **Optional: Add Credits Later**
   - Go to: https://openrouter.ai/credits
   - Add $5-10 when free credits run out
   - Set spending limit to prevent surprise bills

---

### **Option B: OpenAI Direct (If you prefer official API)**

**When to use:**

- You already have OpenAI credits
- You want official OpenAI support
- You don't mind slightly higher prices

**Cost:**

- Free trial: $5 credit (lasts ~1-2 weeks of development)
- Pay-as-you-go: ~$0.50-2.00 per day during active development
- Production estimate: ~$10-30/month for 1000 active users

**Steps:**

1. **Create OpenAI Account**

   - Go to: https://platform.openai.com/signup
   - Sign up with email/Google account

2. **Add Payment Method** (Required after free trial)

   - Go to: https://platform.openai.com/account/billing/overview
   - Add credit card
   - Set spending limit: $10/month (prevents surprise bills)

3. **Generate API Key**

   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it: "Aura Connect Development"
   - **Copy the key immediately** (you can't see it again!)
   - Format: `sk-proj-...` (starts with sk-proj)

4. **Add to .env file**
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   # No BASE_URL needed for direct OpenAI
   ```

---

**My Recommendation:** Use **OpenRouter** for development. It's free to start, cheaper, and you can always switch to OpenAI direct later with zero code changes!

---

## 2️⃣ Daily.co API Key (Required)

**What it's for:** Voice calling infrastructure (HIPAA-compliant audio rooms)

**Cost:**

- Free tier: 10,000 minutes/month (enough for ~100 sessions daily)
- Perfect for MVP/demo

### Steps:

1. **Create Daily.co Account**

   - Go to: https://dashboard.daily.co/signup
   - Sign up (no credit card needed for free tier!)

2. **Navigate to Developers**

   - After signup, go to: https://dashboard.daily.co/developers
   - You'll see your API key already generated

3. **Copy API Key**

   - Click "Show" next to "API Key"
   - Copy the key
   - Format: Long alphanumeric string

4. **Add to .env file**

   ```bash
   DAILY_API_KEY=your-daily-api-key-here
   ```

5. **Note Free Tier Limits:**
   - 10,000 minutes/month
   - 2 concurrent rooms
   - Recording enabled
   - HIPAA compliance included

---

## 3️⃣ Firebase Setup (Required)

**What it's for:** Database (Firestore) and authentication

**Cost:**

- Free tier (Spark Plan):
  - 50K reads/day
  - 20K writes/day
  - 1GB storage
  - Perfect for MVP (handles 500-1000 active users)

### Steps:

1. **Create Firebase Project**

   - Go to: https://console.firebase.google.com
   - Click "Add project"
   - Project name: "aura-connect" (or your choice)
   - Disable Google Analytics (optional for MVP)
   - Click "Create project"

2. **Enable Firestore Database**

   - In Firebase console, click "Firestore Database" in left menu
   - Click "Create database"
   - Choose "Start in production mode"
   - Select location: `us-central` (or closest to you)
   - Click "Enable"

3. **Create Service Account (For Backend)**

   - Go to: Project Settings (gear icon) → Service accounts
   - Click "Generate new private key"
   - Click "Generate key" → Downloads JSON file
   - **Keep this file safe!** (Contains credentials)

4. **Extract Credentials from JSON**

   Open the downloaded JSON file. You'll see something like:

   ```json
   {
     "type": "service_account",
     "project_id": "aura-connect-xxxxx",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@aura-connect-xxxxx.iam.gserviceaccount.com",
     ...
   }
   ```

5. **Add to .env file**

   ```bash
   FIREBASE_PROJECT_ID=aura-connect-xxxxx
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aura-connect-xxxxx.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

   **Important:**

   - Keep the quotes around FIREBASE_PRIVATE_KEY
   - Keep the `\n` characters (they represent newlines)

6. **Optional: Save Full JSON File**
   - Save the downloaded JSON as: `backend/firebase-key.json`
   - Already in .gitignore (won't be committed)
   - Easier to manage than .env variables

---

## 4️⃣ Verify Your .env File

After adding all keys, your `backend/.env` should look like:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=sk-proj-abc123xyz...

# Daily.co
DAILY_API_KEY=abc123xyz...

# Firebase
FIREBASE_PROJECT_ID=aura-connect-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aura-connect-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

---

## 5️⃣ Security Checklist

- [ ] `.env` file is in `.gitignore` (prevents committing to GitHub)
- [ ] Never share API keys in Discord/Slack/screenshots
- [ ] Set OpenAI spending limit ($10/month for development)
- [ ] Firebase service account JSON not committed to git
- [ ] If keys leaked: Regenerate immediately

---

## 🚨 What If I Don't Have a Credit Card?

**For OpenAI:**

- Use the $5 free trial (lasts 1-2 weeks)
- Alternative: Use mock data during development (we can set this up)

**For Daily.co:**

- No credit card needed! Free tier is generous

**For Firebase:**

- No credit card needed for Spark (free) plan

---

## 🧪 Testing API Keys (Next Step)

Once you've added all keys to `.env`, we'll create a test script to verify they work:

```typescript
// We'll build this together next!
// Tests:
// ✅ OpenAI connection
// ✅ Daily.co room creation
// ✅ Firebase database read/write
```

---

## 💡 Cost Estimates (Monthly)

**During Development (1-2 weeks):**

- OpenAI: $5-10 (covered by free trial)
- Daily.co: $0 (free tier)
- Firebase: $0 (free tier)
- **Total: $0-10/month**

**Production (1000 active users):**

- OpenAI: $20-40 (AI features)
- Daily.co: $0 (under 10K minutes)
- Firebase: $0-5 (likely under free tier)
- **Total: $20-45/month**

Very affordable for an MVP! 🚀

---

## ❓ Need Help?

- OpenAI API issues: https://platform.openai.com/docs
- Daily.co support: https://docs.daily.co
- Firebase docs: https://firebase.google.com/docs

**Ready to get your keys? Let me know when you've completed this, and we'll test the connections!**
