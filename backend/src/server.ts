/**
 * Express Server Setup
 *
 * This is the main Express server that exposes our backend services via REST API.
 *
 * Architecture:
 * - Security: Helmet (HTTP headers), CORS (cross-origin), rate limiting
 * - Middleware: Body parsing, logging, error handling
 * - Routes: /api/sessions, /api/ai, /api/voice
 * - Error handling: Centralized error middleware
 *
 * Design decisions:
 * - Middleware pattern: Composable, reusable request processing
 * - RESTful API: Resource-based URLs, proper HTTP methods
 * - Environment-based config: Different settings for dev vs production
 * - Graceful degradation: API continues working even if services fail
 *
 * Real-world example:
 * This follows the same pattern as Stripe, GitHub, and AWS APIs—
 * security-first, RESTful, and production-ready from day one.
 */

import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";

import { env } from "./config/env";
import { logger } from "./config/logger";
import {
  initializeSocket,
  broadcastLiveStats,
} from "./services/socket.service";
import { initializeSessionCleanup } from "./services/session-cleanup.service";

// Import routes
import sessionRoutes from "./routes/session.routes";
import aiRoutes from "./routes/ai.routes";
import voiceRoutes from "./routes/voice.routes";

/**
 * Initialize Express app
 */
const app = express();

/**
 * ======================
 * SECURITY MIDDLEWARE
 * ======================
 */

/**
 * Helmet: Adds security headers to prevent common attacks
 *
 * Headers added:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 *
 * Real-world attack prevented:
 * Without Helmet, malicious site could embed your app in iframe and steal data.
 * With Helmet, browser refuses to load app in iframe (X-Frame-Options: DENY).
 */
app.use(helmet());

/**
 * CORS: Control which domains can access your API
 *
 * Why needed:
 * Browser security prevents frontend (https://aura-connect.com) from calling
 * API (https://api.aura-connect.com) unless explicitly allowed.
 *
 * Development: Allow all origins (localhost:3000, etc.)
 * Production: Only allow your real frontend domain
 *
 * Real-world attack prevented:
 * Evil site tries to call your API using victim's cookies → Blocked by CORS
 */
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://aura-connect.com" // Only your frontend in production
      : "*", // Allow all origins in development (localhost, etc.)
  credentials: true, // Allow cookies
};
app.use(cors(corsOptions));

/**
 * Rate Limiting: Prevent API abuse and DDoS attacks
 *
 * Limits:
 * - 100 requests per 15 minutes per IP address
 * - Returns 429 Too Many Requests if exceeded
 *
 * Why needed:
 * Without rate limiting, attacker could:
 * - Send 1 million AI requests → $10,000 OpenRouter bill
 * - Overwhelm server → Crash, real users can't access
 *
 * Real-world example:
 * - Twitter API: 300 requests per 15 min
 * - GitHub API: 5,000 requests per hour
 * - Stripe API: 100 requests per second
 *
 * Cost impact:
 * Without rate limiting: Attacker sends 1M AI requests = $371/day
 * With rate limiting: Max 9,600 requests/day per user = Controlled cost
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 min
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
app.use("/api/", limiter); // Apply to all /api/* routes

/**
 * ======================
 * PARSING MIDDLEWARE
 * ======================
 */

/**
 * Body Parser: Parse JSON request bodies
 *
 * Converts:
 * Request body: '{"studentId": "123"}' (string)
 * → req.body: { studentId: "123" } (JavaScript object)
 *
 * Limit: 10mb (prevent attackers sending huge payloads)
 */
app.use(express.json({ limit: "10mb" }));

/**
 * URL-Encoded Parser: Parse form data
 *
 * For requests like: Content-Type: application/x-www-form-urlencoded
 * Example: studentId=123&seniorId=456
 */
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Compression: Gzip responses for faster transfer
 *
 * Reduces response size by ~80% (50 KB → 10 KB)
 *
 * Cost impact:
 * Without compression: 5 GB bandwidth/day = $405/month
 * With compression: 1 GB bandwidth/day = $81/month
 * Savings: $324/month
 *
 * Real-world: All production APIs use compression (Stripe, GitHub, AWS)
 */
app.use(compression());

/**
 * ======================
 * LOGGING MIDDLEWARE
 * ======================
 */

/**
 * Morgan: HTTP request logging
 *
 * Development: Pretty logs for debugging
 * Example: GET /api/sessions 200 15ms
 *
 * Production: JSON logs for aggregation (CloudWatch, DataDog)
 * Example: {"method":"GET","url":"/api/sessions","status":200,"duration":15}
 */
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

/**
 * ======================
 * ROUTES
 * ======================
 */

