/**
 * Socket Event Handlers
 *
 * Handles all WebSocket events:
 * - Student joins queue
 * - Senior accepts match
 * - Session lifecycle
 * - Disconnections
 *
 * Architecture:
 * Each handler is a pure function that takes:
 * - io: Socket.io server (to broadcast)
 * - socket: Individual client socket
 * - data: Event payload
 *
 * Real-world example:
 * Like API endpoints, but for real-time events
 */

import { Server, Socket } from "socket.io";
import { logger } from "../config/logger";
import { db } from "../config/firebase";
import {
  activeStudents,
  activeSeniors,
  activeSessions,
} from "./socket.service";
import {
  addStudentToQueue,
  removeStudentFromQueue,
  findStudentInQueue,
  calculateWaitTime,
} from "./matching.service";

/**
 * Handle: student_join_queue
 *
 * When student clicks "Find Senior"
 *
 * Flow:
 * 1. Add student to waiting queue
 * 2. Broadcast to all available seniors
 * 3. Send confirmation to student
 *
 * @param io - Socket.io server
 * @param socket - Student's socket
 * @param data - Student info
 */
export const handleStudentJoinQueue = (
  io: Server,
  socket: Socket,
  data: {
    userId: string;
    name: string;
    stressLevel?: number;
    preferences?: any;
  }
) => {
  logger.info("Student joining queue", {
    socketId: socket.id,
    userId: data.userId,
  });

  // Add to queue
  const position = addStudentToQueue({
    socketId: socket.id,
    userId: data.userId,
    name: data.name,
    stressLevel: data.stressLevel,
    preferences: data.preferences,
    joinedAt: Date.now(),
  });

  // Update student status
  const student = activeStudents.get(socket.id);
  if (student) {
    student.status = "waiting";
  }

  // Broadcast to all available seniors
  io.to("available_seniors").emit("student_waiting", {
    studentId: data.userId,
    studentName: data.name,
    stressLevel: data.stressLevel || 50,
    waitTime: 0,
    position,
  });

  // Confirm to student
  socket.emit("queue_joined", {
    success: true,
    position,
    estimatedWaitSeconds: calculateWaitTime(),
    message: `You're #${position} in queue. A senior will connect with you soon.`,
  });

  logger.info("Student added to queue successfully", {
    studentId: data.userId,
    position,
  });
};

/**
 * Handle: senior_available
 *
 * When senior marks themselves as available
 *
 * Flow:
 * 1. Add senior to "available_seniors" room
 * 2. Send current queue to senior
 * 3. Update senior status
 *
 * @param io - Socket.io server
 * @param socket - Senior's socket
 * @param data - Senior info
 */
export const handleSeniorAvailable = (
  io: Server,
  socket: Socket,
  data: { userId: string; name: string }
) => {
  logger.info("Senior marked as available", {
    socketId: socket.id,
    userId: data.userId,
  });

  // Join available seniors room
  socket.join("available_seniors");

  // Update senior status
  const senior = activeSeniors.get(socket.id);
  if (senior) {
    senior.status = "available";
  }

  // Send current waiting queue to senior
  const { waitingStudents } = require("./matching.service");
  socket.emit("queue_update", {
    waitingStudents: waitingStudents.map((s: any) => ({
      userId: s.userId,
      name: s.name,
      stressLevel: s.stressLevel,
      waitTime: Math.floor((Date.now() - s.joinedAt) / 1000),
    })),
  });

  logger.info("Senior is now available for matching", {
    seniorId: data.userId,
  });
};

/**
 * Handle: senior_accept
 *
 * When senior clicks "Accept" on a waiting student
 *
 * Flow:
 * 1. Find student in queue
 * 2. Remove student from queue
 * 3. Create session (REST API call)
 * 4. Notify both student and senior with room details
 * 5. Update statuses
 *
 * This is the most complex handler!
 *
 * @param io - Socket.io server
 * @param socket - Senior's socket
 * @param data - Match details
 */
