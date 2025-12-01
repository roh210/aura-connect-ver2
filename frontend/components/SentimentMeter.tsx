"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentMeterProps {
  messages: Array<{ sender: "student" | "senior"; text: string }>;
  userRole: "student" | "senior";
}

export default function SentimentMeter({
  messages,
  userRole,
}: SentimentMeterProps) {
  const [sentiment, setSentiment] = useState<{
    score: number; // -10 to +10
    trend: "improving" | "stable" | "declining" | "unknown";
    confidence: number; // 0-1
    indicators: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const lastProcessedCount = useRef(0);
  const isFetching = useRef(false);

  // Only show for seniors
  if (userRole !== "senior") {
    return null;
  }

  // Fetch sentiment analysis when student messages change
  useEffect(() => {
    const fetchSentiment = async () => {
      // Only check when message count changes
      if (messages.length === lastProcessedCount.current) return;

      // Need at least 2 messages to analyze sentiment
      if (messages.length < 2) {
        lastProcessedCount.current = messages.length;
        return;
      }

      // Extract only student messages
      const studentMessages = messages
        .filter((msg) => msg.sender === "student")
        .map((msg) => msg.text);

      // Need at least 1 student message
      if (studentMessages.length === 0) {
        lastProcessedCount.current = messages.length;
        return;
      }

      // Prevent concurrent fetches
      if (isFetching.current) return;

      try {
        isFetching.current = true;
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/sentiment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: studentMessages }),
          }
        );

        if (!response.ok) {
          console.error("Sentiment analysis failed:", response.statusText);
          return;
        }

        const result = await response.json();
        setSentiment(result);
      } catch (error) {
        console.error("Sentiment analysis error:", error);
      } finally {
        setLoading(false);
        isFetching.current = false;
        lastProcessedCount.current = messages.length;
      }
    };

    // Debounce: Wait 500ms before fetching
    const timeoutId = setTimeout(fetchSentiment, 500);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Don't show anything if no sentiment data yet
  if (!sentiment && !loading) {
    return null;
  }

  // Calculate color and position based on score (-10 to +10)
  const getColor = (score: number) => {
    if (score >= 6) return "bg-green-500";
    if (score >= 3) return "bg-green-400";
    if (score >= 1) return "bg-blue-400";
    if (score >= -2) return "bg-gray-400";
    if (score >= -5) return "bg-orange-400";
    if (score >= -8) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLabel = (score: number) => {
    if (score >= 6) return "Very Positive";
    if (score >= 3) return "Positive";
    if (score >= 1) return "Slightly Positive";
    if (score >= -2) return "Neutral";
    if (score >= -5) return "Slightly Negative";
    if (score >= -8) return "Negative";
    return "Very Negative";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving")
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "declining")
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendText = (trend: string) => {
    if (trend === "improving") return "Improving";
    if (trend === "declining") return "Declining";
    if (trend === "stable") return "Stable";
    return "Unknown";
  };

  // Convert score (-10 to +10) to percentage (0 to 100)
  const scoreToPercent = sentiment ? ((sentiment.score + 10) / 20) * 100 : 50;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📊 Student Sentiment
            {loading && (
              <span className="text-xs text-gray-500 animate-pulse">
                Analyzing...
              </span>
            )}
          </h3>
          {sentiment && (
            <p className="text-xs text-gray-600 mt-1">
              {getLabel(sentiment.score)}
            </p>
          )}
        </div>

        {sentiment && (
          <div className="flex items-center gap-1 text-xs text-gray-700">
            {getTrendIcon(sentiment.trend)}
            <span>{getTrendText(sentiment.trend)}</span>
          </div>
        )}
      </div>

      {/* Sentiment Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        {/* Gradient background */}
        <div className="absolute inset-0 flex" style={{ width: "100%" }}>
          <div className="w-1/7 bg-red-500" />
          <div className="w-1/7 bg-orange-500" />
          <div className="w-1/7 bg-orange-400" />
          <div className="w-1/7 bg-gray-400" />
          <div className="w-1/7 bg-blue-400" />
          <div className="w-1/7 bg-green-400" />
          <div className="w-1/7 bg-green-500" />
        </div>

        {/* Score indicator */}
        {sentiment && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-500"
            style={{ left: `${scoreToPercent}%` }}
          />
        )}
      </div>

      {/* Score labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>-10</span>
        <span>0</span>
        <span>+10</span>
      </div>

      {/* Confidence & Indicators */}
      {sentiment && sentiment.indicators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <p className="text-xs text-gray-600 mb-1">
            Key indicators:{" "}
            <span className="font-medium">
              {sentiment.indicators.slice(0, 3).join(", ")}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Confidence: {Math.round(sentiment.confidence * 100)}%
          </p>
        </div>
      )}

      {/* Helper text */}
      <div className="mt-3 p-2 bg-blue-50 rounded-md">
        <p className="text-xs text-gray-700 leading-relaxed">
          💡 <strong>Tip:</strong> Use this to gauge the student&apos;s
          emotional state and adjust your responses accordingly.
        </p>
      </div>
    </div>
  );
}
