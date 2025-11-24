"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AvailabilityStatus = "offline" | "online";

interface IncomingRequest {
  id: string;
  studentName: string;
  stressLevel: "low" | "medium" | "high";
  waitTime: number;
  previewText: string;
}

export default function SeniorDashboard() {
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("offline");
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
    []
  );
  const [queueSize, setQueueSize] = useState(3);
  const [totalSessions, setTotalSessions] = useState(12);

  const handleToggleAvailability = () => {
    const newStatus = availability === "offline" ? "online" : "offline";
    setAvailability(newStatus);

    // Simulate incoming request when going online (demo)
    if (newStatus === "online") {
      setTimeout(() => {
        setIncomingRequests([
          {
            id: "req-1",
            studentName: "Alex",
            stressLevel: "medium",
            waitTime: 4,
            previewText: "Feeling anxious about upcoming exams...",
          },
        ]);
      }, 2000);
    } else {
      setIncomingRequests([]);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    // TODO: Navigate to session page
    console.log("Accepted request:", requestId);
  };

  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "high":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50">
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
                <Card key={request.id} className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Student: {request.studentName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Waiting for {request.waitTime} minutes
                        </CardDescription>
                      </div>
                      <Badge
                        className={getStressLevelColor(request.stressLevel)}
                      >
                        {request.stressLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        "{request.previewText}"
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1"
                        size="lg"
                      >
                        ✅ Accept & Connect
                      </Button>
                      <Button
                        onClick={() => handleDeclineRequest(request.id)}
                        variant="outline"
                        size="lg"
                      >
                        ❌ Decline
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