export const handleSeniorAccept = async (
  io: Server,
  socket: Socket,
  data: {
    studentId: string;
    seniorId: string;
    seniorName: string;
  }
) => {
  logger.info("Senior accepting match", {
    seniorId: data.seniorId,
    studentId: data.studentId,
  });

  // Find student in queue
  const student = findStudentInQueue(data.studentId);

  if (!student) {
    logger.warn("Student not found in queue", {
      studentId: data.studentId,
    });
    socket.emit("match_failed", {
      error: "Student is no longer available",
    });
    return;
  }

  // Remove student from queue
  removeStudentFromQueue(student.socketId);

  // Update statuses
  const studentConnection = activeStudents.get(student.socketId);
  const seniorConnection = activeSeniors.get(socket.id);

  if (studentConnection) {
    studentConnection.status = "matched";
  }
  if (seniorConnection) {
    seniorConnection.status = "in-call";
  }

  try {
    // Create session via REST API (creates room + icebreaker + saves to Firestore)
    const sessionData = await createSession({
      studentId: data.studentId,
      seniorId: data.seniorId,
      studentName: student.name,
      seniorName: data.seniorName,
    });

    // Track active session
    activeSessions.set(sessionData.sessionId, {
      sessionId: sessionData.sessionId,
      studentSocketId: student.socketId,
      seniorSocketId: socket.id,
      startedAt: Date.now(),
      status: "active",
    });

    // Update senior connection
    if (seniorConnection) {
      seniorConnection.currentSessionId = sessionData.sessionId;
    }

    // Notify student - they got matched!
    io.to(student.socketId).emit("matched", {
      seniorId: data.seniorId,
      seniorName: data.seniorName,
      sessionId: sessionData.sessionId,
      roomUrl: sessionData.roomUrl,
      token: sessionData.studentToken,
      icebreaker: sessionData.icebreaker,
      message: `You've been matched with ${data.seniorName}! Connecting...`,
    });

    // Notify senior - match confirmed
    socket.emit("matched", {
      studentId: data.studentId,
      studentName: student.name,
      sessionId: sessionData.sessionId,
      roomUrl: sessionData.roomUrl,
      token: sessionData.seniorToken,
      icebreaker: sessionData.icebreaker,
      message: `You've been matched with ${student.name}!`,
    });

    // Both join session room for monitoring
    io.sockets.sockets
      .get(student.socketId)
      ?.join(`session_${sessionData.sessionId}`);
    socket.join(`session_${sessionData.sessionId}`);

    // Remove senior from available pool
    socket.leave("available_seniors");

    // Notify other seniors this student was taken
    io.to("available_seniors").emit("student_taken", {
      studentId: data.studentId,
    });

    logger.info("Match successful", {
      sessionId: sessionData.sessionId,
      studentId: data.studentId,
      seniorId: data.seniorId,
    });
  } catch (error) {
    logger.error("Failed to create session", {
      error: error instanceof Error ? error.message : "Unknown error",
      studentId: data.studentId,
      seniorId: data.seniorId,
    });

    // Restore student to queue
    addStudentToQueue(student);

    // Notify both of failure
    io.to(student.socketId).emit("match_failed", {
      error: "Failed to create session. Please try again.",
    });
    socket.emit("match_failed", {
      error: "Failed to create session. Please try again.",
    });

    // Restore statuses
    if (studentConnection) studentConnection.status = "waiting";
    if (seniorConnection) seniorConnection.status = "available";
  }
};

/**
 * Handle: session_start
 *
 * When both users have joined the Daily.co room
 *
 * Flow:
 * 1. Confirm session is active
 * 2. Start AI monitoring (future)
 * 3. Log session start
 *
 * @param io - Socket.io server
 * @param socket - User's socket
 * @param data - Session info
 */
export const handleSessionStart = (
  io: Server,
  socket: Socket,
  data: { sessionId: string }
) => {
  logger.info("Session started", {
    socketId: socket.id,
    sessionId: data.sessionId,
  });

  const session = activeSessions.get(data.sessionId);

  if (session) {
    session.status = "active";

    // Notify both users
    io.to(`session_${data.sessionId}`).emit("session_active", {
      sessionId: data.sessionId,
      startedAt: session.startedAt,
    });
  }
};

/**
 * Handle: safety_alert
 *
 * When AI detects crisis keywords during call
 *
 * Flow:
 * 1. Alert senior with guidance
 * 2. Alert admin dashboard
 * 3. Log incident
 *
 * @param io - Socket.io server
 * @param socket - Socket that detected crisis (usually server-side)
 * @param data - Safety alert details
 */
export const handleSafetyAlert = (
  io: Server,
  socket: Socket,
  data: {
    sessionId: string;
    severity: "low" | "medium" | "high" | "critical";
    reason: string;
    transcript: string;
    guidance?: string;
  }
) => {
  logger.warn("Safety alert triggered", {
    sessionId: data.sessionId,
    severity: data.severity,
  });

  const session = activeSessions.get(data.sessionId);

  if (!session) {
    logger.error("Session not found for safety alert", {
      sessionId: data.sessionId,
    });
    return;
  }

  // Alert senior
  io.to(session.seniorSocketId).emit("safety_alert", {
    severity: data.severity,
    reason: data.reason,
    suggestedResponse:
      data.guidance || "Listen actively and ask if they're safe.",
    timestamp: Date.now(),
  });

  // Alert admin dashboard
  io.to("admin_room").emit("crisis_alert", {
    sessionId: data.sessionId,
    severity: data.severity,
    reason: data.reason,
    transcript: data.transcript,
    timestamp: Date.now(),
  });

  logger.info("Safety alert sent to senior and admin", {
    sessionId: data.sessionId,
  });
};

/**
 * Handle: end_session
 *
 * When student or senior explicitly ends the session
 *
 * Flow:
 * 1. Update session status in Firestore
 * 2. Notify partner that session ended
 * 3. Free senior for new matches
 * 4. Clean up WebSocket tracking
 *
 * @param io - Socket.io server
 * @param socket - User's socket (student or senior)
 * @param data - Session to end
 */
