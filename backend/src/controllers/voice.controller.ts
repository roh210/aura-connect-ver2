/**
 * Voice Controller
 *
 * Handles voice calling endpoints
 *
 * Responsibilities:
 * - Call Daily.co service functions
 * - Handle errors gracefully
 * - Format responses
 *
 * Architecture:
 * Routes → Controllers → Daily.co Service → Daily.co API
 */

import { Request, Response, NextFunction } from "express";
import { createRoom, getToken, getRoomInfo } from "../services/daily.service";
import { logger } from "../config/logger";

/**
 * POST /api/voice/room
 *
 * Create Daily.co voice room
 */
export const createRoomEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, studentName, seniorName } = req.body;

    const result = await createRoom(sessionId, studentName, seniorName);

    logger.info("Voice room created", {
      sessionId,
      roomName: result.roomName,
    });

    res.status(201).json(result);
  } catch (error: any) {
    logger.error("Failed to create room", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};

/**
 * POST /api/voice/token
 *
 * Generate additional access token (for reconnection)
 */
export const generateTokenEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomName, userId, userName, role } = req.body;

    const token = await getToken(roomName, userId, userName, role);

    logger.info("Access token generated", {
      roomName,
      userId,
      role,
    });

    res.json({ token });
  } catch (error: any) {
    logger.error("Failed to generate token", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};

/**
 * GET /api/voice/room/:name
 *
 * Get room info (for debugging, analytics)
 */
export const getRoomInfoEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.params;

    const roomInfo = await getRoomInfo(name);

    logger.info("Room info retrieved", { roomName: name });

    res.json(roomInfo);
  } catch (error: any) {
    logger.error("Failed to get room info", {
      error: error.message,
      roomName: req.params.name,
    });

    next(error);
  }
};
