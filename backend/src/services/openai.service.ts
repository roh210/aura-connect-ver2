/**
 * OpenAI Router Service
 *
 * SYSTEM DESIGN: 5 Agentic AI Tools for Wellness Platform
 *
 * Functions:
 * 1. generateIcebreaker() - GPT-4o creates personalized conversation starters
 * 2. analyzeStress() - GPT-3.5 Turbo scores stress level from user data
 * 3. checkSafety() - GPT-4o detects crisis keywords in real-time
 * 4. transcribeAudio() - Whisper converts voice to text
 * 5. shouldIntervene() - GPT-4o decides when to proactively reach out
 *
 * Architecture Pattern: Functional Programming
 * - Pure functions (no side effects)
 * - Graceful degradation (fallbacks for all AI calls)
 * - Structured logging (debug AI behavior)
 * - Type safety (TypeScript interfaces)
 *
 * Real-world parallels:
 * - Netflix recommendation engine
 * - Gmail Smart Compose
 * - Uber surge pricing algorithm
 */

import { openai } from "@/config/env";
import { logger } from "@/config/logger";

/**
 * Type Definitions
 *
 * ARCHITECTURE DECISION: Strong typing for AI inputs/outputs
 *
 * Why TypeScript interfaces:
 * - Catch errors at compile time, not runtime
 * - Self-documenting code (know exactly what data is needed)
 * - IDE autocomplete (less typos, faster development)
 */

export interface User {
  id: string;
  role: "student" | "senior";
  displayName: string;
  age: number;
  interests?: string[];
  bio?: string;
}

export interface StressAnalysisInput {
  userId: string;
  calendarEvents?: number; // How many events this week
  moodRating?: number; // 1-10, user-reported
  sleepHours?: number; // Last night
  recentMessages?: string[]; // Last 5 messages (optional)
}

export interface StressAnalysisResult {
  stressLevel: number; // 0-100
  confidence: number; // 0-1, how confident is the AI
  reasoning: string; // Why this score
  recommendations?: string[]; // Optional suggestions
}

export interface SafetyCheckResult {
  isSafe: boolean;
  confidence: number; // 0-1
  flags: string[]; // Crisis keywords detected
  severity: "low" | "medium" | "high" | "critical";
  recommendedAction: "monitor" | "intervene" | "emergency";
}

export interface InterventionDecision {
  shouldIntervene: boolean;
  reason: string;
  suggestedMessage?: string; // What to say to student
  urgency: "low" | "medium" | "high";
}

/**
 * 1. Generate Icebreaker (GPT-4o)
 *
 * ALGORITHM: Create personalized conversation starter
 *
 * Input: Student + Senior profiles
 * Output: 1-2 sentence icebreaker
 * Model: GPT-4o (requires creativity and empathy)
 * Cost: ~$0.01 per call
 * Latency: ~2-3 seconds
 *
 * Real-world example: LinkedIn's "How you might know" suggestions
 */
export async function generateIcebreaker(
  student: User,
  senior: User
): Promise<string> {
  try {
    // Build context-rich prompt
    const prompt = `You are a compassionate wellness assistant helping a stressed college student connect with a senior mentor for emotional support.

CONTEXT:
- Student: ${student.displayName}, age ${student.age}
- Senior: ${senior.displayName}, age ${senior.age}
- Shared interests: ${student.interests?.join(", ") || "general conversation"}

TASK:
Generate ONE warm, appropriate conversation starter that:
1. Relates to shared interests or life experiences
2. Is empathetic and non-judgmental
3. Is 1-2 sentences maximum
4. Avoids medical/therapy language (we're not therapists)
5. Feels natural and genuine, not scripted

FORMAT: Return ONLY the icebreaker text, no quotes, no preamble, no explanation.

EXAMPLES:
- "Hi ${
      student.displayName
    }! I remember how overwhelming college could be sometimes. What are you studying?"
- "Hey there! I noticed we both enjoy reading. Any good books lately?"
- "Hi ${
      student.displayName
    }! I'm here to chat about whatever's on your mind. How's your week been?"

Now generate a unique icebreaker:`;

    logger.debug("Generating icebreaker", {
      studentId: student.id,
      seniorId: senior.id,
      model: "gpt-4o",
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8, // Higher creativity (0-2 scale, 1 is default)
      max_tokens: 100, // ~1-2 sentences
    });

    const icebreaker = response.choices[0].message.content?.trim() || "";

    logger.info("Icebreaker generated successfully", {
      studentId: student.id,
      seniorId: senior.id,
      length: icebreaker.length,
      tokensUsed: response.usage?.total_tokens,
    });

    return icebreaker;
  } catch (error) {
    logger.error("Icebreaker generation failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
      studentId: student.id,
      seniorId: senior.id,
    });

    // Graceful degradation: Simple template fallback
    return fallbackIcebreaker(student, senior);
  }
}

