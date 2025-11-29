# Aura Connect - Complete Project Roadmap 🗺️

**Project:** AI-Powered Wellness Platform (Student-Senior Real-Time Matching)  
**Last Updated:** November 20, 2025  
**Current Status:** Phase 2 Complete ✅ | Backend 100% Built

---

## 📊 Project Overview

### What We're Building

A real-time wellness platform that matches college students with senior volunteers for mental health support through:

- **AI-powered conversations** (OpenAI GPT-4)
- **Live voice calls** (Daily.co WebRTC)
- **Real-time matching** (Socket.io)
- **Automated safety monitoring** (AI stress detection)
- **Session management** (Firebase Firestore)

### Tech Stack

**Backend:** Node.js, Express, TypeScript, Socket.io, Firebase  
**Frontend:** Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui, Socket.io-client  
**AI:** OpenAI (GPT-4o, Whisper)  
**Voice:** Daily.co (HIPAA-compliant WebRTC)  
**Database:** Firebase Firestore  
**Deployment:** Railway/Render (backend), Vercel (frontend)

---

## ✅ COMPLETED PHASES

### Phase 1: Project Foundation ✅

**Duration:** 1 hour  
**Commit:** `Initial project setup with backend structure`

**Deliverables:**

- Git repository initialized
- Project folder structure created
- README.md with project vision
- .gitignore configured
- Backend folder structure:
  ```
  backend/
  ├── src/
  │   ├── config/
  │   ├── controllers/
  │   ├── routes/
  │   ├── services/
  │   └── middleware/
  └── package.json
  ```

---

### Phase 2: Backend Development ✅

**Total Duration:** ~12-15 hours  
**Status:** Complete and committed (732a9ef)

#### Phase 2.1: API Keys Setup ✅

**Duration:** 30 minutes  
**Files:** `.env`, `backend/.env.example`, `firebase-key.json`

**Completed:**

- OpenRouter API key configured
- Daily.co API key configured
- Firebase service account credentials
- Environment variable validation

---

#### Phase 2.2: Configuration Layer ✅

**Duration:** 1.5 hours  
**Files Created:**

- `backend/src/config/env.ts` - Environment validation
- `backend/src/config/logger.ts` - Winston logging setup
- `backend/src/config/firebase.ts` - Firestore initialization
- `backend/src/config/index.ts` - Centralized exports

**Completed:**

- Type-safe environment variables
- Structured logging (info, warn, error)
- Firebase Admin SDK initialization
- Config validation on startup

---

#### Phase 2.3: Configuration Testing ✅

**Duration:** 1 hour  
**Files:** `backend/src/config/test-config.ts`

**Completed:**

- Environment variable validation tests
- Firebase connection verification
- OpenRouter API connectivity test
- Daily.co API connectivity test
- Logger functionality verification

---

#### Phase 2.4: OpenAI Router Service ✅

**Duration:** 3 hours  
**Files Created:**

- `backend/src/services/openai.service.ts` (500+ lines)
- `backend/src/services/openai.service.test.ts`

**AI Functions Implemented:**

1. `generateIcebreaker()` - Conversation starters
2. `analyzeStressLevel()` - Sentiment analysis (1-10 scale)
3. `checkSafety()` - Crisis detection (self-harm, suicide)
4. `generateIntervention()` - Crisis response suggestions
5. `transcribeAudio()` - Whisper audio transcription

**Models Used:**

- GPT-4o: Icebreakers, stress analysis, safety checks
- GPT-3.5 Turbo: Intervention suggestions
- Whisper: Audio transcription

---

#### Phase 2.5: Daily.co Voice Service ✅

**Duration:** 2 hours  
**Files Created:**

- `backend/src/services/daily.service.ts` (350+ lines)
- `backend/src/services/daily.service.test.ts`

**Voice Functions Implemented:**

1. `createRoom()` - Create WebRTC room with HIPAA compliance
2. `getToken()` - Generate user access tokens
3. `deleteRoom()` - Clean up rooms after sessions
4. `getRoomInfo()` - Fetch room details
5. `listRooms()` - Admin room management

**Features:**

- HIPAA-compliant rooms
- Configurable privacy settings
- Token-based access control
- Automatic room expiration (1 hour)

---

#### Phase 2.6: Express REST API Server ✅

**Duration:** 3 hours  
**Files Created:**

- `backend/src/server.ts` - Express app with middleware
- `backend/src/routes/session.routes.ts` - Session endpoints
- `backend/src/routes/ai.routes.ts` - AI endpoints
- `backend/src/routes/voice.routes.ts` - Voice endpoints
- `backend/src/controllers/session.controller.ts` - Session logic
- `backend/src/controllers/ai.controller.ts` - AI logic
- `backend/src/controllers/voice.controller.ts` - Voice logic
- `backend/src/middleware/validation.ts` - Request validation

