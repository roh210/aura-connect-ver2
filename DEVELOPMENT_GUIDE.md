# 🏗️ Aura Connect - Complete Development Guide

**A comprehensive walkthrough of building a real-time peer support platform with AI assistance**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack Decisions](#technology-stack-decisions)
4. [Project Structure](#project-structure)
5. [Development Phases](#development-phases)
6. [Key Design Patterns](#key-design-patterns)
7. [Real-time Communication](#real-time-communication)
8. [AI Integration](#ai-integration)
9. [State Management](#state-management)
10. [Authentication & Security](#authentication--security)
11. [UI/UX Design Philosophy](#uiux-design-philosophy)
12. [Deployment Strategy](#deployment-strategy)
13. [Lessons Learned](#lessons-learned)

---

## Project Overview

### The Problem

College students experience high stress but lack immediate access to peer support. Traditional mental health services have wait times and barriers to entry. Students need quick, human connections during stressful moments.

### The Solution

A real-time platform that matches stressed students with experienced seniors in under 2 minutes. Seniors receive AI-powered assistance to provide better support, while students get immediate, empathetic conversations via text or voice.

### Core Value Proposition

- **Speed**: <2 minute matching time
- **Human Connection**: Real people, not chatbots
- **AI Enhancement**: Helps seniors provide better support
- **Safety**: Crisis detection and resources always available
- **Accessibility**: Text and voice options, mobile-responsive

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐       │
│  │  Landing   │  │  Student   │  │   Senior    │       │
│  │   Page     │  │ Dashboard  │  │  Dashboard  │       │
│  └────────────┘  └────────────┘  └─────────────┘       │
│         │               │                 │             │
│         └───────────────┴─────────────────┘             │
│                         │                               │
│                    Next.js App                          │
└─────────────────────────┼───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    HTTP/REST        Socket.io          Firebase
        │                 │              Auth/DB
        │                 │                 │
┌───────┼─────────────────┼─────────────────┼─────────────┐
│       │                 │                 │             │
│  ┌────▼────┐      ┌─────▼──────┐    ┌────▼────┐       │
│  │  REST   │      │  Socket.io │    │ Firebase│       │
│  │   API   │      │   Server   │    │  Admin  │       │
│  └────┬────┘      └─────┬──────┘    └─────────┘       │
│       │                 │                              │
│       └────────┬────────┘                              │
│                │                                        │
│         ┌──────▼───────┐                               │
│         │ Match Queue  │                               │
│         │   Manager    │                               │
│         └──────┬───────┘                               │
│                │                                        │
│    ┌───────────┴───────────┐                          │
│    │                       │                          │
│ ┌──▼──────┐          ┌─────▼──────┐                  │
│ │ OpenAI  │          │  Daily.co  │                  │
│ │   API   │          │    API     │                  │
│ └─────────┘          └────────────┘                  │
│                                                        │
│              Node.js Express Server                    │
└────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Separation of Concerns**: Frontend and backend are completely decoupled, allowing independent scaling and development.

**Real-time First**: Socket.io provides bidirectional communication for instant messaging and live updates. HTTP is only used for initial auth and AI API calls.

**Edge-Optimized**: Next.js on Vercel puts the UI on CDN edges worldwide for fast load times. Backend on Render handles stateful connections.

**Scalable AI**: OpenAI API calls are server-side to protect keys and enable rate limiting. Results stream back through Socket.io.

**Managed Services**: Firebase (auth/DB), Daily.co (voice), OpenAI (AI) handle complex infrastructure so we focus on business logic.

---

## Technology Stack Decisions

### Frontend: Next.js 14 + TypeScript

**Why Next.js?**

- Server-side rendering (SSR) for fast initial loads
- App Router with file-based routing (clean, intuitive)
- Built-in API routes (though we use separate backend)
- Excellent developer experience with hot reload
- Production-ready out of the box

**Why TypeScript?**

- Catch bugs at compile time, not runtime
- Better IDE autocomplete and refactoring
- Self-documenting code with type definitions
- Essential for large codebases

**Alternative Considered**: Create React App (too basic), Vite (no SSR)

### Backend: Node.js + Express + Socket.io

**Why Node.js?**

- JavaScript everywhere (same language as frontend)
- Non-blocking I/O perfect for real-time apps
- Huge ecosystem (npm packages)
- Socket.io native support

**Why Express?**

- Minimal, unopinionated framework
- Easy to understand and extend
- Middleware pattern for clean code organization
- Industry standard

**Why Socket.io?**

- Simplifies WebSocket management
- Automatic reconnection handling
- Room-based messaging (perfect for 1-on-1 chats)
- Fallback to polling if WebSockets unavailable
- Built-in binary support for voice data

**Alternative Considered**: Django (Python, but different language), FastAPI (good, but less mature Socket.io support)

### Database: Firebase Firestore

**Why Firestore?**

- Real-time listeners (updates without polling)
- Integrated with Firebase Auth (single SDK)
- Generous free tier
- Auto-scaling, no server management
- Offline support built-in
- Fast for prototyping

**Why NOT Firestore?**

- Complex queries are limited
- No SQL joins
- Can get expensive at scale

**Alternative Considered**: PostgreSQL (more powerful, but need to manage server), MongoDB (similar to Firestore, but need hosting)

### Authentication: Firebase Auth

**Why Firebase Auth?**

- Email/password, Google, GitHub out of the box
- Secure token management
- User management dashboard
- Works seamlessly with Firestore
- Free tier is generous

**Alternative Considered**: Auth0 (more features, but overkill), Supabase (good alternative)

### AI: OpenAI API (GPT-4o, GPT-3.5 Turbo)

**Why OpenAI?**

- Best-in-class language models
- Consistent API for multiple models
- Fast response times
- Good documentation
- Structured outputs (JSON mode)

**Model Selection Strategy**:

- **GPT-4o**: Complex tasks (icebreakers, technique coaching, crisis detection) - $0.005 per call
- **GPT-3.5 Turbo**: Simple tasks (sentiment, stress scoring) - $0.001 per call
- **Cost Optimization**: Use cheaper models when possible, batch requests

**Alternative Considered**: Anthropic Claude (great, but more expensive), Local models (too slow, need GPUs)

### Voice: Daily.co

**Why Daily.co?**

- Simple REST API for room creation
- Client SDK handles all WebRTC complexity
- Built-in recording, transcription
- 10,000 free minutes/month
- Excellent reliability

**Alternative Considered**: Twilio (more expensive), Agora (complex setup), WebRTC direct (too much work)

### Styling: Tailwind CSS + shadcn/ui

**Why Tailwind?**

- Utility-first (faster development)
- No context switching (CSS in JSX)
- Purges unused styles (tiny bundle)
- Responsive design built-in
- Dark mode support

**Why shadcn/ui?**

- Copy-paste components (not a dependency)
- Built on Radix UI (accessible)
- Customizable with Tailwind
- Beautiful defaults

**Alternative Considered**: Material-UI (too opinionated), Chakra UI (heavier bundle)

### Animation: Framer Motion

**Why Framer Motion?**

- Declarative animations in React
- Physics-based motion
- Gesture support
- Server-side rendering compatible
- Great performance (60fps)

**Alternative Considered**: React Spring (steeper learning curve), CSS animations (less powerful)

---

## Project Structure

### Monorepo Organization

```
aura_connect_ver2/
├── frontend/          # Next.js application
├── backend/           # Node.js server
└── docs/              # Documentation (this file)
```

**Why Monorepo?**

- Easier to keep frontend/backend in sync
- Shared type definitions possible
- Single git repo for version control
- Simpler for solo development

**Why NOT Monorepo?**

- Can't deploy frontend/backend independently at first glance
- Larger repo size
- (We mitigate by using separate deployment configs)

### Frontend Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Root layout (providers)
│   ├── auth/
│   │   ├── login/page.tsx   # Login page
│   │   └── signup/page.tsx  # Signup page
│   ├── student/page.tsx     # Student dashboard
│   ├── senior/page.tsx      # Senior dashboard
│   └── session/
│       └── [id]/page.tsx    # Chat/voice session (dynamic route)
├── components/               # Reusable components
│   ├── ui/                  # shadcn/ui base components
│   ├── ConnectionStatus.tsx # WebSocket status indicator
│   ├── VoiceCall.tsx        # Daily.co voice component
│   ├── ResponseLevelSelector.tsx  # AI response UI
│   ├── TechniqueCard.tsx    # Coaching suggestions
│   ├── CrisisAlert.tsx      # Emergency resources
│   └── SentimentMeter.tsx   # Mood gauge
├── contexts/                 # React Context providers
│   └── AuthContext.tsx      # Firebase auth state
├── hooks/                    # Custom React hooks
│   ├── useSocket.ts         # Socket.io connection hook
│   └── use-toast.ts         # Toast notifications
├── services/                 # API clients
│   └── socket.service.ts    # Socket.io event handlers
└── lib/                      # Utilities
    └── utils.ts             # Helper functions
```

**Key Architectural Decisions**:

1. **App Router over Pages Router**: New Next.js standard, better for streaming and layouts
2. **Dynamic Routes**: `/session/[id]` allows unique URLs for each chat session
3. **Context for Auth**: Global user state without prop drilling
4. **Custom Hooks**: Encapsulate Socket.io logic, reusable across components
5. **Service Layer**: Centralize Socket.io events (don't scatter `socket.emit` everywhere)

### Backend Structure

```
backend/
├── src/
│   ├── server.ts            # Main Express + Socket.io setup
│   ├── routes/
│   │   └── ai.routes.ts     # REST endpoints for AI calls
│   ├── services/
│   │   ├── openai.service.ts     # OpenAI API wrapper
│   │   ├── daily.service.ts      # Daily.co room creation
│   │   └── firebase.service.ts   # Firestore queries
│   ├── socket/
│   │   └── socketHandlers.ts     # Socket.io event handlers
│   ├── middleware/
│   │   └── validators.ts         # Request validation (Joi)
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── firebase-key.json         # Service account (gitignored)
└── .env                      # Environment variables
```

**Key Architectural Decisions**:

1. **Separation of REST and WebSocket**: REST for AI calls, Socket.io for real-time
2. **Service Layer Pattern**: Business logic separate from routes/handlers
3. **Middleware for Validation**: Joi schemas catch bad requests before handlers
4. **TypeScript Throughout**: Shared types prevent mismatches
5. **Environment-Based Config**: Different settings for dev/production

---

## Development Phases

### Phase 1: Foundation (Week 1)

**Goal**: Get basic infrastructure working

**Backend**:

- Set up Express server (`server.ts`)
- Initialize Socket.io (`socketHandlers.ts`)
- Connect to Firebase (`firebase.service.ts`)
- Test basic WebSocket connection

**Frontend**:

- Create Next.js app with TypeScript
- Set up Tailwind CSS + shadcn/ui
- Build auth pages (`/auth/login`, `/auth/signup`)
- Implement Firebase auth context (`AuthContext.tsx`)

**Why This Order?**

- Backend first: Frontend needs something to connect to
- Auth early: Required for all other features
- Basic UI: Validates that styling system works

**Files Created**:

- `backend/src/server.ts`
- `backend/src/socket/socketHandlers.ts`
- `frontend/app/auth/login/page.tsx`
- `frontend/contexts/AuthContext.tsx`

### Phase 2: Real-time Matching (Week 2)

**Goal**: Students can find seniors and start sessions

**Backend**:

- Implement queue management in `socketHandlers.ts`
  - Students join queue → stored in memory
  - Seniors go online → emit to available seniors
  - Senior accepts → create session, notify both users
- Add Daily.co room creation (`daily.service.ts`)

**Frontend**:

- Build student dashboard (`/student/page.tsx`)
  - "Find a Senior" button
  - Queue status (position, estimated wait)
  - Connection state management
- Build senior dashboard (`/senior/page.tsx`)
  - Availability toggle
  - Incoming request cards
  - Accept/decline actions

**Why This Order?**

- Matching is core feature - nothing else works without it
- Daily.co room must be created server-side (API key security)
- Dashboard UX critical for first impressions

**Key Algorithm: Match Queue**

```
Student clicks "Find Senior"
  → Emit studentJoinQueue to backend
  → Backend stores in queue array
  → Backend emits queueUpdate to student (position, ETA)

Senior toggles availability to "online"
  → Emit seniorOnline to backend
  → Backend checks if students in queue
  → If yes, emit matchRequest to senior (student info)

Senior clicks "Accept"
  → Emit seniorAccept to backend
  → Backend creates Daily.co room (get roomUrl, token)
  → Backend emits sessionMatched to BOTH users
  → Frontend redirects to /session/[id]
```

**Files Created**:

- `backend/src/socket/socketHandlers.ts` (matchQueue logic)
- `backend/src/services/daily.service.ts`
- `frontend/app/student/page.tsx`
- `frontend/app/senior/page.tsx`
- `frontend/hooks/useSocket.ts`

### Phase 3: Session Chat (Week 3)

**Goal**: Users can text chat in real-time

**Backend**:

- Add message handlers in `socketHandlers.ts`
  - `socket.on('sendMessage')` → broadcast to room
  - Store messages in Firestore for persistence
- Message validation (Joi middleware)

**Frontend**:

- Build session page (`/session/[id]/page.tsx`)
  - Message display (scrollable list)
  - Input field with send button
  - Auto-scroll to latest message
  - Message bubbles (student purple, senior gray)
  - System messages (connection status)

**Why This Order?**

- Chat is baseline feature before adding voice/AI
- Message persistence allows reconnection without losing history
- Good UX requires thought (auto-scroll, loading states)

**Key Pattern: Socket.io Rooms**

```
Session ID = Room ID
When users join session:
  socket.join(sessionId)

When user sends message:
  io.to(sessionId).emit('messageReceived', message)

Only users in that room receive the message (privacy!)
```

**Files Created**:

- `frontend/app/session/[id]/page.tsx`
- `frontend/services/socket.service.ts`

### Phase 4: Voice Calling (Week 3)

**Goal**: Users can switch from text to voice

**Backend**:

- Room creation already done in Phase 2
- Add token generation for Daily.co SDK

**Frontend**:

- Create VoiceCall component (`VoiceCall.tsx`)
  - Daily.co SDK integration
  - Join/leave call buttons
  - Mute/unmute toggle
  - Call state management (idle, joining, joined)
- Add to session page
- Consent UI (recording disclosure)

**Why Daily.co?**

- WebRTC is complex (STUN, TURN servers, signaling)
- Daily.co abstracts all of it
- We just call `join(roomUrl)` and it works
- Built-in UI for mobile

**Key Pattern: Daily.co Integration**

```
1. Backend creates room, returns roomUrl + token
2. Frontend stores in localStorage (persists across refreshes)
3. User clicks "Start Voice Call"
4. Load Daily.co SDK script
5. Call daily.join({ url: roomUrl, token })
6. SDK handles all WebRTC magic
7. Users hear each other!
```

**Files Created**:

- `frontend/components/VoiceCall.tsx`

### Phase 5: AI Icebreakers (Week 4)

**Goal**: Auto-generate conversation starters

**Backend**:

- Create OpenAI service (`openai.service.ts`)
- Add icebreaker generation function
  - Takes student + senior user data
  - Calls GPT-4o with prompt
  - Returns { forStudent, forSenior }
- REST endpoint `/api/ai/icebreaker`

**Frontend**:

- Call API when session starts
- Display in accordion card (collapsible for seniors)
- Simple card for students
- Loading state while generating

**Why GPT-4o?**

- Needs creativity for natural conversation starters
- Must understand user context (name, role)
- GPT-3.5 is too generic for this

**Prompt Strategy**:

```
System: You are a counseling expert creating icebreakers
User: Student [name] matched with Senior [name].
      Create a warm conversation starter...
Response: JSON with forStudent and forSenior fields
```

**Files Created**:

- `backend/src/services/openai.service.ts`
- `backend/src/routes/ai.routes.ts`

### Phase 6: Multi-Level AI Responses (Week 5)

**Goal**: Help seniors respond better with 3 levels of AI assistance

**Backend**:

- Add suggestion generation to `openai.service.ts`
- Takes recent messages (last 5)
- Returns 3 arrays:
  - `quickReplies`: Short, click-to-send phrases
  - `guidedPrompts`: Sentence starters to complete
  - `aiDraft`: Full response to edit
- Endpoint `/api/ai/suggestions`

**Frontend**:

- Create ResponseLevelSelector component
  - Tabbed interface (Quick, Guided, Draft)
  - Each tab shows different suggestion type
  - Click handlers for each interaction pattern
- Add to session page (seniors only)
- Fetch when student sends message

**Why 3 Levels?**

- **Quick**: For experienced seniors who just need ideas
- **Guided**: For learning, shows technique without full answer
- **Draft**: For new seniors, gives complete response

**UX Pattern**:

```
Student sends message
  → Frontend detects (useEffect on messages array)
  → Call /api/ai/suggestions with last 5 messages
  → Display in accordion (collapsed by default)
  → Senior expands, picks level
    - Quick: Click → Sends immediately
    - Guided: Click → Fills input box (senior adds more)
    - Draft: Click → Fills input box (senior edits)
```

**Files Created**:

- `frontend/components/ResponseLevelSelector.tsx`

### Phase 7: Technique Coaching (Week 5)

**Goal**: Teach seniors counseling techniques in real-time

**Backend**:

- Add technique detection to `openai.service.ts`
- Analyzes last 6 messages every 3rd student message
- Returns:
  - `technique`: Name (Active Listening, Validation, etc.)
  - `explanation`: Why it helps
  - `example`: Concrete response using technique
- Endpoint `/api/ai/technique-coach`

**Frontend**:

- Create TechniqueCard component
- Display when AI suggests technique
- "Use Example" button fills input
- "Dismiss" button hides card
- Only check every 3rd student message (avoid spam)

**Why Every 3rd Message?**

- Balance between helpfulness and annoyance
- Gives senior time to try previous suggestion
- Reduces API costs

**Coaching Techniques Taught**:

1. **Active Listening**: Reflect feelings ("It sounds like you're...")
2. **Validation**: Acknowledge emotions ("That makes sense...")
3. **Open-Ended Questions**: Encourage elaboration ("Tell me more...")
4. **Reframing**: Positive perspective ("Another way to look at it...")
5. **Grounding**: Present moment focus ("What can you control?")

**Files Created**:

- `frontend/components/TechniqueCard.tsx`

### Phase 8: Crisis Detection & Safety (Week 6)

**Goal**: Automatically detect concerning language and provide resources

**Backend**:

- Add crisis detection to `openai.service.ts`
- Analyzes every message from student
- Returns:
  - `severity`: critical | high | medium | low
  - `flags`: Array of concerns (self-harm, suicide, etc.)
  - `recommendedAction`: What senior should do
- Endpoint `/api/ai/crisis`

**Frontend**:

- Create CrisisAlert component
- Shows when severity is high/critical
- Displays resources (988, hotlines)
- Urgent visual design (red, pulsing)
- Always visible in side panel

**Why GPT-4o?**

- Crisis detection is high-stakes (can't miss signals)
- Needs nuance (not just keyword matching)
- False positives okay, false negatives dangerous

**Ethical Consideration**:

- We don't diagnose or treat
- We connect to professional resources
- Seniors are peers, not therapists
- Clear disclaimers in UI

**Files Created**:

- `frontend/components/CrisisAlert.tsx`

### Phase 9: Sentiment Analysis (Week 6)

**Goal**: Show seniors the student's emotional trajectory

**Backend**:

- Add sentiment scoring to `openai.service.ts`
- Analyzes all messages in session
- Returns:
  - `currentSentiment`: -1 to +1 (negative to positive)
  - `trend`: "improving" | "stable" | "declining"
  - `indicators`: Keywords (stressed, hopeful, etc.)
- Endpoint `/api/ai/sentiment`

**Frontend**:

- Create SentimentMeter component
- Gauge visualization (colored arc)
- Trend arrow (up/down)
- Updates every 5 messages
- Shows to seniors only

**Why Sentiment Matters**:

- Helps seniors gauge effectiveness
- Shows if student is feeling better
- Alerts if conversation going poorly

**Files Created**:

- `frontend/components/SentimentMeter.tsx`

### Phase 10: Landing Page (Week 7)

**Goal**: Beautiful first impression to attract users

**Frontend**:

- Build home page (`/app/page.tsx`)
- Sections:
  1. Hero with gradient text + CTA
  2. How It Works (3 steps)
  3. Features grid
  4. Student testimonial section
  5. Senior call-to-action
  6. Footer with links
- Framer Motion animations
  - Scroll-triggered fade-ins
  - Floating orbs in background
  - Gradient text animation
- Mobile responsive (all breakpoints)

**Design Philosophy**:

- Dark theme (modern, reduces eye strain)
- Holographic gradients (purple, pink, blue)
- Glass-morphism cards (frosted blur effect)
- Lots of white space
- Clear hierarchy (80px headlines on desktop)

**Animation Strategy**:

```
Use IntersectionObserver via Framer Motion
When element enters viewport:
  - Fade in + slide up (60 units)
  - Stagger children (0.1s delay each)
  - Spring physics (natural bounce)
```

**Files Created**:

- `frontend/app/page.tsx`
- `frontend/components/landing/*` (Hero, Features, etc.)

### Phase 11: Responsive Design (Week 8)

**Goal**: Perfect experience on mobile, tablet, desktop

**Strategy**:

- Mobile-first design (build for 375px width first)
- Tailwind breakpoints:
  - `sm:` 640px (large phones)
  - `md:` 768px (tablets)
  - `lg:` 1024px (laptops)
  - `xl:` 1280px (desktops)

**Key Responsive Patterns**:

```tsx
// Stack on mobile, row on desktop
className = "flex flex-col md:flex-row";

// Hide on mobile, show on desktop
className = "hidden md:block";

// Responsive text sizing
className = "text-sm sm:text-base lg:text-lg";

// Responsive padding
className = "p-3 sm:p-6 lg:p-8";

// Grid columns
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
```

**Mobile-Specific Changes**:

- Session page: Stack AI cards vertically
- Dashboard: Single column layout
- Landing: Larger tap targets (min-h-[44px])
- Voice call: Simplified controls

**Files Modified**:

- Every component (added responsive classes)

### Phase 12: Design Consistency (Week 8)

**Goal**: Unified dark theme across all pages

**Changes**:

- Login/signup: Dark gradient backgrounds
- Dashboards: Match landing page colors
- Session: Consistent card styling
- All buttons: Purple-to-pink gradients
- All inputs: Dark gray with purple borders
- All text: Gray-200 for primary, Gray-400 for secondary

**Color Palette**:

```
Backgrounds: Gray-900, Purple-900
Cards: Gray-800/80 (semi-transparent)
Borders: Purple-500/30 (30% opacity)
Text: Gray-200 (primary), Gray-300 (secondary)
Accents: Purple-400, Pink-400, Blue-400
Gradients: from-purple-600 to-pink-600
```

**Files Modified**:

- `frontend/app/auth/login/page.tsx`
- `frontend/app/auth/signup/page.tsx`
- `frontend/app/student/page.tsx`
- `frontend/app/senior/page.tsx`

### Phase 13: Loading States (Week 9)

**Goal**: Show users what's happening during async operations

**Loading Patterns Added**:

1. **Auth pages**: Button text changes ("Signing in...")
2. **Dashboards**: Skeleton loaders for cards
3. **Session**: Icebreaker loading skeleton
4. **AI cards**: Skeleton while fetching suggestions
5. **Buttons**: Disabled state when not connected

**Why Loading States Matter**:

- Users need feedback (perceived performance)
- Prevents double-clicks
- Shows app is working, not frozen
- Professional polish

**Implementation**:

```tsx
{
  loading ? <Skeleton className="h-12 w-full" /> : <ActualComponent />;
}

<Button disabled={loading}>{loading ? "Loading..." : "Submit"}</Button>;
```

**Files Modified**:

- All pages with async operations

---

## Key Design Patterns

### 1. Custom Hooks for Reusability

**Pattern**: Encapsulate complex logic in hooks

**Example: useSocket.ts**

```
Purpose: Manage Socket.io connection lifecycle
  - Connect on mount
  - Disconnect on unmount
  - Auto-reconnect on failure
  - Event listener setup
  - Cleanup on page navigation

Returns: { socket, isConnected }

Used in: Student dashboard, Senior dashboard, Session page
```

**Why This Pattern?**

- Don't Repeat Yourself (DRY)
- Testable in isolation
- Clear separation of concerns
- Reusable across components

### 2. Service Layer for API Calls

**Pattern**: Centralize all API/Socket.io logic

**Example: socket.service.ts**

```
Functions:
  - sendMessage(sessionId, message)
  - studentJoinQueue(userId, userName)
  - seniorAccept(studentId, matchRequestId)
  - etc.

Why separate file?
  - Components don't know about Socket.io details
  - Easy to mock for testing
  - Single source of truth for event names
  - Can swap Socket.io for different transport later
```

**Alternative**: Scatter `socket.emit()` throughout components (messy, hard to maintain)

### 3. Context for Global State

**Pattern**: React Context for auth, theme, etc.

**Example: AuthContext.tsx**

```
Provides:
  - user: Firebase user object
  - loading: Auth state loading
  - signIn, signUp, signOut functions

Consumed by:
  - Every page (checks if user logged in)
  - Header (shows username)
  - Protected routes
```

**Why Context?**

- Avoid prop drilling (passing user through 5 components)
- Subscribe to auth state changes
- Centralize auth logic

**Alternative**: Redux (overkill for simple state), Prop drilling (annoying)

### 4. Compound Components

**Pattern**: Parent component with named children

**Example: Card Component**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

**Why This Pattern?**

- Flexible composition
- Clear hierarchy in JSX
- Easy to style consistently
- shadcn/ui uses this

### 5. Controlled vs Uncontrolled Components

**Pattern**: React controls input state vs DOM controls it

**Our Choice**: Controlled (React state)

```tsx
<input value={message} onChange={(e) => setMessage(e.target.value)} />
```

**Why Controlled?**

- Can validate on every keystroke
- Can clear input programmatically
- Single source of truth (React state)

**Trade-off**: Slightly more code, but worth it for control

### 6. Optimistic Updates

**Pattern**: Update UI before server confirms

**Example: Sending messages**

```
1. User types message, hits send
2. Immediately add to messages array (optimistic)
3. Send to server via Socket.io
4. Server broadcasts back (confirmation)
5. If failure, remove from array (rollback)
```

**Why This Pattern?**

- Feels instant (no lag)
- Better UX than waiting for server
- Can handle errors gracefully

### 7. Debouncing for Performance

**Pattern**: Delay function execution until pause in events

**Example: AI suggestions fetching**

```
Student sends 3 messages quickly
  → Don't call AI API 3 times
  → Wait 300ms after last message
  → Then call API once

Saves: 2 API calls, $0.01, server load
```

**Implementation**: `setTimeout` + cleanup in `useEffect`

### 8. Feature Flags (Simple)

**Pattern**: Environment variables to toggle features

**Example**:

```typescript
const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";

{
  VOICE_ENABLED && <VoiceCall />;
}
```

**Why This Pattern?**

- Deploy code before feature is ready
- A/B test features
- Quick rollback if bugs

---

## Real-time Communication

### Socket.io Architecture

**Why Socket.io over Plain WebSockets?**

1. **Auto-reconnection**: If connection drops, Socket.io reconnects automatically
2. **Room support**: Built-in grouping (perfect for 1-on-1 chats)
3. **Fallback**: Falls back to HTTP long-polling if WebSockets blocked
4. **Binary support**: Can send files, audio (not just text)
5. **Acknowledgements**: Can request confirmation of delivery

**Connection Flow**:

```
1. Frontend loads → useSocket hook runs
2. Create socket: io(backendURL, { auth: { userId } })
3. Backend receives 'connection' event
4. Store socket in Map: connectedUsers.set(userId, socket)
5. Frontend receives 'connect' event → setIsConnected(true)
6. Now can emit/receive events
```

**Event Naming Convention**:

```
Verb + Noun format:
  - studentJoinQueue (action)
  - queueUpdate (server response)
  - messageReceived (broadcast)
  - sessionMatched (notification)
```

**Room Management**:

```
Session ID = Room ID (UUID)

When user joins session:
  socket.join(sessionId)

When user sends message:
  io.to(sessionId).emit('messageReceived', {...})

Only users in sessionId room receive it (privacy!)

When user leaves:
  socket.leave(sessionId)
```

**Handling Disconnections**:

```
socket.on('disconnect', () => {
  // Remove from connectedUsers Map
  // Remove from matchQueue if in queue
  // Notify partner if in session
  // Clean up resources
})
```

**Preventing Memory Leaks**:

```
Always remove listeners in useEffect cleanup:

useEffect(() => {
  socket.on('messageReceived', handler)

  return () => {
    socket.off('messageReceived', handler)
  }
}, [])
```

### REST vs WebSocket Decision Matrix

**Use WebSocket (Socket.io) for**:

- Real-time chat messages
- Match notifications
- Queue updates
- Connection status
- Presence (online/offline)

**Use REST (HTTP) for**:

- AI API calls (OpenAI)
- Initial data fetching
- File uploads
- Third-party webhooks

**Why Not Everything Over WebSockets?**

- REST is stateless (easier to scale horizontally)
- REST has better browser caching
- REST easier to debug (curl, Postman)
- REST works with CDNs

---

## AI Integration

### OpenAI API Strategy

**Rate Limiting**:

```
Free tier: 3 requests/minute, 200/day
Solution:
  - Backend caches results (1 icebreaker per session)
  - Debounce rapid calls
  - Use cheaper models when possible
```

**Error Handling**:

```
try {
  const response = await openai.chat.completions.create({...})
  return response.choices[0].message.content
} catch (error) {
  // Log error
  // Return fallback (generic message)
  // Don't crash user experience
}
```

**Prompt Engineering Principles**:

1. **Be Specific**:

   - Bad: "Generate an icebreaker"
   - Good: "Generate a warm, empathetic conversation starter for a stressed college student talking to a senior peer supporter"

2. **Use Examples** (few-shot):

   ```
   Example 1: Student stressed about exams
   Output: "I hear you're feeling overwhelmed..."

   Example 2: Student lonely
   Output: "It sounds like you're going through..."
   ```

3. **Constrain Format**:

   ```
   Return JSON: { "forStudent": "...", "forSenior": "..." }
   Max 80 characters per field
   Use warm, casual tone
   ```

4. **System Message for Role**:
   ```
   System: You are a counseling expert trained in peer support
   User: [actual prompt]
   ```

**Cost Optimization**:

```
GPT-4o: $5 per 1M input tokens
GPT-3.5 Turbo: $0.50 per 1M tokens (10x cheaper!)

Use GPT-4o when:
  - Need creativity (icebreakers)
  - High stakes (crisis detection)
  - Complex reasoning (technique coaching)

Use GPT-3.5 when:
  - Simple classification (sentiment)
  - Speed matters (real-time suggestions)
  - Low risk (stress scoring)
```

### AI Tools Breakdown

**1. Icebreaker Generator**

- **Model**: GPT-4o
- **Cost**: ~$0.002 per call
- **Latency**: 2-3 seconds
- **Prompt**: Student + senior info → conversation starter
- **Called**: Once per session start
- **Fallback**: Generic "How are you feeling today?"

**2. Multi-Level Response Suggestions**

- **Model**: GPT-4o
- **Cost**: ~$0.005 per call
- **Latency**: 3-4 seconds
- **Prompt**: Last 5 messages → 3 response levels
- **Called**: When student sends message (debounced)
- **Fallback**: Empty arrays (no suggestions)

**3. Technique Coaching**

- **Model**: GPT-4o-mini
- **Cost**: ~$0.002 per call
- **Latency**: 2 seconds
- **Prompt**: Last 6 messages → technique suggestion
- **Called**: Every 3rd student message
- **Fallback**: No coaching card shown

**4. Crisis Detection**

- **Model**: GPT-4o (can't risk false negatives)
- **Cost**: ~$0.003 per call
- **Latency**: 2 seconds
- **Prompt**: Student message → severity + flags
- **Called**: Every student message
- **Fallback**: Assume safe (show resources anyway)

**5. Sentiment Analysis**

- **Model**: GPT-3.5 Turbo (simple classification)
- **Cost**: ~$0.001 per call
- **Latency**: 1 second
- **Prompt**: All messages → sentiment score
- **Called**: Every 5 messages
- **Fallback**: Neutral sentiment

### JSON Mode for Structured Outputs

**Why JSON Mode?**

- Guarantees valid JSON response
- No parsing errors
- Consistent format

**Usage**:

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  response_format: { type: "json_object" }
})

const data = JSON.parse(response.choices[0].message.content)
```

**Prompt Must Say "Return JSON"**:

```
System: You are a counseling expert. Return JSON only.
User: Generate icebreaker. Format: {"forStudent":"...","forSenior":"..."}
```

---

## State Management

### Why NOT Redux?

**Redux Overhead**:

- Actions, reducers, store setup
- Boilerplate for every state change
- Overkill for small app

**Our Approach**: React hooks + Context

**Local State (useState)**:

```tsx
// Component-specific state
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);
```

**Shared State (Context)**:

```tsx
// AuthContext for user across app
const { user, signOut } = useAuth();
```

**Server State (React Query could be used, but we didn't)**:

- We refetch on mount instead
- Simpler for prototype

### State Synchronization Patterns

**Problem**: User refreshes during session, loses state

**Solution**: localStorage + URL params

**Example: Session State**:

```typescript
// Store in localStorage when session starts
localStorage.setItem("sessionId", sessionId);
localStorage.setItem("sessionRoomUrl", roomUrl);
localStorage.setItem("sessionToken", token);

// Restore on refresh
const sessionId = params.id; // from URL
const roomUrl = localStorage.getItem("sessionRoomUrl");
```

**Problem**: Multiple tabs open, state out of sync

**Solution**: We don't support multiple tabs (design decision)

- Show warning if user opens another tab
- Or use BroadcastChannel API (future enhancement)

---

## Authentication & Security

### Firebase Auth Flow

**Signup**:

```
1. User fills form (email, password, role)
2. Call Firebase createUserWithEmailAndPassword
3. Update profile with displayName
4. Store role in Firestore (users collection)
5. Redirect to dashboard
```

**Login**:

```
1. User enters credentials
2. Call Firebase signInWithEmailAndPassword
3. Firebase returns JWT token (auto-stored)
4. AuthContext updates user state
5. Protected routes allow access
```

**Protected Routes**:

```tsx
useEffect(() => {
  if (!loading && !user) {
    router.push("/auth/login");
  }
}, [user, loading]);
```

**Token Management**:

- Firebase SDK auto-refreshes tokens
- Token sent in Socket.io auth handshake
- Backend verifies with Firebase Admin SDK

### Security Best Practices

**1. API Keys**:

```
✅ Do: Store in .env files (gitignored)
✅ Do: Use server-side for OpenAI, Daily.co
❌ Don't: Expose in frontend bundle
```

**2. Input Validation**:

```typescript
// Backend: Joi schemas
const messageSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  text: Joi.string().max(500).required(),
});
```

**3. Rate Limiting**:

```
Future: Add express-rate-limit
Limit: 100 messages per minute per user
Prevents spam/abuse
```

**4. XSS Prevention**:

```
React auto-escapes JSX (innerHTML dangerous)
Don't use dangerouslySetInnerHTML
Sanitize if accepting HTML
```

**5. CORS**:

```typescript
// Backend: Allow only frontend domain
const allowedOrigins = ["http://localhost:3001", "https://yourapp.vercel.app"];
```

**6. Environment Variables**:

```
Backend:
  - OPENAI_API_KEY
  - DAILY_API_KEY
  - FIREBASE_PROJECT_ID

Frontend (NEXT_PUBLIC_ prefix):
  - NEXT_PUBLIC_API_URL
  - NEXT_PUBLIC_FIREBASE_API_KEY
```

---

## UI/UX Design Philosophy

### Design System

**Color Palette**:

```
Primary: Purple (#A855F7, purple-500)
Secondary: Pink (#EC4899, pink-500)
Accent: Blue (#3B82F6, blue-500)

Backgrounds:
  - Dark: Gray-900 (#111827)
  - Card: Gray-800/80 (semi-transparent)

Text:
  - Primary: Gray-200 (#E5E7EB)
  - Secondary: Gray-400 (#9CA3AF)

Borders:
  - Subtle: Purple-500/30 (30% opacity)
  - Focus: Purple-400 (solid)
```

**Typography Scale**:

```
Headings:
  - H1: text-4xl (36px) → sm:text-5xl (48px)
  - H2: text-2xl (24px) → sm:text-3xl (30px)
  - H3: text-xl (20px)

Body:
  - Base: text-sm (14px) → sm:text-base (16px)
  - Small: text-xs (12px)
```

**Spacing Scale** (Tailwind defaults):

```
0.5 = 2px   (tight)
1   = 4px
2   = 8px   (compact)
3   = 12px
4   = 16px  (default)
6   = 24px  (comfortable)
8   = 32px  (spacious)
```

### Accessibility Considerations

**1. Color Contrast**:

```
WCAG AA: 4.5:1 for normal text
WCAG AAA: 7:1 for normal text

Our choices:
  - Gray-200 on Gray-900 = 12:1 ✅
  - Purple-400 on Gray-900 = 5.5:1 ✅
```

**2. Touch Targets**:

```
Minimum: 44x44 pixels (Apple HIG, WCAG)

All buttons: min-h-[44px] min-w-[44px]
Mobile: Larger tap areas (min-h-[48px])
```

**3. Keyboard Navigation**:

```
Tab through all interactive elements
Focus states visible (ring-2 ring-purple-500)
Enter/Space triggers buttons
Escape closes modals
```

**4. Screen Readers**:

```tsx
<button aria-label="Send message">
  <SendIcon />
</button>

<div role="alert">Crisis detected</div>
```

**5. Skip Links**:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

### Animation Principles

**Purpose of Animation**:

1. **Feedback**: Button pressed (scale down)
2. **Attention**: New message (fade in + slide)
3. **Continuity**: Page transition (crossfade)
4. **Delight**: Floating orbs, gradient shift

**Performance Rules**:

1. Only animate transform & opacity (GPU-accelerated)
2. Avoid animating width, height, margin (causes reflow)
3. Use `will-change` sparingly
4. 60fps target (16.67ms per frame)

**Framer Motion Patterns**:

```tsx
// Fade in on mount
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Hover scale
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>

// Stagger children
<motion.div variants={container}>
  {items.map(item => (
    <motion.div variants={itemVariant} />
  ))}
</motion.div>
```

### Mobile-First Approach

**Why Mobile First?**

1. More users on mobile than desktop (60%+)
2. Easier to add features than remove
3. Forces focus on essentials
4. Performance-first (mobile has less power)

**Responsive Breakpoints**:

```
Design for 375px width first (iPhone SE)
Then enhance for larger screens:
  sm: 640px  (large phones)
  md: 768px  (tablets)
  lg: 1024px (laptops)
  xl: 1280px (desktops)
```

**Common Patterns**:

```tsx
// Stack on mobile, row on tablet+
<div className="flex flex-col md:flex-row">

// 1 col mobile, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Hide on mobile (desktop-only feature)
<div className="hidden lg:block">

// Mobile-only
<div className="block lg:hidden">
```

---

## Deployment Strategy

### Why Vercel + Render?

**Vercel for Frontend**:

- ✅ Built for Next.js (creators of Next.js)
- ✅ Edge network (fast globally)
- ✅ Automatic HTTPS
- ✅ Preview deployments (every git push)
- ✅ Zero config
- ✅ Free tier generous

**Render for Backend**:

- ✅ WebSocket support (Vercel doesn't support Socket.io)
- ✅ Always-on (no cold starts on paid tier)
- ✅ Free tier available
- ✅ Simple setup
- ✅ Auto-deploy from git

**Alternative Considered**:

- **Railway**: Good, but paid after $5 credit
- **Heroku**: Used to be great, now expensive
- **AWS/GCP**: Too complex for MVP
- **Single server**: Need to manage ourselves

### Deployment Checklist

**Backend (Render)**:

1. Create `render.yaml` config
2. Set root directory to `backend`
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `DAILY_API_KEY`
   - `NODE_ENV=production`
4. Add Firebase service account JSON (as file)
5. Set start command: `npm start`
6. Deploy → Get URL: `https://aura-backend.onrender.com`

**Frontend (Vercel)**:

1. Connect GitHub repo
2. Set root directory to `frontend`
3. Framework preset: Next.js (auto)
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://aura-backend.onrender.com`
   - `NEXT_PUBLIC_FIREBASE_*` (all Firebase config)
5. Deploy → Get URL: `https://aura-connect.vercel.app`

**Post-Deployment**:

1. Update CORS in backend to allow Vercel domain
2. Test WebSocket connection (use network tab)
3. Test voice calls (Daily.co rooms)
4. Test AI features (OpenAI API)
5. Check error logs (Render dashboard)

### Environment-Specific Config

**Development**:

```
Backend: http://localhost:3000
Frontend: http://localhost:3001
Database: Firebase dev project
```

**Production**:

```
Backend: https://aura-backend.onrender.com
Frontend: https://aura-connect.vercel.app
Database: Firebase production project
```

**How to Manage**:

```bash
# .env.local (frontend dev)
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.production (frontend prod)
NEXT_PUBLIC_API_URL=https://aura-backend.onrender.com
```

---

## Lessons Learned

### Technical Lessons

**1. WebSocket Persistence is Hard**

- Problem: Socket.io connections drop on page refresh
- Solution: Store session data in localStorage + URL params
- Learning: Plan for unreliable connections from day 1

**2. Real-time Needs Debouncing**

- Problem: AI API called 10x per second as user types
- Solution: 300ms debounce on fetch
- Learning: Always debounce expensive operations

**3. Mobile Safari is Different**

- Problem: Voice calls didn't work on iPhone
- Solution: Daily.co SDK needed specific iOS config
- Learning: Test on real devices early

**4. AI Responses Need Graceful Degradation**

- Problem: OpenAI API fails → entire feature breaks
- Solution: Try-catch with fallback messages
- Learning: Never trust external APIs 100%

**5. TypeScript Prevents Bugs**

- Problem: Passing wrong prop types between components
- Solution: TypeScript catches at compile time
- Learning: Initial setup takes longer, but saves time long-term

### Design Lessons

**1. Less is More**

- Initial design had 10 AI features
- Users confused by too many options
- Simplified to 3 core features (icebreaker, suggestions, coaching)
- Learning: Ship MVP, add based on feedback

**2. Dark Mode Only**

- Considered light/dark toggle
- Dark mode fits wellness/calming vibe better
- One theme = half the design work
- Learning: Constraints breed creativity

**3. Animations Should Serve Purpose**

- Added floating orbs just for "cool factor"
- Caused performance issues on old phones
- Removed non-essential animations
- Learning: Every animation should have a reason

**4. Mobile First Saves Time**

- Tried desktop-first initially
- Ended up removing features for mobile
- Started over mobile-first
- Learning: It's harder to remove than add

### Architecture Lessons

**1. Monorepo for Small Teams**

- Considered separate repos for frontend/backend
- Monorepo easier for solo dev
- Can still deploy separately
- Learning: Optimize for team size

**2. Service Layer is Essential**

- Initially had API calls scattered in components
- Refactored to service files
- Much easier to maintain
- Learning: Add service layer from day 1

**3. Custom Hooks > HOCs**

- Old React pattern: Higher-Order Components
- New pattern: Custom hooks (useSocket, etc.)
- Hooks are more composable
- Learning: Use modern patterns

**4. Feature Flags for Phased Rollout**

- Added voice calling, broke production
- Should have used feature flag
- Could have tested with 10% of users first
- Learning: Add feature flags early

### Process Lessons

**1. Document as You Build**

- Tried to document after finishing
- Forgot reasons for decisions
- Now document in comments + separate docs
- Learning: Write it down immediately

**2. Git Commits Should Be Atomic**

- Made commits like "various fixes"
- Hard to debug later
- Now: One feature per commit
- Learning: Future you will thank present you

**3. Test Early, Test Often**

- Built entire feature, tested at end
- Found major bugs, had to refactor
- Now: Test as you build
- Learning: Fix bugs when code is fresh in mind

**4. Get Feedback from Real Users**

- Built based on assumptions
- Real users wanted different features
- Pivoted based on feedback
- Learning: Ship fast, iterate based on data

---

## Conclusion

### What We Built

A full-stack real-time platform that:

- Matches users in <2 minutes
- Enables text and voice communication
- Provides AI-powered assistance to seniors
- Detects crisis situations automatically
- Works beautifully on mobile and desktop

### Key Takeaways for Future Projects

**1. Start Simple, Iterate**

- MVP: Match + chat only
- Add features based on usage
- Don't over-engineer

**2. Choose Boring Technology**

- Next.js: Proven, stable
- Firebase: Managed, scalable
- Socket.io: Battle-tested
- Avoid shiny new frameworks

**3. Real-time is Hard**

- Plan for disconnections
- Test on poor networks
- Use managed services when possible

**4. AI is Powerful but Unpredictable**

- Always have fallbacks
- Cache responses
- Monitor costs closely

**5. Design Systems Save Time**

- Define colors, spacing upfront
- Use component library (shadcn/ui)
- Mobile-first approach

**6. User Experience > Features**

- One great feature > ten mediocre ones
- Loading states matter
- Error messages should help

### Future Enhancements

**Short-term (1-2 weeks)**:

1. Admin dashboard for monitoring
2. Email notifications for matches
3. Session feedback/ratings
4. More crisis resources by country

**Medium-term (1-2 months)**:

1. Group sessions (3-4 students + senior)
2. Scheduled sessions (not just instant)
3. Video calling (upgrade from voice)
4. Mobile app (React Native)

**Long-term (3-6 months)**:

1. AI session summaries
2. Outcome tracking (stress reduction)
3. Senior training program
4. University partnerships

---

## Appendix: File Reference Guide

### Critical Files to Understand

**Backend Core**:

- `backend/src/server.ts` - Express + Socket.io setup, CORS, middleware
- `backend/src/socket/socketHandlers.ts` - All Socket.io events, match queue logic
- `backend/src/services/openai.service.ts` - All AI functions with prompts
- `backend/src/services/daily.service.ts` - Voice room creation
- `backend/src/routes/ai.routes.ts` - REST endpoints for AI calls

**Frontend Core**:

- `frontend/app/page.tsx` - Landing page with animations
- `frontend/app/session/[id]/page.tsx` - Chat/voice session (most complex)
- `frontend/contexts/AuthContext.tsx` - Firebase auth state
- `frontend/hooks/useSocket.ts` - Socket.io connection management
- `frontend/services/socket.service.ts` - Socket.io event handlers

**Reusable Components**:

- `frontend/components/VoiceCall.tsx` - Daily.co integration
- `frontend/components/ResponseLevelSelector.tsx` - AI response UI
- `frontend/components/TechniqueCard.tsx` - Coaching suggestions
- `frontend/components/CrisisAlert.tsx` - Emergency resources
- `frontend/components/SentimentMeter.tsx` - Mood tracking

**Configuration**:

- `backend/.env` - Backend environment variables
- `frontend/.env.local` - Frontend environment variables
- `backend/firebase-key.json` - Service account (DO NOT COMMIT)

### Quick Navigation Map

**Want to understand matching?**
→ `backend/src/socket/socketHandlers.ts` (matchQueue logic)

**Want to understand AI suggestions?**
→ `backend/src/services/openai.service.ts` (generateMultiLevelResponses)

**Want to understand voice calls?**
→ `frontend/components/VoiceCall.tsx` + `backend/src/services/daily.service.ts`

**Want to understand session page?**
→ `frontend/app/session/[id]/page.tsx` (800+ lines, complex but well-commented)

**Want to understand auth flow?**
→ `frontend/contexts/AuthContext.tsx` + `frontend/app/auth/login/page.tsx`

---

**Built with care for learning and teaching. Good luck with your future projects! 🚀**
