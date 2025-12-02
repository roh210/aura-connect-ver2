# 🌟 Aura Connect - AI-Powered Peer Wellness Platform

> **Real-time peer support platform connecting stressed students with experienced seniors through AI-assisted chat and voice.**

## ✨ Features

### Student Experience

- 🚀 **Instant Matching** - Connect with a senior in <2 minutes
- 💬 **Real-time Chat** - Text-based conversations with message history
- 🎙️ **Voice Calls** - Seamless voice chat powered by Daily.co
- 🤖 **AI Icebreakers** - Personalized conversation starters
- 🔒 **Safe & Anonymous** - No personal info shared

### Senior Experience

- 🎯 **Smart Availability** - Toggle online status with one tap
- 💡 **AI Response Assistance** - Get suggestion levels (Quick/Guided/Draft)
- 📚 **Technique Coaching** - Real-time counseling tips
- 📊 **Sentiment Tracking** - Live student mood analysis
- 🚨 **Crisis Detection** - Automatic alerts for concerning language

### AI-Powered Tools

- **Icebreaker Generator** - Personalized conversation starters (GPT-4o)
- **Multi-Level Responses** - 3 levels of AI assistance for seniors
- **Counseling Technique Coach** - Active listening, validation, etc.
- **Crisis Detection** - Real-time safety monitoring
- **Sentiment Analysis** - Track conversation mood

## 🚀 Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion  
**Backend:** Node.js, Express, Socket.io, OpenAI API, Daily.co API  
**Database:** Firebase Firestore  
**Auth:** Firebase Authentication

## 📦 Setup

### Prerequisites

- Node.js 18+
- OpenAI API key ([get here](https://platform.openai.com/api-keys))
- Daily.co API key ([get here](https://dashboard.daily.co))
- Firebase project ([create here](https://console.firebase.google.com))

### 1. Clone & Install

```bash
git clone https://github.com/roh210/aura-connect-ver2.git
cd aura-connect-ver2

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Backend Configuration

```bash
cd backend

# Create .env file
OPENAI_API_KEY=your_openai_key
DAILY_API_KEY=your_daily_key
PORT=3000

# Add firebase-key.json
# Download from Firebase Console → Project Settings → Service Accounts
```

### 3. Frontend Configuration

```bash
cd frontend

# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3001** to use the app.

## 🚢 Deployment

### Recommended: Vercel (Frontend) + Render (Backend)

**Backend (Render):**

1. Push to GitHub
2. Create Web Service on [Render](https://render.com)
3. Root directory: `backend`
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables

**Frontend (Vercel):**

1. Import repo on [Vercel](https://vercel.com)
2. Root directory: `frontend`
3. Framework: Next.js (auto-detected)
4. Add environment variables
5. Set `NEXT_PUBLIC_API_URL` to Render backend URL
6. Deploy!

## 🛡️ Safety Features

- ✅ **Crisis Detection** - AI monitors for concerning language
- ✅ **Resource Access** - Crisis hotlines always visible
- ✅ **Anonymous Chat** - No personal info exchange
- ✅ **Voice Recording Consent** - Explicit opt-in required
- ✅ **Session Time Limits** - Prevents burnout

## 📄 License

MIT License

---

**Built for meaningful peer connections 💙**
