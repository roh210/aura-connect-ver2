"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface Message {
  sender: "student" | "senior";
  text: string;
}

interface AISuggestionsPanelProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
  userRole: "student" | "senior";
}

export default function AISuggestionsPanel({
  messages,
  onSuggestionClick,
  userRole,
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedLength = useRef(0);
  const isFetching = useRef(false);

  // Only show suggestions to seniors
  if (userRole !== "senior") {
    return null;
  }

  // Fetch suggestions when messages change
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Need at least 2 messages to generate suggestions
      if (messages.length < 2) {
        return;
      }

      // Check if there are new messages since last fetch
      if (messages.length === lastProcessedLength.current) {
        return;
      }

      // Find the last message (could be from student or senior)
      const lastMessage = messages[messages.length - 1];

      // Only fetch if last message was from student
      if (lastMessage.sender !== "student") {
        // Update processed length to avoid re-checking
        lastProcessedLength.current = messages.length;
        return;
      }

      // Prevent concurrent fetches
      if (isFetching.current) {
        return;
      }

      try {
        isFetching.current = true;
        lastProcessedLength.current = messages.length;
        setLoading(true);
        setError(null);

        // Get last 5 messages for context
        const recentMessages = messages.slice(-5).map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        }));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggestions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recentMessages }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Failed to fetch AI suggestions:", err);
        setError("Could not load suggestions");
        // Graceful degradation: Show generic suggestions
        setSuggestions([
          "I hear you. Tell me more about that.",
          "That sounds really challenging. How are you coping?",
          "Thanks for sharing. What would be most helpful right now?",
        ]);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    // Small debounce to batch rapid re-renders, but fast response
    const timeoutId = setTimeout(fetchSuggestions, 300);

    return () => clearTimeout(timeoutId);
  }, [messages]); // Need full messages array to check last sender

  // Don't show panel if no suggestions
  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-semibold text-purple-900">
            💬 AI Suggestions
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating suggestions...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left h-auto py-2 px-3 hover:bg-purple-100 hover:border-purple-300 transition-colors"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <span className="text-sm text-gray-700 whitespace-normal">
                  {suggestion}
                </span>
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Click a suggestion to send it, or type your own message
        </p>
      </CardContent>
    </Card>
  );
}