**REST Endpoints:**

```
POST   /api/sessions              - Create session
GET    /api/sessions/:id          - Get session details
PATCH  /api/sessions/:id          - Update session
DELETE /api/sessions/:id          - End session

POST   /api/ai/icebreaker         - Generate icebreaker
POST   /api/ai/stress-analysis    - Analyze stress level
POST   /api/ai/safety-check       - Check conversation safety
POST   /api/ai/intervention       - Get intervention suggestions
POST   /api/ai/transcribe         - Transcribe audio

POST   /api/voice/room            - Create voice room
GET    /api/voice/room/:roomId    - Get room info
POST   /api/voice/token           - Generate access token
DELETE /api/voice/room/:roomId    - Delete room
```

**Middleware:**

- CORS enabled
- JSON body parsing
- Request logging
- Error handling

---

#### Phase 2.7: WebSocket & Real-Time Matching ✅

**Duration:** 4 hours  
**Commit:** `Implement backend API with OpenAI, Daily.co integration and real-time WebSocket matching system with automatic session management`

**Files Created:**

- `backend/src/services/socket.service.ts` (200+ lines)
- `backend/src/services/matching.service.ts` (150+ lines)
- `backend/src/services/socket.handlers.ts` (630+ lines)
- `backend/src/services/session-cleanup.service.ts` (340+ lines)
- `backend/socket-test.html` (450+ lines)

**Files Modified:**

- `backend/src/server.ts` - Added HTTP server + Socket.io
- `backend/package.json` - Added socket.io dependencies

**WebSocket Events:**

```
Client → Server:
  - identify              - User role identification
  - student_join_queue    - Student enters matching queue
  - senior_available      - Senior marks themselves available
  - senior_accept         - Senior accepts match request
  - session_start         - Confirm session is active
  - safety_alert          - Report safety concern
  - join_admin_room       - Subscribe to live stats
  - end_session           - Manually end session
  - disconnect            - User disconnects

Server → Client:
  - queue_update          - Queue position/wait time
  - available_seniors     - Senior pool notification
  - match_request         - New match available (to senior)
  - session_matched       - Match confirmed (to both)
  - partner_disconnected  - Partner left session
  - session_ended         - Session terminated
  - live_stats            - Admin dashboard statistics
```

**Matching Algorithm:**

- FIFO queue for students
- Fair senior rotation
- Instant match notifications
- Position tracking
- Wait time estimation

**Session Cleanup:**

- Expire sessions after 1 hour (no activity)
- Clean abandoned sessions (never joined after 10 min)
- Delete old sessions (30+ days)
- Preserve safety-flagged sessions forever
- Runs automatically (scheduled intervals)

**Live Admin Dashboard:**

- Active students count
- Active seniors count
- Active sessions count
- Queue size
- Updates every 10 seconds

---

## 🚧 REMAINING PHASES

### Phase 3: Frontend Foundation

**Estimated Duration:** 4-6 hours  
**Goal:** Set up Next.js 14 project with App Router and UI framework

#### Phase 3.1: Initialize Next.js Project ⏳

**Duration:** 30 minutes  
**Commit:** `Initialize Next.js frontend with TypeScript and App Router`

**Tasks:**

- [ ] Create Next.js 14 + TypeScript project
- [ ] Configure `next.config.js`
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Clean up default files
- [ ] Test dev server (`npm run dev`)

**Commands:**

```powershell
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
npm install
npm run dev
```

**Deliverables:**

- `frontend/` folder with Next.js app
- `frontend/package.json` configured
- `frontend/next.config.js` with API rewrites to backend
- `frontend/tsconfig.json` with strict typing
- `app/` directory structure (App Router)

---

#### Phase 3.2: Install Dependencies ⏳

**Duration:** 30 minutes  
**Commit:** `Add frontend dependencies (Socket.io, Daily.co, Zustand, shadcn/ui)`

**Tasks:**

- [ ] Install Socket.io-client
- [ ] Install Daily.co SDK
- [ ] Install Zustand (state management)
- [ ] Install Framer Motion (animations)
- [ ] Initialize shadcn/ui
- [ ] Configure `tailwind.config.js` for shadcn
- [ ] Add custom theme colors

**Dependencies:**

```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1",
    "@daily-co/daily-react": "^0.59.0",
    "zustand": "^4.4.7",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.294.0"
  }
}
```

**shadcn/ui Setup:**

```powershell
npx shadcn-ui@latest init
```

**Deliverables:**

- TailwindCSS configured with shadcn theme
- Socket.io-client ready for WebSocket
- Daily.co SDK installed
- Zustand store structure created
- shadcn/ui components ready to use

---

#### Phase 3.3: Project Structure & Routing ⏳

**Duration:** 1 hour  
**Commit:** `Set up Next.js App Router structure and folder organization`

