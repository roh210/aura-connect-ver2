"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

type AvailabilityStatus = "offline" | "online";

interface IncomingRequest {
  studentId: string;
  studentName: string;
  matchRequestId: string;
  timestamp: number;
}

export default function SeniorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();

  // All hooks MUST be called before any conditional returns
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("offline");
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
    []
  );
  const [queueSize, setQueueSize] = useState(0);
  const [totalSessions, setTotalSessions] = useState(12);

  // Use fallback values while user is loading
  const userId = user?.uid || "";
  const userName = user?.displayName || "";

  const { isConnected, socket } = useSocket(userId, userName, "senior");

  // Debug: Log incoming requests whenever they change
  useEffect(() => {
    console.log("📊 incomingRequests state updated:", {
      count: incomingRequests.length,
      requests: incomingRequests,
    });
  }, [incomingRequests]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Save user data to localStorage for session page
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      localStorage.setItem("userRole", "senior");
    }
  }, [user, userId, userName]);

  // Listen for match requests from backend - set up IMMEDIATELY on mount
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(
        "⚠️ Cannot set up listener - socket:",
        !!socket,
        "isConnected:",
        isConnected
      );
      return;
    }

    console.log("🔧 Setting up onMatchRequest listener");

    socket.onMatchRequest((data) => {
      console.log("📥 Match request received in senior page:", data);

      // Prevent duplicate requests (check if studentId already exists)
      setIncomingRequests((prev) => {
        const exists = prev.some((req) => req.studentId === data.studentId);
        if (exists) {
          console.log("⚠️ Skipping duplicate request for:", data.studentId);
          return prev;
        }

        console.log("✅ Adding new request to queue:", data);

        toast({
          title: "📢 New Match Request!",
          description: `${data.studentName} is waiting to connect`,
        });

        return [
          ...prev,
          {
            studentId: data.studentId,
            studentName: data.studentName,
            matchRequestId: data.matchRequestId,
            timestamp: data.timestamp,
          },
        ];
      });
    });

    // Don't remove listeners on unmount - socket persists across pages
    // Cleanup only happens on logout (handled in AuthContext)
  }, [socket, isConnected, toast]);

  // Listen for successful session match
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(
        "⚠️ Cannot set up session matched listener - socket:",
        !!socket,
        "isConnected:",
        isConnected
      );
      return;
    }

    console.log("🔧 Setting up onSessionMatched listener");

    socket.onSessionMatched((data) => {
      console.log("📥 Session matched event received:", data);

      // Store session data for voice call
      if (typeof window !== "undefined" && data.roomUrl && data.token) {
        localStorage.setItem("sessionRoomUrl", data.roomUrl);
        localStorage.setItem("sessionToken", data.token);
      }

      toast({
        title: "✅ Match Confirmed!",
        description: `Connected with ${data.partnerName}`,
      });

      // Navigate to session
      setTimeout(() => {
        console.log("🔀 Navigating to session:", data.sessionId);
        router.push(`/session/${data.sessionId}`);
      }, 2000);
    });

    // Don't remove listeners on unmount - socket persists across pages
    // Cleanup only happens on logout (handled in AuthContext)
  }, [socket, isConnected, router, toast]);

  const handleToggleAvailability = () => {
    if (!isConnected) {
      toast({
        title: "⚠️ Not connected",
        description: "Please wait for connection to establish",
        variant: "destructive",
      });
      return;
    }

    const newStatus = availability === "offline" ? "online" : "offline";
    setAvailability(newStatus);

    // Emit availability status to backend
    socket.seniorSetAvailable(newStatus === "online", userId, userName);

    toast({
      title: newStatus === "online" ? "🟢 You're Online" : "⚪ You're Offline",
      description:
        newStatus === "online"
          ? "You'll receive match requests from students"
          : "You won't receive any match requests",
    });

    // Clear pending requests when going offline
    if (newStatus === "offline") {
      setIncomingRequests([]);
    }
  };

  const handleAcceptRequest = (studentId: string, matchRequestId: string) => {
    // Emit accept to backend
    socket.seniorAccept(studentId, matchRequestId);

    // Remove from local state
    setIncomingRequests((prev) =>
      prev.filter((req) => req.matchRequestId !== matchRequestId)
    );

    toast({
      title: "✅ Request accepted",
      description: "Creating session...",
    });
  };

  const handleDeclineRequest = (studentId: string, matchRequestId: string) => {
    // Emit decline to backend
    socket.seniorDecline(studentId, matchRequestId);

    // Remove from local state
    setIncomingRequests((prev) =>
      prev.filter((req) => req.matchRequestId !== matchRequestId)
    );

    toast({
      title: "Request declined",
      description: "Student will be matched with another senior",
    });
  };

  // Show loading while checking auth (AFTER all hooks)
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Dark Gradient Background - matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-purple-800/50 to-pink-900/50" />
      </div>

      <div className="relative z-10">
        {/* Connection Status Indicator */}
        <ConnectionStatus isConnected={isConnected} />

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header with Welcome & Logout */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-center sm:text-left flex-1 space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  👴 Senior Dashboard
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-200">
                Welcome back,{" "}
                <span className="font-semibold text-blue-400">{userName}</span>!
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                Make a difference by sharing your wisdom and experience
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                router.push("/auth/login");
              }}
              className="min-h-[44px] w-full sm:w-auto sm:ml-4 border-purple-500/50 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200 hover:border-purple-400"
            >
              Log Out
            </Button>
          </div>

          {/* Availability Toggle */}
          <Card className="border-2 bg-gray-800/80 backdrop-blur-lg border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Availability Status</span>
                <Badge
                  variant={availability === "online" ? "default" : "secondary"}
                  className="text-sm px-3 py-1 bg-green-700/50 text-green-200 border-green-500/50"
                >
                  {availability === "online" ? "🟢 Online" : "⚫ Offline"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {availability === "offline"
                  ? "Turn on to start receiving match requests"
                  : "You're visible to students who need support"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleToggleAvailability}
                size="lg"
                className={`w-full text-base sm:text-lg h-14 min-h-[48px] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
                  availability === "offline"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {availability === "offline" ? "🌟 Go Online" : "⏸️ Go Offline"}
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-gray-800/60 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold text-blue-400">
                    {totalSessions}
                  </div>
                  <div className="text-xs text-gray-400">Total Sessions</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/60 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold text-purple-400">
                    {queueSize}
                  </div>
                  <div className="text-xs text-gray-400">Students in Queue</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/60 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold text-green-400">4.8★</div>
                  <div className="text-xs text-gray-400">Avg Rating</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incoming Match Requests */}
          {availability === "online" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {incomingRequests.length > 0
                    ? "📥 Incoming Requests"
                    : "👀 Waiting for Students..."}
                </span>
              </h2>

              {incomingRequests.length === 0 ? (
                <Card className="bg-gray-800/60 border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <div className="text-5xl mb-3">🕐</div>
                    <p className="text-gray-300">
                      No incoming requests right now
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      You'll be notified when a student needs support
                    </p>
                  </CardContent>
                </Card>
              ) : (
                incomingRequests.map((request) => (
                  <Card
                    key={request.matchRequestId}
                    className="border-2 border-purple-500/50 bg-gray-800/80 backdrop-blur-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg text-white">
                            Student: {request.studentName}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            Request received{" "}
                            {new Date(request.timestamp).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <Badge className="bg-purple-700/50 text-purple-200 border-purple-500/50">
                          WAITING
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gray-700/30 border border-purple-500/20 rounded-md">
                        <p className="text-sm text-gray-300">
                          A student is waiting to connect with you for support
                          and conversation.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleAcceptRequest(
                              request.studentId,
                              request.matchRequestId
                            )
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 min-h-[48px]"
                        >
                          ✓ Accept
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeclineRequest(
                              request.studentId,
                              request.matchRequestId
                            )
                          }
                          variant="outline"
                          className="flex-1 min-h-[48px] border-red-500/50 text-red-300 hover:bg-red-600/20 hover:text-red-200 hover:border-red-400"
                        >
                          ✕ Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Offline Info */}
          {availability === "offline" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="space-y-2">
                    <h3 className="font-semibold">When you're ready...</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Go online to receive match requests</li>
                      <li>• Each session lasts ~10 minutes</li>
                      <li>• You can decline requests if needed</li>
                      <li>• Your impact helps students in real-time</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