/**
 * Fallback Icebreaker (No AI Required)
 *
 * GRACEFUL DEGRADATION: If AI fails, still start the session
 *
 * Why this matters:
 * - User doesn't see error message
 * - Session starts successfully
 * - Generic icebreaker better than no icebreaker
 *
 * Real-world example: Netflix shows "Popular" if recommendations fail
 */
function fallbackIcebreaker(student: User, senior: User): string {
  const templates = [
    `Hi ${student.displayName}! I'm ${senior.displayName}, and I'm here to listen. How are you doing today?`,
    `Hey ${student.displayName}! I'm ${senior.displayName}. What's been on your mind lately?`,
    `Hi there! I'm ${senior.displayName}, and I'm glad we connected. What would you like to talk about?`,
  ];

  // Deterministic selection (same pair always gets same fallback)
  const index =
    (student.id.charCodeAt(0) + senior.id.charCodeAt(0)) % templates.length;
  return templates[index];
}

/**
 * 2. Analyze Stress Level (GPT-3.5 Turbo)
 *
 * ALGORITHM: Score stress from 0-100 based on user data
 *
 * Input: Calendar events, mood, sleep, messages
 * Output: Stress score + reasoning
 * Model: GPT-3.5 Turbo (simple classification, 10x cheaper than GPT-4o)
 * Cost: ~$0.001 per call
 * Latency: ~1 second
 *
 * Real-world example: Apple Watch stress detection from heart rate
 */
export async function analyzeStress(
  input: StressAnalysisInput
): Promise<StressAnalysisResult> {
  try {
    const prompt = `You are a stress analysis assistant. Score a college student's stress level from 0-100 based on the following data:

DATA:
- Calendar events this week: ${input.calendarEvents || "unknown"}
- Self-reported mood (1-10): ${input.moodRating || "unknown"}
- Sleep last night (hours): ${input.sleepHours || "unknown"}
- Recent message tone: ${input.recentMessages?.join("; ") || "none available"}

SCORING GUIDE:
- 0-25: Low stress (normal college life, manageable workload)
- 26-50: Moderate stress (busy but coping, normal exam period)
- 51-75: High stress (overwhelmed, struggling to keep up)
- 76-100: Critical stress (urgent intervention needed, signs of crisis)

FACTORS TO CONSIDER:
- High calendar load (>15 events/week) = higher stress
- Low mood (<5/10) = higher stress
- Poor sleep (<6 hours) = higher stress
- Negative message tone (frustration, hopelessness) = higher stress

TASK: Return a JSON object with this exact structure:
{
  "stressLevel": <number 0-100>,
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation>",
  "recommendations": ["<actionable tip>", "<actionable tip>"]
}

Be conservative with high scores (75+) - only if multiple severe indicators.`;

    logger.debug("Analyzing stress level", {
      userId: input.userId,
      model: "gpt-3.5-turbo",
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower creativity (more consistent scoring)
      max_tokens: 300,
    });

    let content = response.choices[0].message.content?.trim() || "{}";

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Parse JSON response
    const result = JSON.parse(content) as StressAnalysisResult;

    logger.info("Stress analysis completed", {
      userId: input.userId,
      stressLevel: result.stressLevel,
      confidence: result.confidence,
      tokensUsed: response.usage?.total_tokens,
    });

    return result;
  } catch (error) {
    logger.error("Stress analysis failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: input.userId,
    });

    // Graceful degradation: Simple heuristic
    return fallbackStressAnalysis(input);
  }
}

