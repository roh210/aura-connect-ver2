/**
 * Voice Routes
 *
 * Handles voice calling endpoints:
 * - POST /api/voice/room → Create Daily.co room
 * - POST /api/voice/token → Generate access token (for reconnection)
 * - GET /api/voice/room/:name → Get room info
 *
 * Architecture:
 * - Routes define URL structure
 * - Controllers handle request/response
 * - Daily.co service (already built) handles WebRTC logic
 *
 * Real-world example:
 * Similar to Twilio Video API (/rooms, /tokens)
 */

import { Router } from "express";
import {
  createRoomEndpoint,
  generateTokenEndpoint,
  getRoomInfoEndpoint,
} from "../controllers/voice.controller";
import {
  validateCreateRoom,
  validateGenerateToken,
} from "../middleware/validation";

const router = Router();

/**
 * POST /api/voice/room
 *
 * Create Daily.co voice room
 *
 * Request body:
 * {
 *   "sessionId": "session_789",
 *   "studentName": "Alex",
 *   "seniorName": "Margaret"
 * }
 *
 * Response (201 Created):
 * {
 *   "roomUrl": "https://aura-connect.daily.co/92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "roomName": "92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "studentToken": "eyJhbGci...",
 *   "seniorToken": "eyJhbGci...",
 *   "expiresAt": "2025-11-19T17:36:03.000Z"
 * }
 *
 * What it does:
 * - Creates ephemeral room (auto-expires after 1 hour)
 * - Generates JWT tokens for student and senior
 * - Audio-only, no recording, private
 *
 * Cost: Included in Daily.co free tier (10K min/month)
 */
router.post("/room", validateCreateRoom, createRoomEndpoint);

/**
 * POST /api/voice/token
 *
 * Generate additional access token (for reconnection)
 *
 * Use case:
 * User's connection drops → Needs new token to rejoin same room
 *
 * Request body:
 * {
 *   "roomName": "92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "userId": "user_123",
 *   "userName": "Alex",
 *   "role": "student"
 * }
 *
 * Response (200 OK):
 * {
 *   "token": "eyJhbGci..."
 * }
 */
router.post("/token", validateGenerateToken, generateTokenEndpoint);

/**
 * GET /api/voice/room/:name
 *
 * Get room info (for debugging, analytics)
 *
 * Response (200 OK):
 * {
 *   "name": "92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "url": "https://aura-connect.daily.co/92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
 *   "created_at": "2025-11-19T16:36:03.000Z",
 *   "config": {
 *     "exp": 1732036563,
 *     "enable_recording": false,
 *     "enable_video": false
 *   }
 * }
 */
router.get("/room/:name", getRoomInfoEndpoint);

const voiceRoutes = router;
export default voiceRoutes;
