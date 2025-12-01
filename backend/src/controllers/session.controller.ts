/**
 * Session Controller
 *
 * Handles business logic for session endpoints
 *
 * Responsibilities:
 * - Coordinate between services (Daily.co, OpenAI, Firestore)
 * - Handle errors gracefully
 * - Format responses
 *
 * Architecture:
 * Routes → Controllers → Services → External APIs
 *
 * Real-world example:
 * Netflix: UI → API Gateway → Movie Service → Database
 * Same layered approach
 */

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

import { createRoom } from "../services/daily.service";
import { generateIcebreaker } from "../services/openai.service";
import { db, logger } from "../config";

/**
 * POST /api/sessions
 *
 * Create new session between student and senior
 *
 * What it does:
 * 1. Validate request (done by middleware)
 * 2. Create Daily.co room (voice calling)
 * 3. Generate AI icebreaker (conversation starter)
 * 4. Save session to Firestore
 * 5. Return everything to client
 *
 * Cost: ~$0.047 per request (3¢ voice + 1.4¢ AI)
 * Latency: ~1.5 seconds (700ms room creation + 800ms AI)
 */
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, studentName, seniorId, seniorName } = req.body;

    // Generate unique session ID
    const sessionId = `session_${randomUUID()}`;

    logger.info("Creating session", {
      sessionId,
      studentId,
      seniorId,
    });

    // Step 1: Create Daily.co room (parallel with AI icebreaker for speed)
    const [roomResult, icebreakers] = await Promise.all([
      createRoom(sessionId, studentName, seniorName),
      generateIcebreaker(
        {
          id: studentId,
          role: "student",
          displayName: studentName,
          interests: [],
        },
        { id: seniorId, role: "senior", displayName: seniorName, interests: [] }
      ),
    ]);

    // Step 2: Save session to Firestore
    await db.collection("sessions").doc(sessionId).set({
      sessionId,
      studentId,
      studentName,
      seniorId,
      seniorName,
      roomName: roomResult.roomName,
      roomUrl: roomResult.roomUrl,
      icebreakerForStudent: icebreakers.forStudent,
      icebreakerForSenior: icebreakers.forSenior,
      status: "active",
      createdAt: new Date(),
      expiresAt: roomResult.expiresAt,
    });

    logger.info("Session created successfully", {
      sessionId,
      roomName: roomResult.roomName,
    });

    // Step 3: Return response
    res.status(201).json({
      sessionId,
      roomUrl: roomResult.roomUrl,
      studentToken: roomResult.studentToken,
      seniorToken: roomResult.seniorToken,
      icebreakerForStudent: icebreakers.forStudent,
      icebreakerForSenior: icebreakers.forSenior,
      expiresAt: roomResult.expiresAt,
    });
  } catch (error: any) {
    logger.error("Failed to create session", {
      error: error.message,
      body: req.body,
    });

    next(error); // Pass to error handler middleware
  }
};

/**
 * GET /api/sessions/:id
 *
 * Get session details
 */
export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get session from Firestore
    const sessionDoc = await db.collection("sessions").doc(id).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    const session = sessionDoc.data();

    logger.info("Session retrieved", { sessionId: id });

    res.json(session);
  } catch (error: any) {
    logger.error("Failed to get session", {
      error: error.message,
      sessionId: req.params.id,
    });

    return next(error);
  }
};

/**
 * DELETE /api/sessions/:id
 *
 * End session
 *
 * What it does:
 * 1. Update session status to "ended"
 * 2. Optionally delete Daily.co room (auto-expires anyway)
 */
export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Update session status
    await db.collection("sessions").doc(id).update({
      status: "ended",
      endedAt: new Date(),
    });

    logger.info("Session ended", { sessionId: id });

    // Return 204 No Content (standard for DELETE)
    res.status(204).send();
  } catch (error: any) {
    logger.error("Failed to end session", {
      error: error.message,
      sessionId: req.params.id,
    });

    next(error);
  }
};
