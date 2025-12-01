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
  generateSuggestions,
  analyzeStress,
  analyzeSentiment,
  checkSafety,
  shouldIntervene,
} from "../services/openai.service";
import { logger } from "../config/logger";

/**
 * POST /api/ai/icebreaker
 *
 * Generate personalized conversation starter
 * NOTE: This endpoint is deprecated - icebreakers are now generated during session creation
 */
export const generateIcebreakerEndpoint = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Deprecated: Icebreakers are now generated in session.controller.ts
    return res.status(410).json({
      error:
        "This endpoint is deprecated. Icebreakers are generated automatically during session creation.",
    });
  } catch (error: any) {
    return next(error);
  }
};

/**
 * POST /api/ai/suggestions
 *
 * Generate conversation suggestions for seniors
 */
export const generateSuggestionsEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { recentMessages } = req.body;

    // Validate input
    if (!Array.isArray(recentMessages)) {
      return res.status(400).json({
        error: "recentMessages must be an array",
      });
    }

    const suggestions = await generateSuggestions(recentMessages);

    logger.info("Suggestions generated", {
      messageCount: recentMessages.length,
      suggestionCount: suggestions.length,
    });

    res.json({ suggestions });
  } catch (error: any) {
    logger.error("Failed to generate suggestions", {
      error: error.message,
      body: req.body,
    });

    return next(error);
  }
};

/**
 * POST /api/ai/crisis
 *
 * Detect crisis keywords in student message
 */
export const detectCrisisEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message must be a non-empty string",
      });
    }

    // Use existing checkSafety function (has AI + fallback)
    const result = await checkSafety(message);

    logger.info("Crisis detection completed", {
      isSafe: result.isSafe,
      severity: result.severity,
      flagCount: result.flags.length,
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Failed to detect crisis", {
      error: error.message,
      body: req.body,
    });

    return next(error);
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
      confidence: result.confidence,
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
      isSafe: result.isSafe,
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
    const {
      userId,
      stressLevel,
      sessionDuration,
      lastMessageSentiment,
      abruptDisconnect,
    } = req.body;

    const result = await shouldIntervene(userId, {
      stressLevel,
      sessionDuration,
      lastMessageSentiment,
      abruptDisconnect,
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

/**
 * POST /api/ai/sentiment
 *
 * Analyze sentiment of student messages
 */
export const analyzeSentimentEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be an array of strings",
      });
    }

    const result = await analyzeSentiment(messages);

    logger.info("Sentiment analysis completed", {
      messageCount: messages.length,
      score: result.score,
      trend: result.trend,
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Failed to analyze sentiment", {
      error: error.message,
      body: req.body,
    });

    return next(error);
  }
};