**Tasks:**

- [ ] Create folder structure:
  ```
  frontend/
  ├── app/                    # Next.js App Router
  │   ├── layout.tsx         # Root layout
  │   ├── page.tsx           # Home page
  │   ├── globals.css        # Global styles
  │   ├── providers.tsx      # Client providers
  │   ├── student/
  │   │   └── page.tsx       # Student dashboard
  │   ├── senior/
  │   │   └── page.tsx       # Senior dashboard
  │   ├── session/
  │   │   └── [id]/
  │   │       └── page.tsx   # Session page (dynamic)
  │   ├── admin/
  │   │   └── page.tsx       # Admin dashboard
  │   └── auth/
  │       ├── login/
  │       │   └── page.tsx   # Login page
  │       └── signup/
  │           └── page.tsx   # Signup page
  ├── components/            # Reusable components
  ├── hooks/                 # Custom React hooks
  ├── lib/                   # Utilities & config
  │   ├── socket.ts         # Socket.io client
  │   ├── firebase.ts       # Firebase config
  │   └── utils.ts          # Helper functions
  └── stores/               # Zustand stores
  ```
- [ ] Configure Next.js routing (file-based)
- [ ] Create `providers.tsx` for client-side context
- [ ] Test navigation between pages

**Next.js App Router Benefits:**

- Server components by default
- Built-in layouts
- Automatic code splitting
- File-based routing

**Deliverables:**

- Complete App Router structure
- All route pages created
- Client providers configured
- Navigation working

---

#### Phase 3.4: Authentication UI ⏳

**Duration:** 2 hours  
**Commit:** `Implement authentication UI components`

**Tasks:**

- [ ] Create `LoginPage.tsx`
- [ ] Create `SignupPage.tsx`
- [ ] Create `AuthForm.tsx` component
- [ ] Add email/password inputs
- [ ] Add role selection (Student/Senior/Admin)
- [ ] Add form validation
- [ ] Style with TailwindCSS
- [ ] Add loading states

**Deliverables:**

- Login page with form
- Signup page with role selection
- Form validation (email format, password strength)
- Responsive design (mobile-friendly)

---

### Phase 4: Core UI Components

**Estimated Duration:** 6-8 hours  
**Goal:** Build main dashboard interfaces for all user types

#### Phase 4.1: Student Dashboard UI ⏳

**Duration:** 2 hours  
**Commit:** `Create student dashboard UI`

**Tasks:**

- [ ] Create `StudentDashboard.tsx` page
- [ ] Add "Find a Senior" button
- [ ] Display queue status (position, wait time)
- [ ] Show "Connecting..." state
- [ ] Show "Matched!" notification
- [ ] Add loading animations
- [ ] Style with TailwindCSS
- [ ] Make responsive

**UI Components:**

- Hero section with welcome message
- Large CTA button "Start Conversation"
- Queue status card:
  - Position in queue
  - Estimated wait time
  - Number of active seniors
- Loading spinner when matching
- Success animation on match

**Deliverables:**

- Student dashboard with all states
- Queue position display
- Match notification UI
- Responsive mobile layout

---

#### Phase 4.2: Senior Dashboard UI ⏳

**Duration:** 2 hours  
**Commit:** `Create senior dashboard UI`

**Tasks:**

- [ ] Create `SeniorDashboard.tsx` page
- [ ] Add "Available" toggle switch
- [ ] Show incoming match requests
- [ ] Add Accept/Decline buttons
- [ ] Display student info (name, brief intro)
- [ ] Show queue statistics
- [ ] Add notification sounds (optional)
- [ ] Style with TailwindCSS

**UI Components:**

- Availability toggle (large, prominent)
- Match request card:
  - Student name
  - Estimated conversation topic
  - Accept/Decline buttons
- Statistics section:
  - Students waiting
  - Your sessions today
  - Average session time
- History of past sessions

**Deliverables:**

- Senior dashboard with toggle
- Match request notifications
- Accept/Decline flow
- Session statistics display

---

#### Phase 4.3: Session/Call Interface ⏳

**Duration:** 3 hours  
**Commit:** `Implement call interface UI`

**Tasks:**

- [ ] Create `SessionPage.tsx`
- [ ] Add video/voice call container
- [ ] Create control panel:
  - Mute/unmute button
  - Video on/off toggle
  - End call button
- [ ] Add session timer
- [ ] Display partner info
- [ ] Show AI-generated icebreaker
- [ ] Add emergency/safety button
- [ ] Style call interface

**UI Components:**

- Full-screen call interface
- Partner video/avatar display
- Bottom control bar:
  - Microphone toggle
  - Camera toggle (if video)
  - End session button (red)
  - Safety alert button (yellow)
- Top info bar:
  - Session timer
  - Partner name
  - Connection quality indicator
- Icebreaker suggestion card (dismissible)

