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

  // TODO: Replace with real user data from auth context (Phase 7)
  const userId = "demo-senior-456";
  const userName = "Demo Senior";

  const { isConnected, socket } = useSocket(userId, userName, "senior");

  const [availability, setAvailability] =
    useState<AvailabilityStatus>("offline");
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
    []
  );
  const [queueSize, setQueueSize] = useState(0);
  const [totalSessions, setTotalSessions] = useState(12);

  // Listen for match requests from backend
  useEffect(() => {
    socket.onMatchRequest((data) => {
      setIncomingRequests((prev) => [
        ...prev,
        {
          studentId: data.studentId,
          studentName: data.studentName,
          matchRequestId: data.matchRequestId,
          timestamp: data.timestamp,
        },
      ]);

      toast({
        title: "📢 New Match Request!",
        description: `${data.studentName} is waiting to connect`,
      });
    });

    // Listen for successful session match
    socket.onSessionMatched((data) => {
      toast({
        title: "✅ Match Confirmed!",
        description: `Connected with ${data.partnerName}`,
      });

      // Navigate to session
      setTimeout(() => {
        router.push(`/session/${data.sessionId}`);
      }, 2000);
    });

    // Cleanup listeners
    return () => {
      socket.removeAllListeners();
    };
  }, [socket, router, toast]);

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
    socket.seniorSetAvailable(newStatus === "online");

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

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Connection Status Indicator */}
      <ConnectionStatus isConnected={isConnected} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">👴 Senior Dashboard</h1>
          <p className="text-gray-600">
            Make a difference by sharing your wisdom and experience
          </p>
        </div>

        {/* Availability Toggle */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Availability Status</span>
              <Badge
                variant={availability === "online" ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {availability === "online" ? "🟢 Online" : "⚫ Offline"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {availability === "offline"
                ? "Turn on to start receiving match requests"
                : "You're visible to students who need support"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleToggleAvailability}
              size="lg"
              className="w-full text-lg h-14"
              variant={availability === "online" ? "destructive" : "default"}
            >
              {availability === "offline" ? "🌟 Go Online" : "⏸️ Go Offline"}
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-1">
                <div className="text-3xl font-bold text-blue-600">
                  {totalSessions}
                </div>
                <div className="text-xs text-gray-600">Total Sessions</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-1">
                <div className="text-3xl font-bold text-purple-600">
                  {queueSize}
                </div>
                <div className="text-xs text-gray-600">Students in Queue</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-1">
                <div className="text-3xl font-bold text-green-600">4.8★</div>
                <div className="text-xs text-gray-600">Avg Rating</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incoming Match Requests */}
        {availability === "online" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {incomingRequests.length > 0
                ? "📥 Incoming Requests"
                : "👀 Waiting for Students..."}
            </h2>

            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-5xl mb-3">🕐</div>
                  <p className="text-gray-600">
                    No incoming requests right now
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    You'll be notified when a student needs support
                  </p>
                </CardContent>
              </Card>
            ) : (
              incomingRequests.map((request) => (
                <Card
                  key={request.matchRequestId}
                  className="border-2 border-purple-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Student: {request.studentName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Request received{" "}
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">
                        WAITING
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        A student is waiting to connect with you for support and
                        conversation.
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
                        className="flex-1 bg-green-600 hover:bg-green-700"
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
                        className="flex-1"
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
    </main>
  );
}