export const handleEndSession = async (
  io: Server,
  socket: Socket,
  data: { sessionId: string; reason?: string }
) => {
  logger.info("User ending session", {
    socketId: socket.id,
    sessionId: data.sessionId,
  });

  const session = activeSessions.get(data.sessionId);

  if (!session) {
    logger.warn("Session not found for end request", {
      sessionId: data.sessionId,
    });
    socket.emit("error", { message: "Session not found" });
    return;
  }

  try {
    // Update session in Firestore
    await db
      .collection("sessions")
      .doc(data.sessionId)
      .update({
        status: "ended",
        endedAt: new Date(),
        endReason: data.reason || "User ended session",
      });

    // Determine who is ending (student or senior)
    const isStudent = socket.id === session.studentSocketId;
    const partnerSocketId = isStudent
      ? session.seniorSocketId
      : session.studentSocketId;

    // Notify partner
    io.to(partnerSocketId).emit("session_ended", {
      sessionId: data.sessionId,
      message: `Your partner has ended the session.`,
      endedBy: isStudent ? "student" : "senior",
    });

    // Confirm to user who ended it
    socket.emit("session_ended", {
      sessionId: data.sessionId,
      message: "Session ended successfully",
      endedBy: "you",
    });

    // Free senior for new matches
    const senior = activeSeniors.get(session.seniorSocketId);
    if (senior) {
      senior.status = "available";
      senior.currentSessionId = undefined;

      // Rejoin available seniors pool
      const seniorSocket = io.sockets.sockets.get(session.seniorSocketId);
      if (seniorSocket) {
        seniorSocket.join("available_seniors");
        seniorSocket.emit("status_changed", {
          status: "available",
          message: "You're now available for new matches",
        });
      }

      logger.info("Senior freed from session", {
        seniorSocketId: session.seniorSocketId,
      });
    }

    // Update student status
    const student = activeStudents.get(session.studentSocketId);
    if (student) {
      student.status = "waiting";
    }

    // Remove from active sessions
    activeSessions.delete(data.sessionId);

    logger.info("Session ended successfully", {
      sessionId: data.sessionId,
    });
  } catch (error) {
    logger.error("Failed to end session", {
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId: data.sessionId,
    });

    socket.emit("error", {
      message: "Failed to end session. Please try again.",
    });
  }
};

/**
 * Handle: disconnect
 *
 * When user closes browser, loses connection, etc.
 *
 * Flow:
 * 1. Remove from active connections
 * 2. If in queue, remove from queue
 * 3. If in call, notify partner
 * 4. Update session status
 *
 * This is critical for cleanup!
 *
 * @param io - Socket.io server
 * @param socket - Disconnected socket
 */
export const handleDisconnect = (io: Server, socket: Socket) => {
  logger.info("Client disconnected", { socketId: socket.id });

  // Check if student
  const student = activeStudents.get(socket.id);
  if (student) {
    // Remove from queue if waiting
    if (student.status === "waiting") {
      removeStudentFromQueue(socket.id);

      logger.info("Student removed from queue due to disconnect", {
        userId: student.userId,
      });
    }

    // If in call, notify senior
    if (student.status === "in-call") {
      // Find which session
      for (const [sessionId, session] of activeSessions) {
        if (session.studentSocketId === socket.id) {
          io.to(session.seniorSocketId).emit("partner_disconnected", {
            message: "Student has disconnected",
            sessionId,
          });

          session.status = "disconnected";

          logger.warn("Student disconnected from active session", {
            sessionId,
            studentId: student.userId,
          });
        }
      }
    }

    activeStudents.delete(socket.id);
  }

  // Check if senior
  const senior = activeSeniors.get(socket.id);
  if (senior) {
    // Remove from available pool
    socket.leave("available_seniors");

    // If in call, notify student
    if (senior.status === "in-call" && senior.currentSessionId) {
      const session = activeSessions.get(senior.currentSessionId);

      if (session) {
        io.to(session.studentSocketId).emit("partner_disconnected", {
          message: "Senior has disconnected",
          sessionId: senior.currentSessionId,
        });

        session.status = "disconnected";

        logger.warn("Senior disconnected from active session", {
          sessionId: senior.currentSessionId,
          seniorId: senior.userId,
        });
      }
    }

    activeSeniors.delete(socket.id);
  }

  logger.info("Disconnect handled", {
    socketId: socket.id,
    remainingStudents: activeStudents.size,
    remainingSeniors: activeSeniors.size,
  });
};

/**
 * Helper: Create session wrapper
 *
 * Converts controller function to work with socket handlers
 */
async function createSession(data: {
  studentId: string;
  seniorId: string;
  studentName: string;
  seniorName: string;
}): Promise<any> {
  // This would normally call the REST API endpoint
  // For now, we'll import the controller directly
  const {
    createSession: createSessionController,
  } = require("../controllers/session.controller");

  // Mock request/response for controller
  const mockReq = {
    body: data,
  };

  let sessionData: any;

  const mockRes = {
    status: () => ({
      json: (data: any) => {
        sessionData = data;
      },
    }),
  };

  await createSessionController(mockReq as any, mockRes as any);

  return sessionData;
}
