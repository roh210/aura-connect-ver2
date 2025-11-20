/**
 * AI Routes
 *
 * Handles all AI-related endpoints:
 * - POST /api/ai/icebreaker → Generate conversation starter
 * - POST /api/ai/stress → Analyze stress level (0-100)
 * - POST /api/ai/safety → Check message for crisis indicators
 * - POST /api/ai/intervention → Decide if proactive outreach needed
 *
 * Architecture:
 * - Routes define URL structure
 * - Controllers handle request/response
 * - OpenAI service (already built) handles AI logic
 *
 * Real-world example:
 * Similar to OpenAI API (/completions, /embeddings, /moderations)
 */

import { Router } from "express";
import {
  generateIcebreakerEndpoint,
  analyzeStressEndpoint,
  checkSafetyEndpoint,
  shouldInterveneEndpoint,
} from "../controllers/ai.controller";
import {
  validateIcebreaker,
  validateStress,
  validateSafety,
  validateIntervention,
} from "../middleware/validation";

const router = Router();

/**
 * POST /api/ai/icebreaker
 *
 * Generate personalized conversation starter
 *
 * Request body:
 * {
 *   "studentName": "Alex",
 *   "studentBio": "22, studying CS, stressed about exams",
 *   "seniorName": "Margaret",
 *   "seniorBio": "75, retired teacher, loves gardening"
 * }
 *
 * Response (200 OK):
 * {
 *   "icebreaker": "Alex, I heard you're studying computer science. As a former teacher, I'm curious—what's the most challenging concept you're learning right now?"
 * }
 *
 * Model: GPT-4o (creative task, needs high quality)
 * Cost: ~$0.014 per request (~1.4¢)
 */
router.post("/icebreaker", validateIcebreaker, generateIcebreakerEndpoint);

/**
 * POST /api/ai/stress
 *
 * Analyze text for stress level
 *
 * Request body:
 * {
 *   "text": "I have 3 exams tomorrow and I haven't slept in 2 days. I can't do this anymore."
 * }
 *
 * Response (200 OK):
 * {
 *   "stressLevel": 85,
 *   "severity": "high"
 * }
 *
 * Model: GPT-3.5 Turbo (simple classification, cost-optimized)
 * Cost: ~$0.001 per request (~0.1¢)
 */
router.post("/stress", validateStress, analyzeStressEndpoint);

/**
 * POST /api/ai/safety
 *
 * Check message for crisis indicators (self-harm, suicide)
 *
 * Request body:
 * {
 *   "message": "I don't see the point anymore. Nothing matters."
 * }
 *
 * Response (200 OK):
 * {
 *   "safe": false,
 *   "severity": "high",
 *   "flags": ["suicidal ideation", "hopelessness"]
 * }
 *
 * Model: GPT-4o (high accuracy critical for safety)
 * Cost: ~$0.010 per request (~1¢)
 *
 * What happens if unsafe:
 * - Frontend shows 988 Suicide & Crisis Lifeline
 * - Senior notified immediately
 * - Session flagged for review
 */
router.post("/safety", validateSafety, checkSafetyEndpoint);

/**
 * POST /api/ai/intervention
 *
 * Decide if proactive outreach needed
 *
 * Request body:
 * {
 *   "userId": "user_123",
 *   "recentMessages": ["I'm so tired", "Nothing is working", "I give up"],
 *   "stressLevel": 85,
 *   "lastActiveHours": 72
 * }
 *
 * Response (200 OK):
 * {
 *   "shouldIntervene": true,
 *   "urgency": "high",
 *   "suggestedMessage": "Hi Alex, we noticed you haven't been active in 3 days..."
 * }
 *
 * Model: GPT-4o (complex decision-making)
 * Cost: ~$0.015 per request (~1.5¢)
 */
router.post("/intervention", validateIntervention, shouldInterveneEndpoint);

const aiRoutes = router;
export default aiRoutes;
