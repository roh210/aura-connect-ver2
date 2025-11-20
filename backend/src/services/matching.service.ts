/**
 * Matching Service
 *
 * Handles student-senior matching logic
 *
 * Matching algorithm:
 * 1. Find all available seniors
 * 2. Filter by preferences (if any)
 * 3. Sort by queue size (fairness)
 * 4. Return best match
 *
 * Real-world comparison:
 * Like Uber - find closest available driver
 */

import { logger } from "../config/logger";
import { activeSeniors, SeniorConnection } from "./socket.service";

export interface QueuedStudent {
  socketId: string;
  userId: string;
  name: string;
  stressLevel?: number;
  preferences?: {
    topic?: string;
    gender?: string;
  };
  joinedAt: number;
}

/**
 * Waiting queue
 *
 * Students waiting for a senior
 * FIFO (First In, First Out) - fair queue
 */
export const waitingStudents: QueuedStudent[] = [];

/**
 * Add student to waiting queue
 *
 * @param student - Student to add
 * @returns Position in queue (1-indexed)
 */
export const addStudentToQueue = (student: QueuedStudent): number => {
  waitingStudents.push(student);

  logger.info("Student added to queue", {
    studentId: student.userId,
    position: waitingStudents.length,
  });

  return waitingStudents.length;
};

/**
 * Remove student from queue
 *
 * Called when:
 * - Student gets matched
 * - Student disconnects
 * - Student cancels
 *
 * @param socketId - Socket ID of student to remove
 */
export const removeStudentFromQueue = (socketId: string): void => {
  const index = waitingStudents.findIndex((s) => s.socketId === socketId);

  if (index !== -1) {
    const student = waitingStudents[index];
    waitingStudents.splice(index, 1);

    logger.info("Student removed from queue", {
      studentId: student.userId,
      wasAtPosition: index + 1,
    });
  }
};

/**
 * Find student in queue
 *
 * @param userId - User ID to search for
 * @returns Student if found, undefined otherwise
 */
export const findStudentInQueue = (
  userId: string
): QueuedStudent | undefined => {
  return waitingStudents.find((s) => s.userId === userId);
};

/**
 * Get queue position
 *
 * @param socketId - Socket ID to search for
 * @returns Position (1-indexed) or -1 if not found
 */
export const getQueuePosition = (socketId: string): number => {
  const index = waitingStudents.findIndex((s) => s.socketId === socketId);
  return index === -1 ? -1 : index + 1;
};

/**
 * Find best available senior
 *
 * Algorithm:
 * 1. Get all available seniors
 * 2. Filter out seniors already in calls
 * 3. Sort by least recent activity (fairness)
 * 4. Return first match
 *
 * Future enhancements:
 * - Match by preferences (topic, gender)
 * - Match by language
 * - Match by availability schedule
 *
 * @returns Available senior or null
 */
export const findAvailableSenior = (): SeniorConnection | null => {
  const available = Array.from(activeSeniors.values()).filter(
    (senior) => senior.status === "available"
  );

  if (available.length === 0) {
    logger.warn("No available seniors");
    return null;
  }

  // Sort by least recently joined (fairness - rotate seniors)
  available.sort((a, b) => a.joinedAt - b.joinedAt);

  const selected = available[0];

  logger.info("Selected senior for matching", {
    seniorId: selected.userId,
    seniorName: selected.name,
  });

  return selected;
};

/**
 * Calculate estimated wait time
 *
 * Based on:
 * - Number of students in queue
 * - Number of available seniors
 * - Average session duration (assume 20 minutes)
 *
 * @returns Estimated wait in seconds
 */
export const calculateWaitTime = (): number => {
  const studentsWaiting = waitingStudents.length;
  const seniorsAvailable = Array.from(activeSeniors.values()).filter(
    (s) => s.status === "available"
  ).length;

  if (seniorsAvailable === 0) {
    // No seniors available - estimate 10 minutes (can improve with historical data)
    return 600;
  }

  // Average session is 20 minutes = 1200 seconds
  const avgSessionDuration = 1200;

  // If 5 students waiting and 2 seniors available:
  // First 2 students matched immediately = 0 wait
  // Next 2 students wait 20 minutes = 1200s
  // 5th student waits 40 minutes = 2400s
  const position = studentsWaiting;
  const waitMultiplier = Math.floor(position / seniorsAvailable);

  return waitMultiplier * avgSessionDuration;
};

/**
 * Get queue statistics
 *
 * For admin dashboard
 *
 * @returns Queue stats
 */
export const getQueueStats = () => {
  return {
    totalWaiting: waitingStudents.length,
    longestWaitTime:
      waitingStudents.length > 0 ? Date.now() - waitingStudents[0].joinedAt : 0,
    averageStressLevel:
      waitingStudents.reduce((sum, s) => sum + (s.stressLevel || 50), 0) /
      (waitingStudents.length || 1),
  };
};