**Deliverables:**

- Session page with call container
- Control buttons functional (UI only)
- Timer display
- Icebreaker display
- Safety alert UI

---

#### Phase 4.4: Admin Dashboard ⏳

**Duration:** 1 hour  
**Commit:** `Create admin dashboard UI`

**Tasks:**

- [ ] Create `AdminDashboard.tsx`
- [ ] Display live statistics cards:
  - Active students
  - Active seniors
  - Active sessions
  - Queue size
  - Total sessions today
- [ ] Create sessions table (active sessions)
- [ ] Add real-time updates (Socket.io)
- [ ] Style with data visualization

**UI Components:**

- Statistics cards (4-5 cards in grid)
- Active sessions table:
  - Session ID
  - Student name
  - Senior name
  - Duration
  - Status
- Real-time updates (auto-refresh every 10s)
- Charts/graphs (optional)

**Deliverables:**

- Admin dashboard with live stats
- Sessions table
- Auto-updating data
- Clean data visualization

---

### Phase 5: WebSocket Integration

**Estimated Duration:** 4-6 hours  
**Goal:** Connect frontend to backend WebSocket server

#### Phase 5.1: Socket.io Client Setup ⏳

**Duration:** 1 hour  
**Commit:** `Set up Socket.io client connection`

**Tasks:**

- [ ] Create `services/socket.service.ts`
- [ ] Initialize Socket.io client
- [ ] Add connection event handlers
- [ ] Implement auto-reconnect logic
- [ ] Create connection status hook
- [ ] Add error handling
- [ ] Test connection to backend

**Code Structure:**

```typescript
// services/socket.service.ts
export class SocketService {
  private socket: Socket;

  connect(userId: string, role: "student" | "senior" | "admin") {
    // Connect to ws://localhost:5000
    // Emit 'identify' event
  }

  onQueueUpdate(callback: (data) => void) {}
  onMatchRequest(callback: (data) => void) {}
  onSessionMatched(callback: (data) => void) {}
  // ... other event listeners
}
```

**Deliverables:**

- Socket service class
- Connection management
- Event listener methods
- React hook: `useSocket()`
- Connection status indicator

---

#### Phase 5.2: Student Flow Integration ⏳

**Duration:** 2 hours  
**Commit:** `Integrate student WebSocket flow`

**Tasks:**

- [ ] Connect "Find a Senior" button to `student_join_queue` event
- [ ] Listen for `queue_update` events
- [ ] Update UI with queue position
- [ ] Listen for `session_matched` event
- [ ] Navigate to session page on match
- [ ] Handle disconnect scenarios
- [ ] Add error notifications

**Event Flow:**

```
1. Student clicks "Find a Senior"
   → Emit: student_join_queue

2. Receive: queue_update
   → Update position/wait time in UI

3. Receive: session_matched
   → Show "Match found!" notification
   → Navigate to /session/:sessionId
```

**Deliverables:**

- Join queue functionality
- Real-time queue updates
- Match notification
- Auto-navigation to session

---

#### Phase 5.3: Senior Flow Integration ⏳

**Duration:** 2 hours  
**Commit:** `Integrate senior WebSocket flow`

**Tasks:**

- [ ] Connect availability toggle to `senior_available` event
- [ ] Listen for `match_request` events
- [ ] Display match request notification
- [ ] Connect Accept button to `senior_accept` event
- [ ] Handle Decline action (remove from queue)
- [ ] Listen for `session_matched` confirmation
- [ ] Navigate to session page on accept
- [ ] Add error handling

**Event Flow:**

```
1. Senior toggles "Available"
   → Emit: senior_available

2. Receive: match_request
   → Show student match card

3. Senior clicks "Accept"
   → Emit: senior_accept { studentId, matchRequestId }

4. Receive: session_matched
   → Navigate to /session/:sessionId
```

**Deliverables:**

- Availability toggle working
- Match request notifications
- Accept/Decline functionality
- Auto-navigation to session

---

#### Phase 5.4: Real-Time Updates ⏳

**Duration:** 1 hour  
**Commit:** `Add real-time status updates`

**Tasks:**

- [ ] Connect admin dashboard to `live_stats` event
- [ ] Update statistics every 10 seconds
- [ ] Add session status updates
- [ ] Implement partner disconnect notifications
- [ ] Add session end event handling
- [ ] Create notification system

**Deliverables:**

- Admin live statistics working
- Real-time session updates
- Disconnect notifications
- Toast/notification component

---

### Phase 6: Daily.co Voice Integration

**Estimated Duration:** 3-4 hours  
**Goal:** Add video/voice calling functionality

#### Phase 6.1: Install Daily.co React SDK ⏳

**Duration:** 30 minutes  
**Commit:** `Add Daily.co video SDK`

**Tasks:**

