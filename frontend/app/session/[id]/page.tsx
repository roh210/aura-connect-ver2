"use client";

import { useState, useRef, useEffect } from "react";
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

interface Message {
  id: string;
  sender: "student" | "senior" | "system";
  text: string;
  timestamp: Date;
}

export default function SessionPage({ params }: { params: { id: string } }) {
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
  const { toast } = useToast();

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "student", // In real app, determine from user role
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Simulate senior response (demo)
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: "senior",
        text: "I hear you. That sounds challenging. Tell me more about how you're feeling.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 2000);
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
    toast({
      title: "✅ Session ended",
      description: "Thank you for using Aura Connect",
    });
    // TODO: Navigate back to dashboard
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
          <Card className="flex-1 flex flex-col bg-gray-800 border-gray-700">
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "student"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "system"
                        ? "bg-blue-900/50 text-blue-200 text-center mx-auto text-sm"
                        : message.sender === "student"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
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
          {/* Voice Controls */}
          {isVoiceActive && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">
                  🎙️ Voice Call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-center py-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                      <span className="text-3xl">📞</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant={isMuted ? "destructive" : "outline"}
                    className="flex-1"
                    size="sm"
                  >
                    {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                  </Button>
                  <Button
                    onClick={handleToggleVoice}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    📵 Hang Up
                  </Button>
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
