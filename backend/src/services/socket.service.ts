/**
 * Socket.io Service
 *
 * Handles WebSocket connections for real-time features:
 * - Student-Senior matching
 * - Live session monitoring
 * - AI safety alerts
 * - Admin dashboard updates
 *
 * Architecture:
 * - Event-driven: Clients emit events, server handles them
 * - Room-based: Users join rooms for targeted messaging
 * - Stateful: Server tracks who's online, who's in calls
 *
 * Real-world comparison:
 * Like Slack - users connect, join channels, send messages in real-time
 */

import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../config/logger";
import { env } from "../config/env";
import {
  handleStudentJoinQueue,
  handleSeniorAccept,
  handleSeniorAvailable,
  handleSessionStart,
  handleDisconnect,
  handleSafetyAlert,
  handleEndSession,
} from "./socket.handlers";

/**
 * Active connections tracking
 *
 * Why track connections:
 * - Know who's online in real-time
 * - Route messages to correct users
 * - Detect disconnections
 * - Show live user counts
 */
export const activeStudents = new Map<string, StudentConnection>();
export const activeSeniors = new Map<string, SeniorConnection>();
export const activeSessions = new Map<string, SessionConnection>();

export interface StudentConnection {
  socketId: string;
  userId: string;
  name: string;
  joinedAt: number;
  status: "waiting" | "matched" | "in-call";
}

export interface SeniorConnection {
  socketId: string;
  userId: string;
  name: string;
  joinedAt: number;
  status: "available" | "in-call";
  currentSessionId?: string;
}

export interface SessionConnection {
  sessionId: string;
  studentSocketId: string;
  seniorSocketId: string;
  startedAt: number;
  status: "active" | "disconnected" | "ended";
}

/**
 * Initialize Socket.io server
 *
 * What happens here:
 * 1. Create Socket.io server attached to HTTP server
 * 2. Configure CORS (allow frontend to connect)
 * 3. Setup connection handler (runs when user connects)
 * 4. Setup event handlers (run when user emits events)
 *
 * @param httpServer - HTTP server from Express
 * @returns Configured Socket.io server
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  logger.info("Initializing Socket.io server...");

  // Create Socket.io server
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Ping clients every 25s to keep connection alive
    pingInterval: 25000,
    // Close connection if no pong received in 60s
    pingTimeout: 60000,
  });

  /**
   * Connection Handler
   *
   * Runs when a client connects
   *
   * Real-world example:
   * Like answering a phone call - connection established,
   * now we listen for what they say (events)
   */
  io.on("connection", (socket: Socket) => {
    logger.info("Client connected", {
      socketId: socket.id,
      ip: socket.handshake.address,
    });

    /**
     * User Identification
     *
     * Client must identify themselves first
     * (student, senior, or admin)
     */
    socket.on(
      "identify",
      (data: { role: string; userId: string; name: string }) => {
        logger.info("User identified", {
          socketId: socket.id,
          role: data.role,
          userId: data.userId,
        });

        if (data.role === "student") {
          activeStudents.set(socket.id, {
            socketId: socket.id,
            userId: data.userId,
            name: data.name,
            joinedAt: Date.now(),
            status: "waiting",
          });
        } else if (data.role === "senior") {
          activeSeniors.set(socket.id, {
            socketId: socket.id,
            userId: data.userId,
            name: data.name,
            joinedAt: Date.now(),
            status: "available",
          });
        } else if (data.role === "admin") {
          socket.join("admin_room");
          logger.info("Admin joined dashboard", { socketId: socket.id });
        }

        // Acknowledge identification
        socket.emit("identified", { success: true, socketId: socket.id });
      }
    );

    /**
     * Student Events
     */
    socket.on("student_join_queue", (data) =>
      handleStudentJoinQueue(io, socket, data)
    );

    /**
     * Senior Events
     */
    socket.on("senior_available", (data) =>
      handleSeniorAvailable(io, socket, data)
    );
    socket.on("senior_accept", (data) => handleSeniorAccept(io, socket, data));

    /**
     * Admin Events
     */
    socket.on("join_admin_room", () => {
      socket.join("admin_room");
      logger.info("Client joined admin room for live stats", {
        socketId: socket.id,
      });

      // Send current stats immediately
      broadcastLiveStats(io);
    });

    /**
     * Session Events
     */
    socket.on("session_start", (data) => handleSessionStart(io, socket, data));
    socket.on("end_session", (data) => handleEndSession(io, socket, data));
    socket.on("safety_alert", (data) => handleSafetyAlert(io, socket, data));

    /**
     * Disconnection Handler
     *
     * Runs when client disconnects (closed browser, lost internet, etc.)
     *
     * Critical for:
     * - Removing from queue
     * - Notifying partner in call
     * - Updating session status
     */
    socket.on("disconnect", () => handleDisconnect(io, socket));
  });

  logger.info("Socket.io server initialized successfully");

  return io;
};

/**
 * Broadcast live statistics to admin dashboard
 *
 * Called every 10 seconds from server.ts
 *
 * Real-world example:
 * Like Google Analytics showing live visitor count
 */
export const broadcastLiveStats = (io: Server) => {
  const stats = {
    activeStudents: activeStudents.size,
    activeSeniors: activeSeniors.size,
    activeSessions: activeSessions.size,
    waitingStudents: Array.from(activeStudents.values()).filter(
      (s) => s.status === "waiting"
    ).length,
    availableSeniors: Array.from(activeSeniors.values()).filter(
      (s) => s.status === "available"
    ).length,
    timestamp: new Date().toISOString(),
  };

  io.to("admin_room").emit("live_stats", stats);

  logger.debug("Broadcasted live stats", stats);
};