- [ ] Install `@daily-co/daily-react`
- [ ] Install `@daily-co/daily-js`
- [ ] Configure Daily provider
- [ ] Create basic call component
- [ ] Test with test room

**Dependencies:**

```bash
npm install @daily-co/daily-react @daily-co/daily-js
```

**Deliverables:**

- Daily.co SDK installed
- Provider configured in App.tsx
- Basic call component created

---

#### Phase 6.2: Call Component Implementation ⏳

**Duration:** 2 hours  
**Commit:** `Implement Daily.co call component`

**Tasks:**

- [ ] Create `VideoCall.tsx` component
- [ ] Implement `joinCall(roomUrl, token)`
- [ ] Add mute/unmute audio control
- [ ] Add video on/off control
- [ ] Add `leaveCall()` function
- [ ] Display local/remote video
- [ ] Handle connection errors
- [ ] Style call interface

**Daily.co Hooks:**

```typescript
import {
  useDaily,
  useLocalParticipant,
  useParticipantIds,
} from "@daily-co/daily-react";

const { joinCall, leaveCall } = useDaily();
const localParticipant = useLocalParticipant();
const remoteParticipantIds = useParticipantIds({ filter: "remote" });
```

**Deliverables:**

- Working video call component
- Mute/unmute controls
- Video toggle
- Leave call button
- Audio/video streams displaying

---

#### Phase 6.3: Session Coordination ⏳

**Duration:** 1 hour  
**Commit:** `Connect voice calls to session management`

**Tasks:**

- [ ] Fetch room URL and token from backend
- [ ] Auto-join call on session match
- [ ] Link session ID to voice room
- [ ] Handle call disconnect → session end
- [ ] Update session status on call start
- [ ] Clean up room on session end
- [ ] Add reconnection logic

**API Integration:**

```typescript
// When session_matched received:
1. GET /api/sessions/:sessionId → fetch roomUrl
2. POST /api/voice/token → get access token
3. joinCall(roomUrl, token)
4. Emit: session_start (confirm active)
```

**Deliverables:**

- Auto-join call on match
- Session linked to voice room
- Clean disconnect handling
- Session status updates

---

### Phase 7: Firebase Authentication

**Estimated Duration:** 2-3 hours  
**Goal:** Add user authentication and role management

#### Phase 7.1: Firebase Auth Setup ⏳

**Duration:** 1 hour  
**Commit:** `Set up Firebase authentication`

**Tasks:**

- [ ] Install Firebase SDK (`firebase`)
- [ ] Configure Firebase in frontend
- [ ] Initialize Firebase Auth
- [ ] Create auth service:
  - `signUp(email, password, role)`
  - `signIn(email, password)`
  - `signOut()`
  - `getCurrentUser()`
- [ ] Store user role in Firestore
- [ ] Create auth context/store

**Firebase Config:**

```typescript
// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "...",
  projectId: "...",
};

export const auth = getAuth(app);
```

**Deliverables:**

- Firebase initialized
- Auth service created
- Sign up/sign in working
- User role stored in Firestore
- Auth state persisted

---

#### Phase 7.2: Protected Routes ⏳

**Duration:** 1 hour  
**Commit:** `Implement protected routes and role guards`

**Tasks:**

- [ ] Create `ProtectedRoute.tsx` component
- [ ] Add authentication check
- [ ] Add role-based access control:
  - `/student` → Students only
  - `/senior` → Seniors only
  - `/admin` → Admins only
- [ ] Redirect to login if not authenticated
- [ ] Redirect to home if wrong role
- [ ] Add loading state during auth check

**Route Guards:**

```typescript
<Route
  path="/student"
  element={
    <ProtectedRoute requiredRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  }
/>
```

**Deliverables:**

- Protected routes working
- Role-based access control
- Redirect logic
- Auth loading states

---

### Phase 8: Testing & Polish

**Estimated Duration:** 4-6 hours  
**Goal:** Test full application and polish user experience

#### Phase 8.1: End-to-End Flow Testing ⏳

**Duration:** 2 hours  
**Commit:** `Test complete user flow`

**Tasks:**

- [ ] Test student flow:
  1. Sign up as student
  2. Join queue
  3. Wait for match
  4. Join call with senior
  5. End session
- [ ] Test senior flow:
  1. Sign up as senior
  2. Mark available
  3. Receive match request
  4. Accept match
  5. Join call with student
  6. End session
- [ ] Test admin dashboard:
  - View live statistics
  - Monitor active sessions
  - See queue size
- [ ] Test edge cases:
  - What if senior declines?
  - What if student disconnects?
  - What if no seniors available?
- [ ] Document bugs and fix

**Deliverables:**

- Full flow tested
- Bugs documented and fixed
- Edge cases handled
- User flows validated

---

#### Phase 8.2: Error Handling & Edge Cases ⏳