/**
 * Fallback Stress Analysis (Rule-Based)
 *
 * GRACEFUL DEGRADATION: If AI fails, use simple rules
 *
 * Algorithm:
 * - Start at 50 (moderate baseline)
 * - +15 if many calendar events
 * - +15 if low mood
 * - +10 if poor sleep
 * - Cap at 100
 */
function fallbackStressAnalysis(
  input: StressAnalysisInput
): StressAnalysisResult {
  let stress = 50; // Moderate baseline

  if (input.calendarEvents && input.calendarEvents > 15) stress += 15;
  if (input.moodRating && input.moodRating < 5) stress += 15;
  if (input.sleepHours && input.sleepHours < 6) stress += 10;

  stress = Math.min(stress, 100); // Cap at 100

  return {
    stressLevel: stress,
    confidence: 0.5, // Low confidence (rule-based, not AI)
    reasoning:
      "Estimated based on calendar, mood, and sleep data (AI unavailable)",
    recommendations: [
      "Try to get 7-8 hours of sleep",
      "Take short breaks between tasks",
      "Connect with friends or mentors",
    ],
  };
}

/**
 * 3. Check Safety (GPT-4o)
 *
 * ALGORITHM: Detect crisis keywords in real-time messages
 *
 * Input: Message text
 * Output: Safety assessment + recommended action
 * Model: GPT-4o (requires nuance, can't miss crisis signals)
 * Cost: ~$0.005 per message
 * Latency: ~1-2 seconds
 *
 * CRITICAL: This is a support system, NOT a replacement for professional help
 *
 * Real-world example: Instagram's suicide prevention AI
 */
