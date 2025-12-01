"use client";

import { useState, useRef, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import * as socketService from "@/services/socket.service";
import ConnectionStatus from "@/components/ConnectionStatus";
import VoiceCall from "@/components/VoiceCall";
import AISuggestionsPanel from "@/components/AISuggestionsPanel";
import CrisisAlert from "@/components/CrisisAlert";
import SentimentMeter from "@/components/SentimentMeter";
import { Lightbulb } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Message {
  id: string;
  sender: "student" | "senior" | "system";
  text: string;
  timestamp: Date;
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Get user info from auth context or localStorage (fallback)
  const userId =
    user?.uid ||
    (typeof window !== "undefined" ? localStorage.getItem("userId") : null);
  const userName =
    user?.displayName ||
    (typeof window !== "undefined" ? localStorage.getItem("userName") : null);
  const userRole = (user?.role ||
    (typeof window !== "undefined"
      ? localStorage.getItem("userRole")
      : null)) as "student" | "senior" | null;

  // Redirect if no user data available
  useEffect(() => {
    if (!userId || !userName || !userRole) {
      toast({
        title: "⚠️ Session error",
        description: "User data not found. Please log in again.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  }, [userId, userName, userRole, router, toast]);

  // Reuse existing socket from dashboard (don't create a new one)
  const socket = socketService;
  const isConnected = socketService.isSocketConnected();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "system",
      text: "Welcome! Your 10-minute session has started. Feel free to share what's on your mind.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Icebreaker state
  const [icebreaker, setIcebreaker] = useState<string>("");
  const [icebreakerLoading, setIcebreakerLoading] = useState(true);

  // Crisis Detection state (Phase 8A.5)
  const [crisisData, setCrisisData] = useState<{
    severity: "critical" | "high" | "medium" | "low" | null;
    flags: string[];
    recommendedAction: string;
  }>({ severity: null, flags: [], recommendedAction: "" });
  const lastCheckedMessageCount = useRef(0);

  // Voice call data (roomUrl and token from matched event)
  const [callData, setCallData] = useState<{
    roomUrl: string;
    token: string;
  } | null>(null);

  // Load call data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const roomUrl = localStorage.getItem("sessionRoomUrl");
      const token = localStorage.getItem("sessionToken");

      if (roomUrl && token) {
        setCallData({ roomUrl, token });
      }
    }
  }, []);

  // Fetch AI icebreaker from Firestore
  useEffect(() => {
    const fetchIcebreaker = async () => {
      if (!userRole) return; // Need to know which icebreaker to fetch

      try {
        setIcebreakerLoading(true);
        const sessionRef = doc(db, "sessions", params.id);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          // Fetch role-specific icebreaker
          const icebreakerField =
            userRole === "student"
              ? "icebreakerForStudent"
              : "icebreakerForSenior";

          if (sessionData?.[icebreakerField]) {
            setIcebreaker(sessionData[icebreakerField]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch icebreaker:", error);
        // Graceful degradation: Don't show icebreaker if fetch fails
      } finally {
        setIcebreakerLoading(false);
      }
    };

    fetchIcebreaker();
  }, [params.id, userRole]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Crisis Detection: Check student messages for crisis indicators (Phase 8A.5)
  useEffect(() => {
    // Only run for seniors
    if (userRole !== "senior") return;

    // Only check when message count changes
    if (messages.length === lastCheckedMessageCount.current) return;

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Only check student messages (not system or senior)
    if (!lastMessage || lastMessage.sender !== "student") {
      lastCheckedMessageCount.current = messages.length;
      return;
    }

    // Call crisis detection API
    const checkForCrisis = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/crisis`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: lastMessage.text }),
          }
        );

        if (!response.ok) {
          console.error("Crisis detection failed:", response.statusText);
          return;
        }

        const result = await response.json();

        // Update crisis data if severity is high or critical
        if (result.severity === "high" || result.severity === "critical") {
          setCrisisData({
            severity: result.severity,
            flags: result.flags || [],
            recommendedAction:
              result.recommendedAction ||
              "Please encourage the student to seek professional help.",
          });
        }
      } catch (error) {
        console.error("Crisis detection error:", error);
      } finally {
        lastCheckedMessageCount.current = messages.length;
      }
    };

    checkForCrisis();
  }, [messages, userRole]);

  // WebSocket: Listen for incoming chat messages (only once on mount)
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the session room first
    socket.joinSessionRoom(params.id);

    // Set up listener for incoming messages
    const handleIncomingMessage = (data: any) => {
      // Determine sender role based on senderId
      const isMyMessage = data.senderId === userId;
      const messageSender: "student" | "senior" | "system" = isMyMessage
        ? userRole || "student"
        : userRole === "student"
        ? "senior"
        : "student";

      const newMessage: Message = {
        id: `${data.timestamp}-${data.senderId}`,
        sender: messageSender,
        text: data.message,
        timestamp: new Date(data.timestamp),
      };
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.onChatMessage(handleIncomingMessage);

    // Cleanup not needed since socket persists across navigation
    // But in production, you'd want to remove the listener on unmount
  }, [params.id, socket, isConnected, userId, userRole]); // Only run once when session ID changes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Send message via WebSocket - backend will broadcast to everyone including us
    socket.sendMessage(params.id, inputMessage);
    setInputMessage("");
  };

  // Handle clicking on AI suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    // Optionally auto-send:
    // socket.sendMessage(params.id, suggestion);
  };

  const handleToggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    toast({
      title: isVoiceActive ? "📞 Voice disconnected" : "📞 Voice connected",
      description: isVoiceActive
        ? "Switched to text chat"
        : "Voice call started",
    });
  };

  const handleEndSession = () => {
    // Emit end_session event to backend
    socket.endSession?.(params.id);

    // Clear session data from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("sessionRoomUrl");
      localStorage.removeItem("sessionToken");
    }

    toast({
      title: "✅ Session ended",
      description: "Thank you for using Aura Connect",
    });

    // Navigate back to dashboard
    setTimeout(() => {
      router.push(userRole === "student" ? "/student" : "/senior");
    }, 1500);
  };

  // Handle when voice call ends - also end the session
  const handleCallEnd = () => {
    handleEndSession();
  };

  const handleFlagContent = () => {
    toast({
      title: "🚩 Content flagged",
      description:
        "Our team will review this session. Thank you for keeping the community safe.",
      variant: "destructive",
    });
  };

  const progressPercent = ((600 - timeRemaining) / 600) * 100;

  return (
    <main className="min-h-screen bg-gray-900">
      <ConnectionStatus isConnected={isConnected} />

      {/* Crisis Alert (Phase 8A.5) - Only visible to seniors */}
      {userRole === "senior" && (
        <CrisisAlert
          severity={crisisData.severity}
          flags={crisisData.flags}
          recommendedAction={crisisData.recommendedAction}
          onDismiss={() =>
            setCrisisData({ severity: null, flags: [], recommendedAction: "" })
          }
        />
      )}
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">💬 Active Session</h1>
            <p className="text-xs text-gray-400">Session ID: {params.id}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="text-center">
              <div
                className={`text-2xl font-mono font-bold ${
                  timeRemaining < 60 ? "text-red-400" : "text-white"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
              <Progress value={progressPercent} className="w-32 h-1 mt-1" />
            </div>

            {/* Voice Toggle */}
            <Button
              onClick={handleToggleVoice}
              variant={isVoiceActive ? "default" : "outline"}
              size="sm"
            >
              {isVoiceActive ? "📞 Voice On" : "📞 Start Voice"}
            </Button>

            {/* End Session */}
            <Button onClick={handleEndSession} variant="destructive" size="sm">
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-100px)] flex gap-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* AI Icebreaker Card (Phase 8A.1) */}
          {!icebreakerLoading && icebreaker && (
            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      💡 AI Conversation Starter
                    </p>
                    <p className="text-sm text-gray-700">{icebreaker}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions Panel (Phase 8A.3) - Only for seniors */}
          {userRole === "senior" && (
            <div className="mb-4">
              <AISuggestionsPanel
                messages={messages
                  .filter((msg) => msg.sender !== "system")
                  .map((msg) => ({
                    sender: msg.sender as "student" | "senior",
                    text: msg.text,
                  }))}
                onSuggestionClick={handleSuggestionClick}
                userRole={userRole}
              />
            </div>
          )}

          {/* Sentiment Meter (Phase 8A.7) - Only for seniors */}
          {userRole === "senior" && (
            <div className="mb-4">
              <SentimentMeter
                messages={messages
                  .filter((msg) => msg.sender !== "system")
                  .map((msg) => ({
                    sender: msg.sender as "student" | "senior",
                    text: msg.text,
                  }))}
                userRole={userRole}
              />
            </div>
          )}

          <Card className="flex-1 flex flex-col bg-gray-800 border-gray-700">
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.map((message) => {
                const isMyMessage = message.sender === userRole;
                const isSystemMessage = message.sender === "system";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isSystemMessage
                        ? "justify-center"
                        : isMyMessage
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 break-words ${
                        isSystemMessage
                          ? "bg-blue-900/50 text-blue-200 text-center text-sm"
                          : isMyMessage
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-gray-700 text-gray-100 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button type="submit" size="lg">
                  Send 📤
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="w-80 space-y-4">
          {/* Voice Call Component */}
          {callData && (
            <VoiceCall
              roomUrl={callData.roomUrl}
              token={callData.token}
              userName={userName || "User"}
              onCallEnd={handleCallEnd}
            />
          )}

          {/* Loading placeholder (if no call data yet) */}
          {!callData && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">
                  🎙️ Voice Call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-center py-6">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">Loading voice call...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">
                ℹ️ Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Remaining</span>
                  <span className="text-white font-mono">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Connection</span>
                  <Badge variant="default" className="text-xs">
                    🟢 Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Voice Status</span>
                  <Badge
                    variant={isVoiceActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isVoiceActive ? "📞 On" : "💬 Text Only"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">🛡️ Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-400">
                If you experience any inappropriate behavior, please flag this
                session.
              </p>
              <Button
                onClick={handleFlagContent}
                variant="outline"
                size="sm"
                className="w-full text-red-400 border-red-400 hover:bg-red-900/20"
              >
                🚩 Flag Content
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-900/20 border-blue-700">
            <CardContent className="pt-4">
              <div className="space-y-2 text-xs text-blue-200">
                <p className="font-semibold">💡 Tips for a great session:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Be respectful and empathetic</li>
                  <li>Listen actively</li>
                  <li>Share your perspective</li>
                  <li>Keep it confidential</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
