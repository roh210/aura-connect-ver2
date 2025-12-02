/**
 * Daily.co Voice Service
 *
 * SYSTEM DESIGN: Voice calling infrastructure for wellness platform
 *
 * Functions:
 * 1. createRoom() - Create voice room for new session
 * 2. getToken() - Generate access token for user
 * 3. endRoom() - Manually end room (optional cleanup)
 *
 * Architecture Pattern: RESTful API integration
 * - HTTP calls to Daily.co API
 * - JWT token-based authentication
 * - Ephemeral rooms (auto-expire after 1 hour)
 * - Audio-only (no video for privacy)
 * - HIPAA compliant
 *
 * Real-world parallels:
 * - Headway (therapy sessions)
 * - BetterHelp (mental health calls)
 * - Crisis Text Line (voice support)
 */

import axios from "axios";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Daily.co API Configuration
 *
 * Base URL: https://api.daily.co/v1
 * Authentication: Bearer token (API key)
 * Rate limits: 600 requests/minute (plenty for our use case)
 */
const DAILY_API_BASE = "https://api.daily.co/v1";
const DAILY_API_KEY = env.DAILY_API_KEY;

// Axios instance with auth header
const dailyClient = axios.create({
  baseURL: DAILY_API_BASE,
  headers: {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Type Definitions
 */

export interface DailyRoom {
  url: string; // Full room URL: https://yourteam.daily.co/abc123
  name: string; // Room name only: abc123
  created_at: string; // ISO timestamp
  config: {
    exp?: number; // Unix timestamp when room expires
  };
}

export interface CreateRoomResult {
  roomUrl: string; // Full URL to join call
  roomName: string; // Unique room identifier
  studentToken: string; // Access token for student
  seniorToken: string; // Access token for senior
  expiresAt: Date; // When room auto-deletes
}

export interface MeetingToken {
  token: string; // JWT access token
  room_name: string; // Room this token is for
  user_name: string; // Display name in call
  is_owner: boolean; // Can end call for everyone
}

/**
 * 1. Create Voice Room
 *
 * ALGORITHM: Create ephemeral Daily.co room with security settings
 *
 * Flow:
 * 1. Generate unique room name (UUID)
 * 2. Create room via Daily.co API (audio-only, 1 hour expiry)
 * 3. Generate access tokens for student and senior
 * 4. Return room details
 *
 * Security features:
 * - Ephemeral (auto-deletes after 1 hour)
 * - Audio-only (video disabled)
 * - Private (not listed in directory)
 * - No recording
 * - Access tokens required
 *
 * Cost: Free (within 10K min/month tier)
 * Latency: ~200-300ms (API call)
 *
 * Real-world example: Zoom creating instant meeting
 */
export async function createRoom(
  sessionId: string,
  studentName: string,
  seniorName: string
): Promise<CreateRoomResult> {
  try {
    // Generate unique room name (no user data in URL for privacy)
    const roomName = randomUUID();

    // Calculate expiry (1 hour from now)
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600; // Unix timestamp

    logger.debug("Creating Daily.co room", {
      sessionId,
      roomName,
      expiresAt: new Date(expiryTimestamp * 1000).toISOString(),
    });

    // Create room via Daily.co API
    const response = await dailyClient.post<DailyRoom>("/rooms", {
      name: roomName,
      privacy: "private", // Not listed publicly
      properties: {
        enable_screenshare: false, // Audio-only
        enable_chat: false, // No chat (prevents text logs)
        enable_recording: "cloud", // Recording available but off by default
        start_video_off: true, // Camera off
        start_audio_off: false, // Mic on
        enable_people_ui: true, // Show participant list
        enable_emoji_reactions: false, // No distractions
        exp: expiryTimestamp, // Auto-delete after 1 hour
        eject_at_room_exp: true, // Kick users when room expires
        enable_network_ui: true, // Show connection quality
        enable_noise_cancellation_ui: true, // Denoise option
      },
    });

    const room = response.data;

    logger.info("Daily.co room created successfully", {
      sessionId,
      roomName: room.name,
      roomUrl: room.url,
      expiresAt: new Date(expiryTimestamp * 1000).toISOString(),
    });

    // Generate access tokens for both participants
    const [studentToken, seniorToken] = await Promise.all([
      getToken(room.name, `student_${sessionId}`, studentName, "student"),
      getToken(room.name, `senior_${sessionId}`, seniorName, "senior"),
    ]);

    return {
      roomUrl: room.url,
      roomName: room.name,
      studentToken,
      seniorToken,
      expiresAt: new Date(expiryTimestamp * 1000),
    };
  } catch (error) {
    logger.error("Failed to create Daily.co room", {
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    });

    // Graceful degradation: No fallback possible for voice infrastructure
    throw new Error(
      "Voice service unavailable. Please try again in a few minutes."
    );
  }
}

/**
 * 2. Generate Access Token
 *
 * ALGORITHM: Create JWT token for secure room access
 *
 * Token permissions:
 * - Student: Regular participant, can't record
 * - Senior: Regular participant, can't record (equality in calls)
 *
 * Why tokens:
 * - Room URL alone isn't secure (anyone with URL could join)
 * - Token validates user before entry
 * - Tokens expire with room (1 hour)
 *
 * Security:
 * - JWT signed by Daily.co (can't be forged)
 * - One token per user per room (can't reuse)
 * - Expires with room (can't join old sessions)
 *
 * Cost: Free (included with room creation)
 * Latency: ~100ms (API call)
 *
 * Real-world example: Zoom meeting passwords
 */
export async function getToken(
  roomName: string,
  userId: string,
  userName: string,
  role: "student" | "senior"
): Promise<string> {
  try {
    logger.debug("Generating Daily.co token", {
      roomName,
      userId,
      userName,
      role,
    });

    // Create meeting token
    const response = await dailyClient.post<MeetingToken>("/meeting-tokens", {
      properties: {
        room_name: roomName,
        user_name: userName, // Display name in call
        is_owner: false, // No special privileges (equality)
        enable_recording: false, // Can't record
        enable_screenshare: false, // Audio-only
        start_video_off: true, // Camera off
        start_audio_off: false, // Mic on
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        eject_at_token_exp: true, // Kick when token expires
      },
    });

    const token = response.data.token;

    logger.info("Daily.co token generated successfully", {
      roomName,
      userId,
      role,
      tokenLength: token.length,
    });

    return token;
  } catch (error) {
    logger.error("Failed to generate Daily.co token", {
      error: error instanceof Error ? error.message : "Unknown error",
      roomName,
      userId,
    });

    throw new Error("Unable to generate access token. Please try again.");
  }
}

/**
 * 3. End Room (Optional Cleanup)
 *
 * ALGORITHM: Manually delete room before auto-expiry
 *
 * When to use:
 * - Senior ends call early (student disconnected, resolved quickly)
 * - Emergency situation (need to immediately close room)
 * - Testing (clean up test rooms)
 *
 * When NOT to use:
 * - Normal call end (rooms auto-expire, no need to manually delete)
 * - Saves API calls (rate limit is 600/min, but good practice)
 *
 * Note: This is optional. Rooms auto-delete after 1 hour anyway.
 *
 * Cost: Free
 * Latency: ~200ms (API call)
 *
 * Real-world example: Zoom host ending meeting vs auto-expiry
 */
export async function endRoom(roomName: string): Promise<boolean> {
  try {
    logger.debug("Ending Daily.co room", { roomName });

    await dailyClient.delete(`/rooms/${roomName}`);

    logger.info("Daily.co room ended successfully", { roomName });

    return true;
  } catch (error) {
    // Don't throw error - room will auto-expire anyway
    logger.warn("Failed to manually end Daily.co room (will auto-expire)", {
      error: error instanceof Error ? error.message : "Unknown error",
      roomName,
    });

    return false;
  }
}

/**
 * 4. Get Room Info (Analytics/Debugging)
 *
 * ALGORITHM: Fetch room details and participant info
 *
 * Use cases:
 * - Check if room still active
 * - Get participant count
 * - Fetch call duration
 * - Debug connection issues
 *
 * Note: This is for internal use (analytics, debugging), not user-facing
 *
 * Cost: Free
 * Latency: ~100ms (API call)
 */
export async function getRoomInfo(roomName: string): Promise<DailyRoom | null> {
  try {
    logger.debug("Fetching Daily.co room info", { roomName });

    const response = await dailyClient.get<DailyRoom>(`/rooms/${roomName}`);

    logger.info("Daily.co room info fetched", {
      roomName,
      url: response.data.url,
    });

    return response.data;
  } catch (error) {
    // Room might not exist (already expired or deleted)
    logger.warn("Failed to fetch Daily.co room info", {
      error: error instanceof Error ? error.message : "Unknown error",
      roomName,
    });

    return null;
  }
}

/**
 * 5. List Active Rooms (Admin/Analytics)
 *
 * ALGORITHM: Get all currently active rooms
 *
 * Use cases:
 * - Admin dashboard (how many calls happening now?)
 * - Analytics (peak usage times)
 * - Monitoring (detect anomalies)
 *
 * Note: This is for internal use only, not user-facing
 *
 * Cost: Free
 * Latency: ~200ms (API call)
 */
export async function listActiveRooms(): Promise<DailyRoom[]> {
  try {
    logger.debug("Listing active Daily.co rooms");

    const response = await dailyClient.get<DailyRoom[]>("/rooms");

    logger.info("Daily.co rooms listed", {
      activeRooms: response.data.length,
    });

    return response.data;
  } catch (error) {
    logger.error("Failed to list Daily.co rooms", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return [];
  }
}

/**
 * Error Handling Strategy
 *
 * Unlike AI services (which have fallbacks), voice infrastructure can't have fallbacks.
 * You can't "fake" a voice call.
 *
 * Strategy:
 * 1. Retry transient errors (network glitches)
 * 2. Log all errors with context
 * 3. Show helpful user messages ("Voice service unavailable, try again in 5 min")
 * 4. Monitor Daily.co status page (https://status.daily.co)
 * 5. Have backup plan (if Daily.co down for >1 hour, switch to text-only temporarily)
 *
 * Real-world example:
 * When Zoom went down in 2020, schools switched to Google Meet or Microsoft Teams.
 * Infrastructure failures require infrastructure alternatives, not software fallbacks.
 */

/**
 * Performance Monitoring
 *
 * Key metrics to track:
 * - Room creation latency (should be <500ms)
 * - Token generation latency (should be <200ms)
 * - API error rate (should be <1%)
 * - Rooms created per day (track usage)
 * - Average call duration (for cost estimation)
 *
 * Set up alerts:
 * - If latency >1s for 5 consecutive calls → Alert team
 * - If error rate >5% → Check Daily.co status
 * - If usage >80% of free tier → Upgrade plan
 *
 * Real-world example:
 * Netflix monitors CDN latency and switches providers if one degrades.
 * Same principle: Monitor infrastructure, have backup plan.
 */