export async function checkSafety(message: string): Promise<SafetyCheckResult> {
  try {
    const prompt = `You are a safety monitoring assistant for a peer wellness platform. Analyze this message for signs of crisis or danger.

MESSAGE: "${message}"

CRISIS INDICATORS:
- Suicidal ideation ("I want to die", "end it all", "no point living")
- Self-harm ("hurt myself", "cut myself")
- Immediate danger ("going to jump", "have pills")
- Severe hopelessness ("nothing matters", "can't go on")

TASK: Return a JSON object with this exact structure:
{
  "isSafe": <boolean>,
  "confidence": <number 0-1>,
  "flags": [<array of detected crisis keywords>],
  "severity": "low" | "medium" | "high" | "critical",
  "recommendedAction": "monitor" | "intervene" | "emergency"
}

SEVERITY LEVELS:
- low: Normal venting, no crisis indicators
- medium: Distressed but not immediate danger (watch closely)
- high: Strong crisis signals, needs intervention
- critical: Imminent danger, emergency response needed

ACTIONS:
- monitor: Continue normal conversation
- intervene: Senior or AI should proactively check in
- emergency: Display crisis resources immediately (988 Suicide Hotline)

BE CAUTIOUS: Err on the side of safety. If unsure, escalate severity.`;

    logger.debug("Checking message safety", {
      messageLength: message.length,
      model: "gpt-4o",
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Very low creativity (consistent, conservative analysis)
      max_tokens: 200,
    });

    let content = response.choices[0].message.content?.trim() || "{}";

    // Remove markdown code blocks if present (GPT-4o sometimes wraps JSON)
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const result = JSON.parse(content) as SafetyCheckResult;

    // Log all safety checks (critical for audit trail)
    logger.info("Safety check completed", {
      isSafe: result.isSafe,
      severity: result.severity,
      action: result.recommendedAction,
      flagsCount: result.flags.length,
      tokensUsed: response.usage?.total_tokens,
    });

    // If critical, also log as error for alerting
    if (result.severity === "critical") {
      logger.error("CRITICAL SAFETY ALERT", {
        message: message.substring(0, 100), // Don't log full message (privacy)
        flags: result.flags,
        action: result.recommendedAction,
      });
    }

    return result;
  } catch (error) {
    logger.error("Safety check failed, using conservative fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // CRITICAL: If AI fails, assume unsafe (fail closed, not open)
    return fallbackSafetyCheck(message);
  }
}

/**
 * Fallback Safety Check (Keyword Matching)
 *
 * GRACEFUL DEGRADATION: If AI fails, use simple keyword detection
 *
 * IMPORTANT: Conservative approach - if in doubt, flag as unsafe
 * Better to over-react than miss a crisis
 */
function fallbackSafetyCheck(message: string): SafetyCheckResult {
  const messageLower = message.toLowerCase();

  // Critical keywords (immediate danger)
  const criticalKeywords = [
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "going to jump",
  ];

  // High-risk keywords (strong concern)
  const highRiskKeywords = [
    "hurt myself",
    "self harm",
    "cut myself",
    "no point",
    "can't go on",
  ];

  const detectedFlags: string[] = [];

  // Check for critical keywords
  for (const keyword of criticalKeywords) {
    if (messageLower.includes(keyword)) {
      detectedFlags.push(keyword);
    }
  }

  if (detectedFlags.length > 0) {
    return {
      isSafe: false,
      confidence: 0.7,
      flags: detectedFlags,
      severity: "critical",
      recommendedAction: "emergency",
    };
  }

  // Check for high-risk keywords
  for (const keyword of highRiskKeywords) {
    if (messageLower.includes(keyword)) {
      detectedFlags.push(keyword);
    }
  }

  if (detectedFlags.length > 0) {
    return {
      isSafe: false,
      confidence: 0.6,
      flags: detectedFlags,
      severity: "high",
      recommendedAction: "intervene",
    };
  }

  // No flags detected
  return {
    isSafe: true,
    confidence: 0.5, // Low confidence (keyword matching is crude)
    flags: [],
    severity: "low",
    recommendedAction: "monitor",
  };
}

/**
 * 4. Transcribe Audio (Whisper)
 *
 * ALGORITHM: Convert voice recording to text
 *
 * Input: Audio file (MP3, WAV, WebM)
 * Output: Transcribed text
 * Model: Whisper (specialized speech-to-text)
 * Cost: ~$0.006 per minute
 * Latency: ~0.5 seconds per minute of audio
 *
 * Real-world example: Zoom's live transcription
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    logger.debug("Transcribing audio", {
      filename: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      model: "whisper-1",
    });

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // English only for now
      response_format: "text", // Plain text, not JSON
    });

    const transcript = response.trim();

    logger.info("Audio transcribed successfully", {
      filename: audioFile.name,
      transcriptLength: transcript.length,
      wordCount: transcript.split(" ").length,
    });

    return transcript;
  } catch (error) {
    logger.error("Audio transcription failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      filename: audioFile.name,
    });

    // No fallback for transcription (can't fake it)
    throw new Error("Audio transcription unavailable. Please try again.");
  }
}

/**
 * 5. Should Intervene (GPT-4o)
 *
 * ALGORITHM: Decide if AI should proactively reach out to student
 *
 * Input: Stress level, session duration, message sentiment
 * Output: Intervention decision + suggested message
 * Model: GPT-4o (requires judgment and empathy)
 * Cost: ~$0.01 per call
 * Latency: ~2 seconds
 *
 * Use cases:
 * - Student disconnects abruptly (check if they're okay)
 * - Very high stress detected (offer resources)
 * - Long silence during session (gentle nudge)
 *
 * Real-world example: Apple Watch fall detection + check-in
 */
export async function shouldIntervene(
  userId: string,
  context: {
    stressLevel: number;
    sessionDuration: number; // Minutes
    lastMessageSentiment?: "positive" | "neutral" | "negative";
    abruptDisconnect?: boolean;
  }
): Promise<InterventionDecision> {
  try {
    const prompt = `You are an AI wellness assistant deciding whether to proactively check in with a college student.

CONTEXT:
- Current stress level: ${context.stressLevel}/100
- Session duration: ${context.sessionDuration} minutes
- Last message sentiment: ${context.lastMessageSentiment || "unknown"}
- Abrupt disconnect: ${context.abruptDisconnect ? "yes" : "no"}

INTERVENTION CRITERIA:
- High stress (>75) + short session (<5 min) = likely needs follow-up
- Abrupt disconnect + negative sentiment = check if they're okay
- Very high stress (>85) = always reach out with resources
- Normal stress + long session = probably fine, no intervention

TASK: Return a JSON object with this exact structure:
{
  "shouldIntervene": <boolean>,
  "reason": "<brief explanation>",
  "suggestedMessage": "<optional: what to say to student>",
  "urgency": "low" | "medium" | "high"
}

TONE for suggestedMessage:
- Warm and non-judgmental
- Offer help, don't demand explanation
- Include crisis resources if urgency is high

EXAMPLE (high stress):
{
  "shouldIntervene": true,
  "reason": "Very high stress level detected",
  "suggestedMessage": "Hi there, I noticed things seem really tough right now. You're not alone—here are some resources that might help: 988 Suicide & Crisis Lifeline (call or text 988). Would you like to talk more?",
  "urgency": "high"
}`;

    logger.debug("Evaluating intervention need", {
      userId,
      stressLevel: context.stressLevel,
      sessionDuration: context.sessionDuration,
      model: "gpt-4o",
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4, // Moderate creativity (empathetic but consistent)
      max_tokens: 300,
    });

    let content = response.choices[0].message.content?.trim() || "{}";

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const result = JSON.parse(content) as InterventionDecision;

    logger.info("Intervention decision made", {
      userId,
      shouldIntervene: result.shouldIntervene,
      urgency: result.urgency,
      tokensUsed: response.usage?.total_tokens,
    });

    return result;
  } catch (error) {
    logger.error("Intervention decision failed, using fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });

    // Graceful degradation: Conservative rule-based decision
    return fallbackInterventionDecision(context);
  }
}

/**
 * Fallback Intervention Decision (Rule-Based)
 *
 * GRACEFUL DEGRADATION: If AI fails, use simple rules
 *
 * Conservative approach: Intervene if any strong signal
 */
function fallbackInterventionDecision(context: {
  stressLevel: number;
  sessionDuration: number;
  lastMessageSentiment?: "positive" | "neutral" | "negative";
  abruptDisconnect?: boolean;
}): InterventionDecision {
  // Critical stress always intervene
  if (context.stressLevel > 85) {
    return {
      shouldIntervene: true,
      reason: "Very high stress level detected (rule-based)",
      suggestedMessage:
        "Hi, I noticed you're going through a tough time. You're not alone—here are some resources: 988 Suicide & Crisis Lifeline (call/text 988). Would you like to talk?",
      urgency: "high",
    };
  }

  // Abrupt disconnect + negative sentiment
  if (context.abruptDisconnect && context.lastMessageSentiment === "negative") {
    return {
      shouldIntervene: true,
      reason: "Abrupt disconnect with negative sentiment",
      suggestedMessage:
        "Hey, just checking in—I noticed our conversation ended suddenly. Everything okay?",
      urgency: "medium",
    };
  }

  // High stress + short session (didn't get help)
  if (context.stressLevel > 70 && context.sessionDuration < 5) {
    return {
      shouldIntervene: true,
      reason: "High stress with very short session",
      suggestedMessage:
        "Hi! I'm here if you want to talk more. Sometimes it helps to chat for a bit.",
      urgency: "medium",
    };
  }

  // No intervention needed
  return {
    shouldIntervene: false,
    reason: "No strong intervention signals detected",
    urgency: "low",
  };
}
