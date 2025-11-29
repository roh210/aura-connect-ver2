import { useEffect, useState } from "react";
import * as socketService from "@/services/socket.service";

interface UseSocketReturn {
  isConnected: boolean;
  socket: typeof socketService;
}

/**
 * React hook for Socket.io connection
 *
 * @param userId - User ID for socket identification
 * @param userName - User name for socket identification
 * @param role - User role (student or senior)
 * @param autoConnect - Whether to auto-connect on mount (default: true)
 */
export function useSocket(
  userId: string | null,
  userName: string | null,
  role: socketService.UserRole | null,
  autoConnect = true
): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if we have all required data and autoConnect is enabled
    if (!autoConnect || !userId || !userName || !role) {
      return;
    }

    // Connect to socket
    socketService.connectSocket(userId, userName, role);

    // Poll connection status every second
    const intervalId = setInterval(() => {
      const connected = socketService.isSocketConnected();
      setIsConnected(connected);
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      // Don't disconnect socket here - let it persist across page navigation
      // Only disconnect when user logs out
    };
  }, [userId, userName, role, autoConnect]);

  return {
    isConnected,
    socket: socketService,
  };
}

/**
 * Hook to manually control socket connection
 * Use this for logout scenarios
 */
export function useSocketDisconnect() {
  return {
    disconnect: () => socketService.disconnectSocket(),
  };
}