**Duration:** 2 hours  
**Commit:** `Add error handling and edge cases`

**Tasks:**

- [ ] Add network failure handling
- [ ] Add WebSocket reconnection logic
- [ ] Handle session timeout (1 hour)
- [ ] Handle unexpected disconnects
- [ ] Add user-friendly error messages
- [ ] Add retry mechanisms
- [ ] Test offline → online transition
- [ ] Add connection quality indicators

**Error Scenarios:**

- Network disconnects during call
- Backend server down
- Firebase connection lost
- Daily.co room expired
- User closes tab during session
- Multiple tabs open (same user)

**Deliverables:**

- Error boundaries implemented
- Retry logic for failed requests
- User-friendly error messages
- Connection status indicators
- Graceful degradation

---

#### Phase 8.3: UI Polish & Responsiveness ⏳

**Duration:** 2 hours  
**Commit:** `Polish UI and add responsive design`

**Tasks:**

- [ ] Test on mobile devices (responsive)
- [ ] Add loading skeletons
- [ ] Add smooth transitions (Framer Motion optional)
- [ ] Improve button hover states
- [ ] Add focus states (accessibility)
- [ ] Optimize images/assets
- [ ] Add favicon
- [ ] Test cross-browser (Chrome, Firefox, Safari)
- [ ] Add dark mode (optional)

**Polish Checklist:**

- ✅ Mobile responsive (320px - 1920px)
- ✅ Loading states everywhere
- ✅ Smooth animations
- ✅ Consistent spacing
- ✅ Accessibility (keyboard navigation, ARIA labels)
- ✅ Fast load times
- ✅ No layout shifts

**Deliverables:**

- Fully responsive design
- Loading states everywhere
- Smooth animations
- Accessibility improvements
- Cross-browser tested

---

### Phase 9: Deployment

**Estimated Duration:** 2-3 hours  
**Goal:** Deploy application to production

#### Phase 9.1: Backend Deployment ⏳

**Duration:** 1 hour  
**Commit:** `Configure backend for production deployment`

**Tasks:**

- [ ] Choose hosting platform (Railway/Render)
- [ ] Create production environment
- [ ] Set environment variables:
  - `OPENROUTER_API_KEY`
  - `DAILY_API_KEY`
  - `FIREBASE_SERVICE_ACCOUNT` (JSON)
  - `NODE_ENV=production`
  - `PORT=5000`
- [ ] Configure CORS for frontend domain
- [ ] Deploy backend
- [ ] Test API endpoints
- [ ] Test WebSocket connection
- [ ] Monitor logs

**Deployment Platforms:**

- **Railway:** Easy deployment, free tier, auto-scaling
- **Render:** Free tier, Docker support
- **Heroku:** Paid only now

**Deliverables:**

- Backend deployed to production
- Environment variables configured
- CORS configured
- API accessible via HTTPS
- WebSocket working on production

---

#### Phase 9.2: Frontend Deployment ⏳

**Duration:** 1 hour  
**Commit:** `Configure frontend for production deployment`

**Tasks:**

- [ ] Choose hosting (Vercel/Netlify)
- [ ] Set environment variables:
  - `NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app`
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - etc.
- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain (optional)
- [ ] Test deployed app

**Build Optimization:**

```bash
npm run build
npm run preview  # Test production build locally
```

**Deployment Platforms:**

- **Vercel:** Best for React, auto-deploy from Git, free tier
- **Netlify:** Great CI/CD, free tier
- **Cloudflare Pages:** Fast CDN, free tier

**Deliverables:**

- Frontend deployed to production
- Environment variables set
- App accessible via HTTPS
- Custom domain configured (optional)

---

#### Phase 9.3: Final Production Testing ⏳

**Duration:** 1 hour  
**No commit** (testing only)

**Tasks:**

- [ ] Test full flow on production:
  1. Student signs up → joins queue
  2. Senior signs up → accepts match
  3. Both join voice call
  4. Session ends successfully
- [ ] Test on multiple devices (desktop, mobile, tablet)
- [ ] Test on different browsers
- [ ] Monitor performance (Lighthouse)
- [ ] Check for console errors
- [ ] Verify analytics (optional)
- [ ] Test admin dashboard live stats

**Performance Targets:**

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- No critical console errors

**Deliverables:**

- Production app fully tested
- Performance optimized
- No critical bugs
- Ready for users! 🚀

---

## ⏱️ TIME ESTIMATES

### Optimistic Timeline

**Assumes:** Focused work, no blockers, experience with tech stack

| Phase                          | Duration | Cumulative   |
| ------------------------------ | -------- | ------------ |
| Phase 3: Frontend Foundation   | 4 hours  | 4 hours      |
| Phase 4: Core UI Components    | 6 hours  | 10 hours     |
| Phase 5: WebSocket Integration | 4 hours  | 14 hours     |
| Phase 6: Voice Integration     | 3 hours  | 17 hours     |
| Phase 7: Authentication        | 2 hours  | 19 hours     |
| Phase 8: Testing & Polish      | 4 hours  | 23 hours     |
| Phase 9: Deployment            | 2 hours  | **25 hours** |

