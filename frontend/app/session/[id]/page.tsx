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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import * as socketService from "@/services/socket.service";
import ConnectionStatus from "@/components/ConnectionStatus";
import VoiceCall from "@/components/VoiceCall";
import ResponseLevelSelector from "@/components/ResponseLevelSelector";
import TechniqueCard from "@/components/TechniqueCard";
import CrisisAlert from "@/components/CrisisAlert";
import SentimentMeter from "@/components/SentimentMeter";
import { Lightbulb, BookOpen, CheckCircle, X, Sparkles } from "lucide-react";
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dailyCallRef = useRef<any>(null);

  // Auto-scroll to bottom when messages change (smooth like AI chat systems)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages]);

  // AI Icebreaker state
  const [icebreaker, setIcebreaker] = useState<string>("");
  const [icebreakerLoading, setIcebreakerLoading] = useState(true);

  // Multi-Level Responses state (Phase 8B.5)
  const [aiResponses, setAiResponses] = useState<{
    quickReplies: string[];
    guidedPrompts: string[];
    aiDraft: string;
  }>({ quickReplies: [], guidedPrompts: [], aiDraft: "" });
  const [responsesLoading, setResponsesLoading] = useState(false);
  const lastProcessedLength = useRef(0);
  const isFetchingResponses = useRef(false);

  // Technique Coaching state (Phase 8B.6)
  const [techniqueCoaching, setTechniqueCoaching] = useState<{
    technique: string;
    explanation: string;
    example: string;
  } | null>(null);
  const studentMessageCount = useRef(0);

  // Crisis Detection state (Phase 8A.5)
  const [crisisData, setCrisisData] = useState<{
    severity: "critical" | "high" | "medium" | "low" | null;
    flags: string[];
    recommendedAction: string;
  }>({ severity: null, flags: [], recommendedAction: "" });
  const lastCheckedMessageCount = useRef(0);

  // Fetch multi-level responses when student messages (Phase 8B.5)
  useEffect(() => {
    const fetchResponses = async () => {
      // Only for seniors
      if (userRole !== "senior") return;

      // Need at least 2 messages
      if (messages.length < 2) return;

      // Check if already processed
      if (messages.length === lastProcessedLength.current) return;

      // Only fetch if last message was from student
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender !== "student") {
        lastProcessedLength.current = messages.length;
        return;
      }

      // Prevent concurrent fetches
      if (isFetchingResponses.current) return;

      try {
        isFetchingResponses.current = true;
        lastProcessedLength.current = messages.length;
        setResponsesLoading(true);

        // Get last 5 messages for context
        const recentMessages = messages
          .filter((msg) => msg.sender !== "system")
          .slice(-5)
          .map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          }));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggestions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recentMessages }),
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch responses:", response.statusText);
          return;
        }

        const data = await response.json();
        setAiResponses(data.suggestions);
      } catch (error) {
        console.error("Failed to fetch AI responses:", error);
      } finally {
        setResponsesLoading(false);
        isFetchingResponses.current = false;
      }
    };

    // Debounce to batch rapid re-renders
    const timeoutId = setTimeout(fetchResponses, 300);
    return () => clearTimeout(timeoutId);
  }, [messages, userRole]);

  // Fetch technique coaching every 3rd student message (Phase 8B.6)
  useEffect(() => {
    const checkTechnique = async () => {
      // Only for seniors
      if (userRole !== "senior") return;

      // Count student messages
      const currentCount = messages.filter(
        (m) => m.sender === "student"
      ).length;

      // Clear coaching card if user dismissed it or sent a message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender === "senior" && techniqueCoaching) {
        // Senior responded, clear the coaching card
        setTechniqueCoaching(null);
        return;
      }

      // Only check every 3rd student message
      if (
        currentCount > studentMessageCount.current &&
        currentCount % 3 === 0
      ) {
        studentMessageCount.current = currentCount;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/ai/technique-coach`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recentMessages: messages
                  .filter((msg) => msg.sender !== "system")
                  .slice(-6)
                  .map((msg) => ({
                    sender: msg.sender,
                    text: msg.text,
                  })),
              }),
            }
          );

          if (!response.ok) {
            console.error("Technique coaching failed:", response.statusText);
            return;
          }

          const result = await response.json();

          if (result.shouldCoach) {
            setTechniqueCoaching({
              technique: result.technique,
              explanation: result.explanation,
              example: result.example,
            });
          } else {
            // AI decided no coaching needed
            setTechniqueCoaching(null);
          }
        } catch (error) {
          console.error("Technique coaching error:", error);
          // Silently fail - coaching is optional
        }
      }
    };

    // Debounce technique checks
    const timeoutId = setTimeout(checkTechnique, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, userRole, techniqueCoaching]);

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

  // Handle multi-level response selections (Phase 8B.5)
  const handleQuickReply = (reply: string) => {
    // Quick replies send immediately
    socket.sendMessage(params.id, reply);
  };

  const handleGuidedPrompt = (prompt: string) => {
    // Guided prompts fill input for completion
    setInputMessage(prompt);
  };

  const handleDraftSelect = (draft: string) => {
    // AI draft fills input for editing
    setInputMessage(draft);
  };

  // Handle technique coaching actions (Phase 8B.6)
  const handleUseTechnique = (example: string) => {
    setInputMessage(example);
    setTechniqueCoaching(null);
  };

  const handleDismissTechnique = () => {
    setTechniqueCoaching(null);
  };

  const handleToggleMute = () => {
    if (dailyCallRef.current && isVoiceActive) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      dailyCallRef.current.setLocalAudio(!newMutedState);

      toast({
        title: newMutedState ? "🔇 Muted" : "🎤 Unmuted",
        description: newMutedState
          ? "Your microphone is now off"
          : "Your microphone is now on",
      });
    }
  };

  const handleEndSession = async () => {
    // Disconnect voice call first if active
    if (dailyCallRef.current && isVoiceActive) {
      try {
        await dailyCallRef.current.leave();
        console.log("📞 Voice call disconnected");
      } catch (err) {
        console.error("Failed to disconnect voice call:", err);
      }
    }

    // Emit end_session event to backend
    socket.endSession?.(params.id);

    // Clear session data from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("sessionRoomUrl");
      localStorage.removeItem("sessionToken");
    }

    toast({
      title: "✅ Session ended",
      description: "Voice call disconnected. Thank you for using Aura Connect",
    });

    // Navigate back to dashboard
    setTimeout(() => {
      router.push(userRole === "student" ? "/student" : "/senior");
    }, 1500);
  };

  const handleFlagContent = () => {
    toast({
      title: "🚩 Content flagged",
      description:
        "Our team will review this session. Thank you for keeping the community safe.",
      variant: "destructive",
    });
  };

  const handleVoiceCallJoined = (daily: any) => {
    dailyCallRef.current = daily;
    setIsVoiceActive(true);
  };

  const handleVoiceCallLeft = () => {
    dailyCallRef.current = null;
    setIsVoiceActive(false);
    setIsMuted(false);
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
      <div className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-base sm:text-lg font-bold text-white">
                💬 Active Session
              </h1>
              <p className="text-xs text-gray-400">Session ID: {params.id}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="text-center">
                <div
                  className={`text-xl sm:text-2xl font-mono font-bold ${
                    timeRemaining < 60 ? "text-red-400" : "text-white"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
                <Progress
                  value={progressPercent}
                  className="w-28 sm:w-32 h-1 mt-1"
                />
              </div>

              {/* End Session */}
              <Button
                onClick={handleEndSession}
                variant="destructive"
                size="sm"
                className="min-h-[44px]"
              >
                End Session
              </Button>
            </div>
          </div>

          {/* Voice Call Controls */}
          {callData && (
            <VoiceCall
              roomUrl={callData.roomUrl}
              token={callData.token}
              userName={userName || "User"}
              onCallEnd={handleVoiceCallLeft}
              onCallJoined={handleVoiceCallJoined}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-3 sm:p-4 h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-y-auto md:overflow-y-visible md:min-h-0">
          {/* AI Icebreaker Card (Phase 8A.1) - Simple card for students, collapsible for seniors */}
          {!icebreakerLoading && icebreaker && (
            <>
              {userRole === "student" ? (
                <Card className="mb-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="pt-3 pb-3 px-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                          💡 Conversation Starter
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {icebreaker}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="mb-2">
                  <AccordionItem value="icebreaker" className="border-none">
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline [&[data-state=open]>div]:text-blue-700">
                        <div className="flex items-center gap-2 transition-colors">
                          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          <span className="text-xs sm:text-sm font-semibold text-blue-900">
                            💡 Conversation Starter
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <CardContent className="pt-0 pb-3 px-3">
                          <p className="text-xs sm:text-sm text-gray-700">
                            {icebreaker}
                          </p>
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}

          {/* Senior AI Features - All in one collapsible accordion */}
          {userRole === "senior" && (
            <Accordion type="multiple" className="mb-2 space-y-2">
              {/* Technique Coaching Card (Phase 8B.6) */}
              {techniqueCoaching && (
                <AccordionItem value="technique" className="border-none">
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-xs sm:text-sm font-semibold text-purple-900">
                          💡 Try: {techniqueCoaching.technique}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="pt-2 pb-3">
                        <p className="text-xs text-gray-700 mb-2">
                          {techniqueCoaching.explanation}
                        </p>
                        <div className="bg-white rounded-md p-2 mb-2 border border-purple-200">
                          <p className="text-xs text-purple-600 font-medium mb-1">
                            Example:
                          </p>
                          <p className="text-xs italic text-gray-800">
                            "{techniqueCoaching.example}"
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 min-h-[44px] text-xs"
                            onClick={() =>
                              handleUseTechnique(techniqueCoaching.example)
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Use Example
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={handleDismissTechnique}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}

              {/* Multi-Level Response Selector (Phase 8B.5) */}
              {!responsesLoading && aiResponses.quickReplies.length > 0 && (
                <AccordionItem value="responses" className="border-none">
                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">
                          AI Response Assistant
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="pt-2 pb-3">
                        <ResponseLevelSelector
                          quickReplies={aiResponses.quickReplies}
                          guidedPrompts={aiResponses.guidedPrompts}
                          aiDraft={aiResponses.aiDraft}
                          onQuickReplySelect={handleQuickReply}
                          onGuidedPromptSelect={handleGuidedPrompt}
                          onDraftSelect={handleDraftSelect}
                        />
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* Sentiment Meter (Phase 8A.7) - Only for seniors - Outside accordion, always visible */}
          {userRole === "senior" && (
            <div className="mb-2">
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

          <Card className="flex-1 flex flex-col bg-gray-800 border-gray-700 min-h-[300px] md:min-h-0 max-h-full overflow-hidden">
            {/* Messages */}
            <CardContent
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scroll-smooth"
            >
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
                      className={`rounded-lg p-3 break-words ${
                        isSystemMessage
                          ? "max-w-[95%] sm:max-w-[85%] bg-blue-900/50 text-blue-200 text-center text-xs sm:text-sm"
                          : isMyMessage
                          ? "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] bg-purple-600 text-white rounded-br-none"
                          : "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] bg-gray-700 text-gray-100 rounded-bl-none"
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
            <div className="p-3 sm:p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-[48px] min-w-[48px] px-4"
                >
                  Send 📤
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Side Panel - Safety & Tips */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* Flag Button - Mobile only, compact */}
          <Button
            onClick={handleFlagContent}
            variant="outline"
            size="sm"
            className="md:hidden w-full text-red-400 border-red-400 hover:bg-red-900/20"
          >
            🚩 Flag Content
          </Button>

          {/* Safety - Desktop only */}
          <Card className="hidden md:block bg-gray-800 border-gray-700">
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

          {/* Tips - Desktop only */}
          <Card className="hidden md:block bg-blue-900/20 border-blue-700">
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
