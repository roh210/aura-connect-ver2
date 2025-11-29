"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // TODO: Replace with real user data from auth context (Phase 7)
  const userId = "demo-student-123";
  const userName = "Demo Student";

  // Save user data to localStorage for session page
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      localStorage.setItem("userRole", "student");
    }
  }, []);

  const { isConnected, socket } = useSocket(userId, userName, "student");

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [queuePosition, setQueuePosition] = useState(0);
  const [activeSeniors, setActiveSeniors] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);

  // Listen for queue updates from backend
  useEffect(() => {
    socket.onQueueUpdate((data) => {
      setQueuePosition(data.position);
      setActiveSeniors(data.activeSeniors);
      setEstimatedWaitTime(data.estimatedWaitTime);
      setConnectionState("queued");
    });

    // Listen for match notification
    socket.onSessionMatched((data) => {
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
        router.push(`/session/${data.sessionId}`);
      }, 2000);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.removeAllListeners();
    };
  }, [socket, router, toast]);

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

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Connection Status Indicator */}
      <ConnectionStatus isConnected={isConnected} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">👨‍🎓 Student Dashboard</h1>
          <p className="text-gray-600">
            Connect with experienced seniors for support and conversation
          </p>
        </div>

        {/* Main Action Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">
              {connectionState === "idle" && "Ready to Connect?"}
              {connectionState === "searching" && "🔍 Searching for Seniors..."}
              {connectionState === "queued" && "⏳ You're in Queue"}
              {connectionState === "matched" && "✅ Match Found!"}
            </CardTitle>
            <CardDescription>
              {connectionState === "idle" &&
                "Start a 10-minute wellness conversation"}
              {connectionState === "searching" &&
                "Looking for available seniors"}
              {connectionState === "queued" &&
                "We'll connect you with the next available senior"}
              {connectionState === "matched" && "Your senior is ready to chat"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Idle State */}
            {connectionState === "idle" && (
              <div className="space-y-4">
                <Button
                  onClick={handleFindSenior}
                  size="lg"
                  className="w-full text-lg h-14"
                >
                  🌟 Find a Senior Now
                </Button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {activeSeniors}
                    </div>
                    <div className="text-xs text-gray-600">Seniors Online</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      ~2 min
                    </div>
                    <div className="text-xs text-gray-600">Avg Wait Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Searching State */}
            {connectionState === "searching" && (
              <div className="space-y-4 text-center py-6">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                </div>
                <p className="text-sm text-gray-600">
                  Matching you with an available senior...
                </p>
                <Button onClick={handleCancelSearch} variant="outline">
                  Cancel Search
                </Button>
              </div>
            )}

            {/* Queued State */}
            {connectionState === "queued" && (
              <div className="space-y-4">
                <div className="p-6 bg-purple-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Position in Queue
                    </span>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      #{queuePosition}
                    </Badge>
                  </div>

                  <Progress
                    value={((4 - queuePosition) / 4) * 100}
                    className="h-2"
                  />

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Estimated wait: {queuePosition * 2} min</span>
                    <span>{activeSeniors} seniors available</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm text-gray-700">
                    Take a deep breath. You'll be connected soon.
                  </p>
                </div>

                <Button
                  onClick={handleCancelSearch}
                  variant="outline"
                  className="w-full"
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
                  <h3 className="text-xl font-bold text-green-600">
                    Match Found!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Connecting you to your session...
                  </p>
                </div>
                <Button size="lg" className="w-full">
                  Join Session →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        {connectionState === "idle" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">💬 Anonymous & Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Your conversations are private and confidential
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">⏱️ 10-Minute Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Quick, meaningful conversations when you need them
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">🎯 AI-Assisted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Smart matching based on availability and context
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