**Total: ~25 hours (~3-4 working days)**

---

### Realistic Timeline

**Assumes:** Learning new concepts, debugging, breaks, context switching

| Phase                          | Duration | Cumulative   |
| ------------------------------ | -------- | ------------ |
| Phase 3: Frontend Foundation   | 6 hours  | 6 hours      |
| Phase 4: Core UI Components    | 8 hours  | 14 hours     |
| Phase 5: WebSocket Integration | 6 hours  | 20 hours     |
| Phase 6: Voice Integration     | 4 hours  | 24 hours     |
| Phase 7: Authentication        | 3 hours  | 27 hours     |
| Phase 8: Testing & Polish      | 6 hours  | 33 hours     |
| Phase 9: Deployment            | 3 hours  | **36 hours** |

**Total: ~36 hours (~5-7 working days)**

---

### With Documentation (Your Learning Approach)

**Assumes:** Detailed phase docs + comprehensive interview Q&A after each phase

**Add ~30% time** for documentation:

- Write learning guides
- Create interview questions
- Document decisions
- Add code comments

**Total: ~47 hours (~6-9 working days)**

---

## 🎯 Minimum Viable Product (MVP)

### What You Need for a Working Demo

**Goal:** Basic functional app for testing/demos

**Required Phases:**

1. Phase 3.1-3.3: Frontend foundation (~2 hours)
2. Phase 4.1-4.2: Student + Senior dashboards (~4 hours)
3. Phase 5.1-5.3: WebSocket integration (~5 hours)
4. Phase 6.1-6.2: Voice calls (~3 hours)

**Total MVP Time: ~14-18 hours (~2 days)**

**MVP Features:**
✅ Students can join queue  
✅ Seniors can accept matches  
✅ Real-time matching works  
✅ Voice calls functional  
✅ Sessions tracked in Firestore

**Can Add Later:**

- Authentication (use hardcoded users for MVP)
- Admin dashboard
- UI polish/animations
- Error handling
- Deployment

---

## 📝 Git Commit Strategy

### Best Practices for This Project

**Commit After Each Sub-Phase:**

- ✅ Small, focused commits
- ✅ Clear commit messages
- ✅ Easy to review/rollback
- ✅ Better git history

**Commit Message Format:**

```
[Phase X.Y] Brief description

- Bullet point 1
- Bullet point 2
```

**Examples:**

```
[Phase 3.1] Initialize Next.js frontend with TypeScript and App Router

- Create Next.js 14 project with TypeScript
- Configure next.config.js with API rewrites
- Set up strict TypeScript config
- Configure App Router structure
- Test dev server running
```

```
[Phase 5.2] Integrate student WebSocket flow

- Connect join queue button to socket event
- Listen for queue_update events
- Update UI with real-time position
- Navigate to session on match
```

**Avoid:**

- ❌ Committing multiple phases at once
- ❌ Vague messages like "update code" or "fixes"
- ❌ Committing broken code
- ❌ Committing documentation files (keep local)

---

## 🔄 Phase Completion Checklist

After each phase, verify:

- [ ] **Code works** - Tested and no errors
- [ ] **Git committed** - Small, focused commit
- [ ] **Documentation created** (optional) - Learning guide with interview Q&A
- [ ] **Tests pass** (if applicable)
- [ ] **No console errors**
- [ ] **Ready for next phase**

---

## 📚 Learning Resources (Per Phase)

### Phase 3: Frontend

- Next.js docs: https://nextjs.org/docs
- Next.js App Router: https://nextjs.org/docs/app
- TailwindCSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com

### Phase 4: UI Components

- TailwindCSS components: https://tailwindui.com
- shadcn/ui components: https://ui.shadcn.com/docs/components
- React patterns: https://react.dev/learn

### Phase 5: WebSocket

- Socket.io client docs: https://socket.io/docs/v4/client-api/
- React hooks with Socket.io: https://socket.io/how-to/use-with-react

### Phase 6: Voice

- Daily.co React: https://docs.daily.co/reference/daily-react
- Daily.co hooks: https://docs.daily.co/reference/daily-react/use-daily

### Phase 7: Auth

- Firebase Auth: https://firebase.google.com/docs/auth/web/start
- React with Firebase: https://firebase.google.com/docs/auth/web/manage-users

### Phase 8: Testing

- React Testing Library: https://testing-library.com/react
- Jest with Next.js: https://nextjs.org/docs/testing

### Phase 9: Deployment

- Vercel docs: https://vercel.com/docs
- Railway docs: https://docs.railway.app

