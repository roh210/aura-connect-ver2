/**
 * Session Routes
 *
 * Handles all session-related endpoints:
 * - POST /api/sessions → Create new session (room + AI icebreaker)
 * - GET /api/sessions/:id → Get session details
 * - DELETE /api/sessions/:id → End session
 *
 * Architecture:
 * - Routes define URL structure and HTTP methods
 * - Controllers handle business logic
 * - Services (already built) handle external APIs
 *
 * Real-world example:
 * Same pattern as Stripe (/charges, /customers), GitHub (/repos, /users)
 */

import { Router } from "express";
import {
  createSession,
  getSession,
  endSession,
} from "../controllers/session.controller";
import { validateCreateSession } from "../middleware/validation";

const router = Router();

/**
 * POST /api/sessions
 *
 * Create new session between student and senior
 *
 * Request body:
 * {
 *   "studentId": "user_123",
 *   "studentName": "Alex",
 *   "seniorId": "user_456",
 *   "seniorName": "Margaret"
 * }
 *
 * Response (201 Created):
 * {
 *   "sessionId": "session_789",
 *   "roomUrl": "https://aura-connect.daily.co/92ecf3a3...",
 *   "studentToken": "eyJhbGci...",
 *   "seniorToken": "eyJhbGci...",
 *   "icebreaker": "Alex, I heard you enjoy hiking. Have you...",
 *   "expiresAt": "2025-11-19T17:36:03.000Z"
 * }
 *
 * What happens:
 * 1. Validate request (studentId, seniorId required)
 * 2. Create Daily.co room (voice calling)
 * 3. Generate AI icebreaker (personalized conversation starter)
 * 4. Save session to Firestore
 * 5. Return room URL + tokens + icebreaker
 *
 * Cost per request: ~$0.047 (3¢ voice + 1.4¢ AI)
 */
router.post("/", validateCreateSession, createSession);

/**
 * GET /api/sessions/:id
 *
 * Get session details (for analytics, debugging)
 *
 * Response (200 OK):
 * {
 *   "sessionId": "session_789",
 *   "studentId": "user_123",
 *   "seniorId": "user_456",
 *   "roomName": "92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "status": "active",
 *   "createdAt": "2025-11-19T16:36:03.000Z",
 *   "expiresAt": "2025-11-19T17:36:03.000Z"
 * }
 */
router.get("/:id", getSession);

/**
 * DELETE /api/sessions/:id
 *
 * End session (cleanup)
 *
 * What happens:
 * 1. Update session status to "ended" in Firestore
 * 2. Delete Daily.co room (optional, auto-expires anyway)
 *
 * Response (204 No Content)
 */
router.delete("/:id", endSession);

console.log(
  "🔧 session.routes.ts: Routes registered:",
  router.stack.length,
  "routes"
);

const sessionRoutes = router;
export default sessionRoutes;
