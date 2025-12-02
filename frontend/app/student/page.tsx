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
import { Progress } from "@/components/ui/progress";
import { useSocket } from "@/hooks/useSocket";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

type ConnectionState = "idle" | "searching" | "queued" | "matched";

export default function StudentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();

  // All hooks MUST be called before any conditional returns
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [queuePosition, setQueuePosition] = useState(0);
  const [activeSeniors, setActiveSeniors] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);

  // Use fallback values while user is loading
  const userId = user?.uid || "";
  const userName = user?.displayName || "";

  const { isConnected, socket } = useSocket(userId, userName, "student");

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
      localStorage.setItem("userRole", "student");
    }
  }, [user, userId, userName]);

  // Listen for queue updates from backend
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(
        "⚠️ Cannot set up student listeners - socket:",
        !!socket,
        "isConnected:",
        isConnected
      );
      return;
    }

    console.log("🔧 Setting up student socket listeners");

    socket.onQueueUpdate((data) => {
      setQueuePosition(data.position);
      setActiveSeniors(data.activeSeniors);
      setEstimatedWaitTime(data.estimatedWaitTime);
      setConnectionState("queued");
    });

    // Listen for match notification
    socket.onSessionMatched((data) => {
      console.log("📥 Student received session matched event:", data);
      setConnectionState("matched");

      // Store session data for voice call
      if (typeof window !== "undefined" && data.roomUrl && data.token) {
        localStorage.setItem("sessionRoomUrl", data.roomUrl);
        localStorage.setItem("sessionToken", data.token);
      }

      toast({
        title: "✅ Match Found!",
        description: `Connected with ${data.partnerName}`,
      });

      // Navigate to session after 2 seconds
      setTimeout(() => {
        console.log("🔀 Student navigating to session:", data.sessionId);
        router.push(`/session/${data.sessionId}`);
      }, 2000);
    });

    // Don't remove listeners on unmount - socket persists across pages
    // Cleanup only happens on logout (handled in AuthContext)
  }, [socket, isConnected, router, toast]);

  const handleFindSenior = () => {
    if (!isConnected) {
      toast({
        title: "⚠️ Not connected",
        description: "Please wait for connection to establish",
        variant: "destructive",
      });
      return;
    }

    setConnectionState("searching");

    // Emit join queue event to backend with user data
    socket.studentJoinQueue(userId, userName);

    toast({
      title: "🔍 Finding a senior...",
      description: "You'll be matched with the next available senior",
    });
  };
  const handleCancelSearch = () => {
    socket.studentLeaveQueue();
    setConnectionState("idle");
    setQueuePosition(0);

    toast({
      title: "Search cancelled",
      description: "You've left the queue",
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
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  👨‍🎓 Student Dashboard
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-200">
                Welcome back,{" "}
                <span className="font-semibold text-purple-400">
                  {userName}
                </span>
                !
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                Connect with experienced seniors for support and conversation
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

          {/* Main Action Card */}
          <Card className="border-2 bg-gray-800/80 backdrop-blur-lg border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                {connectionState === "idle" && "Ready to Connect?"}
                {connectionState === "searching" &&
                  "🔍 Searching for Seniors..."}
                {connectionState === "queued" && "⏳ You're in Queue"}
                {connectionState === "matched" && "✅ Match Found!"}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {connectionState === "idle" &&
                  "Start a 10-minute wellness conversation"}
                {connectionState === "searching" &&
                  "Looking for available seniors"}
                {connectionState === "queued" &&
                  "We'll connect you with the next available senior"}
                {connectionState === "matched" &&
                  "Your senior is ready to chat"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Idle State */}
              {connectionState === "idle" && (
                <div className="space-y-4">
                  <Button
                    onClick={handleFindSenior}
                    size="lg"
                    className="w-full text-base sm:text-lg h-14 min-h-[48px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    🌟 Find a Senior Now
                  </Button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-300">
                        {activeSeniors}
                      </div>
                      <div className="text-xs text-gray-400">
                        Seniors Online
                      </div>
                    </div>
                    <div className="text-center p-3 bg-pink-900/30 border border-pink-500/30 rounded-lg">
                      <div className="text-2xl font-bold text-pink-300">
                        ~2 min
                      </div>
                      <div className="text-xs text-gray-400">Avg Wait Time</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Searching State */}
              {connectionState === "searching" && (
                <div className="space-y-4 text-center py-6">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
                  </div>
                  <p className="text-sm text-gray-300">
                    Matching you with an available senior...
                  </p>
                  <Button
                    onClick={handleCancelSearch}
                    variant="outline"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200 hover:border-purple-400"
                  >
                    Cancel Search
                  </Button>
                </div>
              )}

              {/* Queued State */}
              {connectionState === "queued" && (
                <div className="space-y-4">
                  <div className="p-6 bg-purple-900/30 border border-purple-500/30 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-200">
                        Position in Queue
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-lg px-3 py-1 bg-purple-700/50 text-purple-200 border-purple-500/30"
                      >
                        #{queuePosition}
                      </Badge>
                    </div>

                    <Progress
                      value={((4 - queuePosition) / 4) * 100}
                      className="h-2"
                    />

                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Estimated wait: {queuePosition * 2} min</span>
                      <span>{activeSeniors} seniors available</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <span className="text-2xl">💡</span>
                    <p className="text-sm text-gray-300">
                      Take a deep breath. You'll be connected soon.
                    </p>
                  </div>

                  <Button
                    onClick={handleCancelSearch}
                    variant="outline"
                    className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200 hover:border-purple-400"
                  >
                    Leave Queue
                  </Button>
                </div>
              )}

              {/* Matched State */}
              {connectionState === "matched" && (
                <div className="space-y-4 text-center py-6">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-green-300">
                      Match Found!
                    </h3>
                    <p className="text-sm text-gray-300">
                      Connecting you to your session...
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Join Session →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          {connectionState === "idle" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-gray-800/60 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-300">
                    💬 Anonymous & Safe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">
                    Your conversations are private and confidential
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-300">
                    ⏱️ Quick Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">
                    Quick, meaningful conversations when you need them
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-300">
                    🎓 Peer Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">
                    Smart matching based on availability and context
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