---

## 🎓 Interview Preparation Topics

### By Phase

**Phase 3-4 (Frontend Foundation):**

- Next.js App Router vs Pages Router
- Server components vs Client components
- React hooks (useState, useEffect, useContext)
- TypeScript with React
- TailwindCSS utility classes
- File-based routing in Next.js
- shadcn/ui component usage

**Phase 5 (WebSocket):**

- WebSocket vs HTTP
- Event-driven architecture
- Socket.io client API
- Real-time state management
- Handling connection drops

**Phase 6 (Voice):**

- WebRTC fundamentals
- Media streams (getUserMedia)
- Daily.co architecture
- Handling network issues
- HIPAA compliance

**Phase 7 (Authentication):**

- Firebase Authentication flow
- JWT tokens
- Role-based access control (RBAC)
- Session management
- Security best practices

**Phase 8-9 (Deployment):**

- Production vs development builds
- Environment variables
- CORS configuration
- CI/CD pipelines
- Performance optimization

---

## 🚀 Next Steps

**Current Status:** Phase 2 Complete ✅  
**Next Phase:** Phase 3.1 - Initialize Next.js Project  
**Estimated Time:** 30 minutes  
**First Commit:** `[Phase 3.1] Initialize Next.js frontend with TypeScript and App Router`

**Ready to start building the frontend?** 🎨

---

## 📊 Progress Tracker

| Phase                     | Status      | Duration  | Committed |
| ------------------------- | ----------- | --------- | --------- |
| 1. Project Foundation     | ✅ Complete | 1 hour    | ✅ Yes    |
| 2.1. API Keys Setup       | ✅ Complete | 30 min    | ✅ Yes    |
| 2.2. Configuration Layer  | ✅ Complete | 1.5 hours | ✅ Yes    |
| 2.3. Config Testing       | ✅ Complete | 1 hour    | ✅ Yes    |
| 2.4. OpenAI Service       | ✅ Complete | 3 hours   | ✅ Yes    |
| 2.5. Daily.co Service     | ✅ Complete | 2 hours   | ✅ Yes    |
| 2.6. Express REST API     | ✅ Complete | 3 hours   | ✅ Yes    |
| 2.7. WebSocket Matching   | ✅ Complete | 4 hours   | ✅ Yes    |
| 3.1. React Init           | ⏳ Pending  | 30 min    | ❌ No     |
| 3.2. Dependencies         | ⏳ Pending  | 30 min    | ❌ No     |
| 3.3. Routing              | ⏳ Pending  | 1 hour    | ❌ No     |
| 3.4. Auth UI              | ⏳ Pending  | 2 hours   | ❌ No     |
| 4.1. Student Dashboard    | ⏳ Pending  | 2 hours   | ❌ No     |
| 4.2. Senior Dashboard     | ⏳ Pending  | 2 hours   | ❌ No     |
| 4.3. Call Interface       | ⏳ Pending  | 3 hours   | ❌ No     |
| 4.4. Admin Dashboard      | ⏳ Pending  | 1 hour    | ❌ No     |
| 5.1. Socket Client        | ⏳ Pending  | 1 hour    | ❌ No     |
| 5.2. Student Flow         | ⏳ Pending  | 2 hours   | ❌ No     |
| 5.3. Senior Flow          | ⏳ Pending  | 2 hours   | ❌ No     |
| 5.4. Real-Time Updates    | ⏳ Pending  | 1 hour    | ❌ No     |
| 6.1. Daily.co SDK         | ⏳ Pending  | 30 min    | ❌ No     |
| 6.2. Call Component       | ⏳ Pending  | 2 hours   | ❌ No     |
| 6.3. Session Coordination | ⏳ Pending  | 1 hour    | ❌ No     |
| 7.1. Firebase Auth        | ⏳ Pending  | 1 hour    | ❌ No     |
| 7.2. Protected Routes     | ⏳ Pending  | 1 hour    | ❌ No     |
| 8.1. E2E Testing          | ⏳ Pending  | 2 hours   | ❌ No     |
| 8.2. Error Handling       | ⏳ Pending  | 2 hours   | ❌ No     |
| 8.3. UI Polish            | ⏳ Pending  | 2 hours   | ❌ No     |
| 9.1. Backend Deploy       | ⏳ Pending  | 1 hour    | ❌ No     |
| 9.2. Frontend Deploy      | ⏳ Pending  | 1 hour    | ❌ No     |
| 9.3. Production Testing   | ⏳ Pending  | 1 hour    | ❌ No     |

**Overall Progress:** 8/32 phases complete (25%)  
**Backend:** 100% complete ✅  
**Frontend:** 0% complete ⏳

---

**Last Updated:** November 20, 2025  
**Author:** GitHub Copilot (Claude Sonnet 4.5)  
**Project:** Aura Connect v2
