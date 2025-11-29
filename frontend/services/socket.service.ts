import { io, Socket } from "socket.io-client";

export type UserRole = "student" | "senior";

export interface QueueUpdate {
  position: number;
  estimatedWaitTime: number;
  activeSeniors: number;
}

export interface MatchRequest {
  studentId: string;
  studentName: string;
  matchRequestId: string;
  timestamp: number;
}

export interface SessionMatched {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  partnerRole: UserRole;
  roomUrl: string;
  token: string; // Access token for Daily.co room
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface LiveStats {
  activeStudents: number;
  activeSeniors: number;
  activeSessions: number;
  queueSize: number;
}

// Module-level socket instance (singleton pattern with functional style)
let socket: Socket | null = null;
let lastIdentity: { userId: string; userName: string; role: UserRole } | null =
  null;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

/**
 * Initialize Socket.io connection
 */
export const connectSocket = (
  userId: string,
  userName: string,
  role: UserRole
): Socket => {
  // If socket exists and is connected with same identity, just return it
  if (
    socket?.connected &&
    lastIdentity?.userId === userId &&
    lastIdentity?.role === role
  ) {
    console.log("✅ Socket already connected with same identity, reusing...");
    return socket;
  }

  // If socket exists and is connected but identity changed, re-identify
  if (
    socket?.connected &&
    (lastIdentity?.userId !== userId || lastIdentity?.role !== role)
  ) {
    console.log("🔵 Socket connected but identity changed, re-identifying...");
    const identifyData = { userId, name: userName, role };
    console.log("🔵 Emitting identify event with data:", identifyData);
    socket.emit("identify", identifyData);
    lastIdentity = { userId, userName, role };
    return socket;
  }

  // If socket exists but disconnected, disconnect completely first
  if (socket) {
    console.log("⚠️ Disconnecting stale socket before reconnecting");
    socket.disconnect();
    socket = null;
  }

  console.log("🔵 Creating new socket connection...");
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
    const identifyData = { userId, name: userName, role };
    console.log("🔵 Emitting identify event with data:", identifyData);
    socket?.emit("identify", identifyData);
    lastIdentity = { userId, userName, role };
  });

  socket.on("identified", (data) => {
    console.log("✅ Server confirmed identification:", data);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
  lastIdentity = null;
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => socket?.connected ?? false;

// ==========================================
// STUDENT EVENTS
// ==========================================

export const studentJoinQueue = (userId: string, userName: string): void => {
  socket?.emit("student_join_queue", {
    userId,
    name: userName,
    stressLevel: 5, // Medium stress (1-10 scale)
    preferences: {},
  });
  console.log("📤 Emitted: student_join_queue", { userId, userName });
};

export const studentLeaveQueue = (): void => {
  socket?.emit("student_leave_queue");
  console.log("📤 Emitted: student_leave_queue");
};

export const onQueueUpdate = (callback: (data: QueueUpdate) => void): void => {
  // Remove existing listener to prevent duplicates
  socket?.off("queue_update");

  socket?.on("queue_update", (data) => {
    console.log("📥 Received: queue_update", data);
    callback(data);
  });
};

// ==========================================
// SENIOR EVENTS
// ==========================================

export const seniorSetAvailable = (
  available: boolean,
  userId: string,
  name: string
): void => {
  if (available) {
    socket?.emit("senior_available", { userId, name });
    console.log("📤 Emitted: senior_available", { userId, name });
  } else {
    // When going offline, we still need to notify backend
    socket?.emit("senior_unavailable", { userId });
    console.log("📤 Emitted: senior_unavailable", { userId });
  }
};

export const onMatchRequest = (
  callback: (data: MatchRequest) => void
): void => {
  if (!socket) {
    console.warn(
      "⚠️ Socket not initialized, cannot set up match request listener"
    );
    return;
  }

  // Remove existing listeners to prevent duplicates
  socket.off("student_waiting");
  socket.off("queue_update");

  console.log("🔧 Setting up student_waiting and queue_update listeners");

  // Listen for new students joining queue (real-time)
  socket.on("student_waiting", (data) => {
    console.log("📥 Received: student_waiting", data);
    callback({
      studentId: data.studentId,
      studentName: data.studentName,
      matchRequestId: `match_${Date.now()}`,
      timestamp: Date.now(),
    });
  });

  // Listen for initial queue update (when senior becomes available)
  socket.on("queue_update", (data) => {
    console.log("📥 Received: queue_update", data);
    // Process each waiting student
    if (data.waitingStudents && Array.isArray(data.waitingStudents)) {
      data.waitingStudents.forEach((student: any) => {
        callback({
          studentId: student.userId,
          studentName: student.name,
          matchRequestId: `match_${Date.now()}_${student.userId}`,
          timestamp: Date.now(),
        });
      });
    }
  });
};

export const seniorAccept = (
  studentId: string,
  matchRequestId: string
): void => {
  socket?.emit("senior_accept", { studentId, matchRequestId });
  console.log("📤 Emitted: senior_accept", { studentId, matchRequestId });
};

export const seniorDecline = (
  studentId: string,
  matchRequestId: string
): void => {
  socket?.emit("senior_decline", { studentId, matchRequestId });
  console.log("📤 Emitted: senior_decline", { studentId, matchRequestId });
};

// ==========================================
// SHARED EVENTS (Student & Senior)
// ==========================================

export const onSessionMatched = (
  callback: (data: SessionMatched) => void
): void => {
  // Remove existing listener to prevent duplicates
  socket?.off("matched");

  socket?.on("matched", (data) => {
    console.log("📥 Received: matched", data);
    // Transform backend data to match our interface
    callback({
      sessionId: data.sessionId,
      partnerId: data.studentId || data.seniorId,
      partnerName: data.studentName || data.seniorName,
      partnerRole: data.studentId ? "student" : "senior",
      roomUrl: data.roomUrl,
      token: data.token, // Backend sends the appropriate token for this user
    });
  });
};

export const joinSessionRoom = (sessionId: string): void => {
  socket?.emit("join_session", { sessionId });
  console.log("📤 Emitted: join_session", { sessionId });
};

export const sendMessage = (sessionId: string, message: string): void => {
  socket?.emit("chat_message", { sessionId, message });
  console.log("📤 Emitted: chat_message", { sessionId, message });
};

export const endSession = (sessionId: string): void => {
  socket?.emit("end_session", { sessionId });
  console.log("📤 Emitted: end_session", { sessionId });
};

export const onChatMessage = (callback: (data: ChatMessage) => void): void => {
  // Remove existing listener to prevent duplicates
  socket?.off("chat_message");

  socket?.on("chat_message", (data) => {
    console.log("📥 Received: chat_message", data);
    callback(data);
  });
};

export const onSessionEnded = (
  callback: (data: { sessionId: string; endedBy: string }) => void
): void => {
  socket?.on("session_ended", (data) => {
    console.log("📥 Received: session_ended", data);
    callback(data);
  });
};

export const onPartnerDisconnected = (
  callback: (data: { partnerId: string }) => void
): void => {
  socket?.on("partner_disconnected", (data) => {
    console.log("📥 Received: partner_disconnected", data);
    callback(data);
  });
};

// ==========================================
// ADMIN EVENTS
// ==========================================

export const onLiveStats = (callback: (data: LiveStats) => void): void => {
  socket?.on("live_stats", (data) => {
    console.log("📥 Received: live_stats", data);
    callback(data);
  });
};

// ==========================================
// CLEANUP
// ==========================================

export const removeAllListeners = (): void => {
  socket?.removeAllListeners();
  console.log("🧹 Removed all socket listeners");
};
