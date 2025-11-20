/**
 * Validation Middleware
 *
 * Validates request bodies using Joi schemas
 *
 * Why validate:
 * - Prevent bad data from reaching business logic
 * - Fail fast with clear error messages
 * - Security (prevent injection attacks, invalid data)
 *
 * Real-world example:
 * Stripe validates payment amounts (positive, max 2 decimals)
 * GitHub validates repo names (alphanumeric, no spaces)
 * Same principle—validate at API boundary
 */

import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger } from "../config/logger";

/**
 * Generic validation middleware factory
 *
 * Takes a Joi schema, returns Express middleware
 *
 * Usage:
 * const validateCreateSession = validate(createSessionSchema);
 * router.post('/sessions', validateCreateSession, createSession);
 */
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just first
      stripUnknown: true, // Remove unknown fields (security)
    });

    if (error) {
      // Log validation error
      logger.warn("Validation failed", {
        errors: error.details.map((detail) => detail.message),
        body: req.body,
        url: req.url,
      });

      // Return 400 Bad Request with error details
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    // Replace req.body with validated/sanitized value
    req.body = value;

    // Continue to next middleware/route handler
    next();
  };
};

/**
 * ======================
 * SESSION SCHEMAS
 * ======================
 */

/**
 * Create session schema
 *
 * Required fields:
 * - studentId: User ID (string)
 * - studentName: Display name (string)
 * - seniorId: User ID (string)
 * - seniorName: Display name (string)
 */
const createSessionSchema = Joi.object({
  studentId: Joi.string().required().messages({
    "any.required": "Student ID is required",
    "string.empty": "Student ID cannot be empty",
  }),
  studentName: Joi.string().required().messages({
    "any.required": "Student name is required",
    "string.empty": "Student name cannot be empty",
  }),
  seniorId: Joi.string().required().messages({
    "any.required": "Senior ID is required",
    "string.empty": "Senior ID cannot be empty",
  }),
  seniorName: Joi.string().required().messages({
    "any.required": "Senior name is required",
    "string.empty": "Senior name cannot be empty",
  }),
});

export const validateCreateSession = validate(createSessionSchema);

/**
 * ======================
 * AI SCHEMAS
 * ======================
 */

/**
 * Icebreaker schema
 */
const icebreakerSchema = Joi.object({
  studentName: Joi.string().required(),
  studentBio: Joi.string().optional().allow(""),
  seniorName: Joi.string().required(),
  seniorBio: Joi.string().optional().allow(""),
});

export const validateIcebreaker = validate(icebreakerSchema);

/**
 * Stress analysis schema
 */
const stressSchema = Joi.object({
  text: Joi.string().required().min(1).max(5000).messages({
    "any.required": "Text is required",
    "string.empty": "Text cannot be empty",
    "string.max": "Text must be less than 5000 characters",
  }),
});

export const validateStress = validate(stressSchema);

/**
 * Safety check schema
 */
const safetySchema = Joi.object({
  message: Joi.string().required().min(1).max(5000).messages({
    "any.required": "Message is required",
    "string.empty": "Message cannot be empty",
    "string.max": "Message must be less than 5000 characters",
  }),
});

export const validateSafety = validate(safetySchema);

/**
 * Intervention schema
 */
const interventionSchema = Joi.object({
  userId: Joi.string().required(),
  recentMessages: Joi.array().items(Joi.string()).optional(),
  stressLevel: Joi.number().min(0).max(100).optional(),
  lastActiveHours: Joi.number().min(0).optional(),
});

export const validateIntervention = validate(interventionSchema);

/**
 * ======================
 * VOICE SCHEMAS
 * ======================
 */

/**
 * Create room schema
 */
const createRoomSchema = Joi.object({
  sessionId: Joi.string().required(),
  studentName: Joi.string().required(),
  seniorName: Joi.string().required(),
});

export const validateCreateRoom = validate(createRoomSchema);

/**
 * Generate token schema
 */
const generateTokenSchema = Joi.object({
  roomName: Joi.string().required(),
  userId: Joi.string().required(),
  userName: Joi.string().required(),
  role: Joi.string().valid("student", "senior").required().messages({
    "any.only": 'Role must be either "student" or "senior"',
  }),
});

export const validateGenerateToken = validate(generateTokenSchema);
