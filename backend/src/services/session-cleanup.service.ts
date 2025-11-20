/**
 * Session Cleanup Service
 *
 * Handles automatic cleanup of expired and abandoned sessions
 *
 * Features:
 * - Mark sessions as expired after 1 hour
 * - Free seniors from stuck "in-call" status
 * - Clean up WebSocket connections
 * - Run automatically every 5 minutes
 *
 * Why needed:
 * - Prevents seniors from being stuck "in-call" forever
 * - Cleans up sessions where users never joined
 * - Frees up platform capacity
 * - Keeps statistics accurate
 */

import { Server } from "socket.io";
import { db, logger } from "../config";
import {
  activeStudents,
  activeSeniors,
  activeSessions,
} from "./socket.service";

/**
 * Clean up expired sessions
 *
 * Runs every 5 minutes to:
 * 1. Find sessions older than 1 hour
 * 2. Mark them as expired in Firestore
 * 3. Free up seniors for new matches
 * 4. Clean up WebSocket tracking
 *
 * @param io - Socket.io server instance
 */
export const cleanupExpiredSessions = async (io: Server) => {
  try {
    const now = Date.now();
    const oneHourAgo = new Date(now - 3600000); // 1 hour in milliseconds

    logger.debug("Running session cleanup", {
      currentTime: new Date(now).toISOString(),
      expiryThreshold: oneHourAgo.toISOString(),
    });

    // Simplified query: Only filter by createdAt (no index needed)
    // Then filter by status in code
    const oldSessionsSnapshot = await db
      .collection("sessions")
      .where("createdAt", "<", oneHourAgo)
      .get();

    // Filter for active sessions in code
    const expiredSessions = oldSessionsSnapshot.docs.filter(
      (doc) => doc.data().status === "active"
    );

    if (expiredSessions.length === 0) {
      logger.debug("No expired sessions found");
      return;
    }

    logger.info("Found expired sessions", {
      count: expiredSessions.length,
    });

    // Process each expired session
    const cleanupPromises = expiredSessions.map(async (doc) => {
      const sessionData = doc.data();
      const sessionId = doc.id;

      logger.info("Cleaning up expired session", {
        sessionId,
        createdAt: sessionData.createdAt.toDate().toISOString(),
        studentId: sessionData.studentId,
        seniorId: sessionData.seniorId,
      });

      // Update session status in Firestore
      await doc.ref.update({
        status: "expired",
        endedAt: new Date(),
        endReason: "Auto-expired after 1 hour",
      });

      // Clean up WebSocket tracking
      const wsSession = activeSessions.get(sessionId);
      if (wsSession) {
        // Notify both users
        io.to(wsSession.studentSocketId).emit("session_expired", {
          sessionId,
          message: "Session has expired after 1 hour",
        });

        io.to(wsSession.seniorSocketId).emit("session_expired", {
          sessionId,
          message: "Session has expired after 1 hour",
        });

        // Free senior for new matches
        const senior = activeSeniors.get(wsSession.seniorSocketId);
        if (senior) {
          senior.status = "available";
          senior.currentSessionId = undefined;

          // Rejoin available seniors pool
          const seniorSocket = io.sockets.sockets.get(wsSession.seniorSocketId);
          if (seniorSocket) {
            seniorSocket.join("available_seniors");
            seniorSocket.emit("status_changed", {
              status: "available",
              message:
                "Your previous session expired. You're now available for new matches.",
            });
          }

          logger.info("Senior freed from expired session", {
            seniorId: sessionData.seniorId,
            socketId: wsSession.seniorSocketId,
          });
        }

        // Update student status
        const student = activeStudents.get(wsSession.studentSocketId);
        if (student) {
          student.status = "waiting";
        }

        // Remove from active sessions
        activeSessions.delete(sessionId);
      }
    });

    await Promise.all(cleanupPromises);

    logger.info("Session cleanup completed", {
      cleanedSessions: expiredSessions.length,
    });
  } catch (error) {
    logger.error("Session cleanup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Clean up abandoned sessions (created but never joined)
 *
 * Runs every 10 minutes to find sessions where:
 * - Created > 10 minutes ago
 * - Status still "active"
 * - No users ever joined the voice room
 *
 * This happens when:
 * - Match created, but student closed browser before joining
 * - Daily.co room creation succeeded, but users had network issues
 * - WebSocket disconnected during match notification
 */
export const cleanupAbandonedSessions = async (io: Server) => {
  try {
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 600000); // 10 minutes

    logger.debug("Running abandoned session cleanup", {
      currentTime: new Date(now).toISOString(),
      abandonmentThreshold: tenMinutesAgo.toISOString(),
    });

    // Simplified query: Only filter by createdAt (no index needed)
    // Then filter by status and WebSocket tracking in code
    const oldSessionsSnapshot = await db
      .collection("sessions")
      .where("createdAt", "<", tenMinutesAgo)
      .get();

    const abandonedSessions = oldSessionsSnapshot.docs.filter((doc) => {
      const sessionData = doc.data();
      const sessionId = doc.id;
      // Session is abandoned if: status is active AND not in WebSocket tracking
      return sessionData.status === "active" && !activeSessions.has(sessionId);
    });

    if (abandonedSessions.length === 0) {
      logger.debug("No abandoned sessions found");
      return;
    }

    logger.info("Found abandoned sessions", {
      count: abandonedSessions.length,
    });

    // Mark as abandoned
    const cleanupPromises = abandonedSessions.map(async (doc) => {
      const sessionData = doc.data();
      const sessionId = doc.id;

      logger.info("Marking session as abandoned", {
        sessionId,
        createdAt: sessionData.createdAt.toDate().toISOString(),
      });

      await doc.ref.update({
        status: "abandoned",
        endedAt: new Date(),
        endReason: "Users never joined call",
      });
    });

    await Promise.all(cleanupPromises);

    logger.info("Abandoned session cleanup completed", {
      cleanedSessions: abandonedSessions.length,
    });
  } catch (error) {
    logger.error("Abandoned session cleanup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete old sessions from Firestore (data retention policy)
 *
 * Runs daily to delete sessions older than 30 days
 *
 * Why 30 days:
 * - Recent enough for analytics
 * - Long enough for support requests
 * - Short enough to control costs
 *
 * Exception: Keep flagged sessions forever (safety compliance)
 */
export const deleteOldSessions = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    logger.debug("Running old session deletion", {
      deletionThreshold: thirtyDaysAgo.toISOString(),
    });

    // Simplified query: Only filter by createdAt (no index needed)
    // Then filter by safetyFlagged in code
    const oldSessionsSnapshot = await db
      .collection("sessions")
      .where("createdAt", "<", thirtyDaysAgo)
      .limit(500) // Process in batches (Firestore limit)
      .get();

    // Filter out safety-flagged sessions (keep those forever)
    const sessionsToDelete = oldSessionsSnapshot.docs.filter(
      (doc) => !doc.data().safetyFlagged
    );

    if (sessionsToDelete.length === 0) {
      logger.debug("No old sessions to delete");
      return;
    }

    logger.info("Deleting old sessions", {
      count: sessionsToDelete.length,
    });

    // Delete in batch
    const batch = db.batch();
    sessionsToDelete.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info("Old sessions deleted", {
      deletedCount: sessionsToDelete.length,
    });
  } catch (error) {
    logger.error("Old session deletion failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Initialize cleanup scheduler
 *
 * Sets up automatic cleanup intervals:
 * - Expired sessions: Every 5 minutes
 * - Abandoned sessions: Every 10 minutes
 * - Old sessions: Every 24 hours at 3 AM
 *
 * @param io - Socket.io server instance
 */
export const initializeSessionCleanup = (io: Server) => {
  logger.info("Initializing session cleanup scheduler");

  // Clean expired sessions every 5 minutes
  setInterval(() => {
    cleanupExpiredSessions(io);
  }, 5 * 60 * 1000);

  // Clean abandoned sessions every 10 minutes
  setInterval(() => {
    cleanupAbandonedSessions(io);
  }, 10 * 60 * 1000);

  // Delete old sessions daily at 3 AM
  const scheduleDaily3AM = () => {
    const now = new Date();
    const next3AM = new Date();
    next3AM.setHours(3, 0, 0, 0);

    // If 3 AM already passed today, schedule for tomorrow
    if (now > next3AM) {
      next3AM.setDate(next3AM.getDate() + 1);
    }

    const msUntil3AM = next3AM.getTime() - now.getTime();

    setTimeout(() => {
      deleteOldSessions();
      // Reschedule for next day
      setInterval(deleteOldSessions, 24 * 60 * 60 * 1000);
    }, msUntil3AM);

    logger.info("Scheduled old session deletion", {
      nextRun: next3AM.toISOString(),
    });
  };

  scheduleDaily3AM();

  // Run initial cleanup on startup
  setTimeout(() => {
    logger.info("Running initial session cleanup on startup");
    cleanupExpiredSessions(io);
    cleanupAbandonedSessions(io);
  }, 10000); // Wait 10 seconds after startup

  logger.info("Session cleanup scheduler initialized successfully");
};