/**
 * Health check endpoint
 *
 * Used by:
 * - Load balancers (AWS ELB, CloudFlare)
 * - Monitoring tools (UptimeRobot, Pingdom)
 * - Kubernetes liveness/readiness probes
 *
 * Returns 200 if server is healthy, 500 if critical services down
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Seconds since server started
    environment: process.env.NODE_ENV,
  });
});

/**
 * API routes
 *
 * Structure:
 * - /api/sessions → Session management (create, get, end)
 * - /api/ai → AI services (icebreaker, stress, safety, intervention)
 * - /api/voice → Voice calling (create room, get token)
 */
app.use("/api/sessions", sessionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/voice", voiceRoutes);

/**
 * Root endpoint (API documentation link)
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Aura Connect API",
    version: "1.0.0",
    documentation: "https://docs.aura-connect.com",
    health: "/health",
    endpoints: {
      sessions: "/api/sessions",
      ai: "/api/ai",
      voice: "/api/voice",
    },
  });
});

/**
 * ======================
 * ERROR HANDLING
 * ======================
 */

/**
 * 404 Handler: Route not found
 *
 * Catches all requests to non-existent routes
 */
app.use((req: Request, res: Response) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

/**
 * Global Error Handler
 *
 * Catches all errors from routes and middleware
 *
 * Why centralized:
 * - DRY: Don't repeat error handling in every route
 * - Consistent: All errors formatted the same way
 * - Logging: All errors logged automatically
 *
 * Error types:
 * - Validation errors (400 Bad Request)
 * - Authentication errors (401 Unauthorized)
 * - Permission errors (403 Forbidden)
 * - Not found errors (404 Not Found)
 * - Server errors (500 Internal Server Error)
 *
 * Real-world example:
 * Stripe API returns structured errors:
 * { error: { type: "card_error", code: "insufficient_funds", message: "..." } }
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error with full context
  logger.error("Request failed", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    // Include stack trace in development (helpful for debugging)
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/**
 * ======================
 * SERVER STARTUP
 * ======================
 */

const PORT = env.PORT || 3001;

/**
 * Start server
 *
 * Why async:
 * - Can perform async initialization (database warmup, etc.)
 * - Can handle startup errors gracefully
 *
 * What's different from Phase 2.6:
 * - Create HTTP server (not just Express app)
 * - Attach Socket.io to HTTP server
 * - Broadcast live stats every 10 seconds
 */
const startServer = async () => {
  try {
    // Log startup
    logger.info("Starting Aura Connect API server...", {
      port: PORT,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    });

    /**
     * Create HTTP server
     *
     * Why not app.listen()?
     * - Socket.io needs access to the underlying HTTP server
     * - app.listen() creates HTTP server internally, we can't access it
     * - So we create HTTP server explicitly, then attach both Express and Socket.io to it
     */
    const httpServer = createServer(app);

    /**
     * Initialize Socket.io
     *
     * Attaches WebSocket server to HTTP server
     * Now we have both:
     * - REST API (Express) on http://localhost:5000
     * - WebSocket server (Socket.io) on ws://localhost:5000
     */
    const io = initializeSocket(httpServer);

    /**
     * Initialize session cleanup
     *
     * Automatic cleanup of expired and abandoned sessions:
     * - Every 5 min: Mark sessions expired after 1 hour
     * - Every 10 min: Clean up abandoned sessions (never joined)
     * - Daily at 3 AM: Delete sessions older than 30 days
     */
    initializeSessionCleanup(io);

    /**
     * Broadcast live statistics every 10 seconds
     *
     * Sends real-time stats to admin dashboard:
     * - Active students
     * - Active seniors
     * - Waiting queue size
     * - Active sessions
     */
    setInterval(() => {
      broadcastLiveStats(io);
    }, 10000);

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        url: `http://localhost:${PORT}`,
        health: `http://localhost:${PORT}/health`,
        websocket: `ws://localhost:${PORT}`,
      });
    });

    httpServer.on("error", (error: any) => {
      logger.error("Server failed to start", { error: error.message });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1); // Exit with error code
  }
};

/**
 * Handle unhandled promise rejections
 *
 * If any promise rejects without .catch(), log and exit
 *
 * Real-world example:
 * Database connection fails after server starts → Unhandled rejection → Server crashes
 * Better: Log error, alert team, gracefully shutdown
 */
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Promise Rejection", {
    reason,
    stack: reason?.stack,
  });
  // In production, might want to gracefully shutdown
  // process.exit(1);
});

/**
 * Handle uncaught exceptions
 *
 * If any error thrown without try/catch, log and exit
 */
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  // Exit immediately (server in unknown state)
  process.exit(1);
});

// Start server
startServer();

// Export app for testing
export { app };
