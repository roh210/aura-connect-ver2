/**
 * AI Controller
 *
 * Handles AI service endpoints
 *
 * Responsibilities:
 * - Call OpenAI service functions
 * - Handle errors gracefully
 * - Format responses
 *
 * Architecture:
 * Routes → Controllers → OpenAI Service → OpenRouter API
 */

import { Request, Response, NextFunction } from "express";
import {
  generateIcebreaker,
  analyzeStress,
  checkSafety,
  shouldIntervene,
} from "../services/openai.service";
import { logger } from "../config/logger";

/**
 * POST /api/ai/icebreaker
 *
 * Generate personalized conversation starter
 */
export const generateIcebreakerEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentName, studentBio, seniorName, seniorBio } = req.body;

    const icebreaker = await generateIcebreaker(
      { name: studentName, bio: studentBio || "" },
      { name: seniorName, bio: seniorBio || "" }
    );

    logger.info("Icebreaker generated", {
      studentName,
      seniorName,
    });

    res.json({ icebreaker });
  } catch (error: any) {
    logger.error("Failed to generate icebreaker", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};

/**
 * POST /api/ai/stress
 *
 * Analyze text for stress level
 */
export const analyzeStressEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;

    const result = await analyzeStress(text);

    logger.info("Stress analyzed", {
      stressLevel: result.stressLevel,
      severity: result.severity,
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Failed to analyze stress", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};

/**
 * POST /api/ai/safety
 *
 * Check message for crisis indicators
 */
export const checkSafetyEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;

    const result = await checkSafety(message);

    logger.info("Safety check completed", {
      safe: result.safe,
      severity: result.severity,
      flags: result.flags,
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Failed to check safety", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};

/**
 * POST /api/ai/intervention
 *
 * Decide if proactive outreach needed
 */
export const shouldInterveneEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, recentMessages, stressLevel, lastActiveHours } = req.body;

    const result = await shouldIntervene(userId, {
      recentMessages,
      stressLevel,
      lastActiveHours,
    });

    logger.info("Intervention decision made", {
      userId,
      shouldIntervene: result.shouldIntervene,
      urgency: result.urgency,
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Failed to decide intervention", {
      error: error.message,
      body: req.body,
    });

    next(error);
  }
};
