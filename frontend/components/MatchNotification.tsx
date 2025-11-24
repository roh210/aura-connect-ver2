"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchNotificationProps {
  matchedWith: string;
  role: "student" | "senior";
  onJoinSession: () => void;
}

export function MatchNotification({
  matchedWith,
  role,
  onJoinSession,
}: MatchNotificationProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <Card className="border-2 border-green-500 bg-green-50 animate-in slide-in-from-top">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-green-700">Match Found!</h3>
            <p className="text-gray-700">
              You've been matched with {matchedWith}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm text-gray-600">
              {role === "student" ? "Senior" : "Student"} is ready
            </p>
          </div>

          <Button onClick={onJoinSession} size="lg" className="w-full">
            Join Session ({countdown}s) →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
