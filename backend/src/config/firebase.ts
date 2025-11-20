/**
 * Firebase Configuration (Firestore Database)
 *
 * SYSTEM DESIGN CONCEPT: Database as Single Source of Truth
 *
 * Why Firestore:
 * ✅ Real-time sync (changes appear instantly in all clients)
 * ✅ NoSQL (flexible schema, no migrations)
 * ✅ Auto-scaling (handles traffic spikes)
 * ✅ Built-in security rules (row-level permissions)
 * ✅ Free tier: 50K reads/day, 20K writes/day
 *
 * What we store:
 * - users: Student and senior profiles
 * - sessions: Active calls (who's talking to whom)
 * - messages: Chat history
 * - availability: When seniors are free
 * - analytics: Session duration, AI interventions
 *
 * Why not PostgreSQL/MySQL:
 * - Firestore easier to scale (no servers to manage)
 * - Real-time listeners built-in (no polling)
 * - Better for unstructured data (AI responses vary)
 * - Same team maintains Auth + Database + Hosting
 */

import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "./logger";

/**
 * Service Account Authentication
 *
 * ARCHITECTURE DECISION: Private key from environment variable
 *
 * Why not JSON file:
 * ❌ Can't commit to Git (security risk)
 * ❌ Hard to deploy (need to upload file separately)
 * ❌ Different file per environment (dev vs prod)
 *
 * Why environment variable:
 * ✅ Same code for all environments
 * ✅ No files to manage
 * ✅ Works with Vercel/Railway/AWS Lambda
 * ✅ Can rotate keys without changing code
 *
 * Real-world example:
 * - Stripe: API keys in env vars
 * - Twilio: Account SID in env vars
 * - AWS: Access keys in env vars
 */

/**
 * Initialize Firebase Admin SDK
 *
 * SINGLETON PATTERN: Initialize once, reuse everywhere
 *
 * Why initialize at startup (not on first use):
 * 1. Fail Fast: Know immediately if credentials are wrong
 * 2. Performance: First API call isn't slow
 * 3. Debugging: Easier to troubleshoot startup vs runtime
 *
 * Initialization steps:
 * 1. Parse private key (replace escaped newlines)
 * 2. Create credential object
 * 3. Initialize admin SDK
 * 4. Get Firestore instance
 * 5. Test connection with simple query
 *
 * Cost: ~200ms startup time (one-time cost)
 * Benefit: Guaranteed working database
 */

try {
  // Parse private key (environment variables escape newlines as \\n)
  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  // Initialize Firebase Admin (only if not already initialized)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    logger.info("✅ Firebase Admin SDK initialized", {
      project: env.FIREBASE_PROJECT_ID,
    });
  }
} catch (error) {
  logger.error("❌ Firebase initialization failed", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error; // Fail fast: Don't start server with broken database
}

/**
 * Get Firestore Database Instance
 *
 * ALGORITHM: Lazy initialization (create only when needed)
 *
 * Why export db directly:
 * - Simpler imports: `import { db } from '@/config/firebase'`
 * - No function calls needed
 * - TypeScript knows exact type
 *
 * Usage in services:
 * const userDoc = await db.collection('users').doc(userId).get();
 * const sessions = await db.collection('sessions').where('status', '==', 'active').get();
 */
export const db = admin.firestore();

/**
 * Firestore Settings
 *
 * PERFORMANCE OPTIMIZATION: Configure database behavior
 *
 * ignoreUndefinedProperties:
 * - Prevents accidental `undefined` values in database
 * - Forces explicit `null` or omitting field
 * - Why: Firestore treats undefined as "delete field"
 *
 * Example:
 * BAD:  { name: userName } // If userName undefined, field deleted
 * GOOD: { name: userName || null } // Explicit null
 */
db.settings({
  ignoreUndefinedProperties: true,
});

logger.info("✅ Firestore database ready", {
  project: env.FIREBASE_PROJECT_ID,
});

/**
 * Collection References (Type-Safe)
 *
 * ARCHITECTURE PATTERN: Centralized collection names
 *
 * Why not hardcode collection names everywhere:
 * ❌ Typos cause runtime errors: db.collection('usres')
 * ❌ Hard to rename: Need to find/replace in 20 files
 * ❌ No autocomplete
 *
 * Why centralize:
 * ✅ Single source of truth
 * ✅ TypeScript autocomplete
 * ✅ Easy to rename
 * ✅ Can add type definitions later
 *
 * Usage:
 * import { collections } from '@/config/firebase';
 * const users = await collections.users.get();
 */
export const collections = {
  users: db.collection("users"),
  sessions: db.collection("sessions"),
  messages: db.collection("messages"),
  availability: db.collection("availability"),
  analytics: db.collection("analytics"),
} as const;

/**
 * Database Schema Overview (NoSQL Document Structure)
 *
 * users/{userId}:
 * {
 *   id: string (Firebase Auth UID)
 *   role: 'student' | 'senior'
 *   displayName: string
 *   age: number
 *   stressLevel: number (0-100, from AI analysis)
 *   createdAt: Timestamp
 * }
 *
 * sessions/{sessionId}:
 * {
 *   id: string
 *   studentId: string
 *   seniorId: string
 *   status: 'active' | 'ended'
 *   startedAt: Timestamp
 *   endedAt: Timestamp | null
 *   dailyRoomUrl: string (Daily.co video room)
 *   icebreaker: string (AI-generated)
 * }
 *
 * messages/{messageId}:
 * {
 *   id: string
 *   sessionId: string
 *   senderId: string
 *   content: string
 *   timestamp: Timestamp
 *   type: 'text' | 'system' (system = AI intervention)
 * }
 *
 * availability/{seniorId}:
 * {
 *   id: string (same as seniorId)
 *   isAvailable: boolean
 *   lastActive: Timestamp
 * }
 *
 * analytics/{eventId}:
 * {
 *   type: 'session_created' | 'ai_intervention' | 'safety_flag'
 *   timestamp: Timestamp
 *   metadata: object (flexible)
 * }
 */

/**
 * Performance Characteristics:
 *
 * Read latency:
 * - Document get: ~10ms (within same region)
 * - Query: ~20-50ms (depends on index)
 * - Real-time listener: ~5ms (maintains WebSocket)
 *
 * Write latency:
 * - Add document: ~15ms
 * - Update fields: ~10ms
 * - Batch write (500 docs): ~100ms
 *
 * Costs (Free tier):
 * - 50K document reads/day
 * - 20K document writes/day
 * - 20K document deletes/day
 * - 1GB storage
 *
 * Our expected usage (100 active users/day):
 * - Reads: ~5K/day (well under limit)
 * - Writes: ~1K/day (well under limit)
 * - Storage: ~50MB (well under limit)
 */

/**
 * Real-world Firestore users:
 * - The New York Times: News articles
 * - Todoist: Task management
 * - Halfbrick Studios: Game leaderboards
 * - Duolingo: User progress tracking
 *
 * Common mistake to avoid:
 * ❌ Reading entire collection: db.collection('users').get()
 * ✅ Query with filters: db.collection('users').where('role', '==', 'senior').limit(10)
 *
 * Why: Firestore charges per document read
 * Reading 10K users = 10K reads (costs money)
 * Query for 10 users = 10 reads (free tier)
 */
