"use client";

import { useState, useEffect } from "react";
import {
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useDailyEvent,
} from "@daily-co/daily-react";
import DailyIframe from "@daily-co/daily-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Users, Loader2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceCallProps {
  roomUrl: string;
  token: string;
  userName: string;
  onCallEnd?: () => void;
}

type CallState = "idle" | "joining" | "joined" | "left" | "error";

/**
 * VoiceCall Component
 *
 * Provides real-time voice calling functionality using Daily.co WebRTC.
 *
 * Features:
 * - Auto-join call on mount
 * - Mute/unmute microphone
 * - Leave call
 * - Call timer
 * - Participant count
 * - Connection status
 * - Error handling
 *
 * Daily.co Hooks Used:
 * - useDaily: Access call object and join/leave functions
 * - useLocalParticipant: Get local user's state (audio, video)
 * - useParticipantIds: Count participants in call
 * - useDailyEvent: Listen for call events
 */
export default function VoiceCall({
  roomUrl,
  token,
  userName,
  onCallEnd,
}: VoiceCallProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  const { toast } = useToast();
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });

  /**
   * Auto-join call when component mounts
   * Only attempt once to avoid infinite loops
   */
  useEffect(() => {
    if (
      roomUrl &&
      token &&
      !hasAttemptedJoin &&
      callState === "idle" &&
      daily
    ) {
      handleJoinCall();
      setHasAttemptedJoin(true);
    }
  }, [roomUrl, token, hasAttemptedJoin, callState, daily]);

  /**
   * Call timer
   * Increments every second while call is active
   */
  useEffect(() => {
    if (callState === "joined") {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [callState]);

  /**
   * Join Daily.co voice call
   */
  const handleJoinCall = async () => {
    if (!daily) {
      console.error("❌ Daily call object not initialized");
      return;
    }

    // Validate roomUrl and token
    if (!roomUrl || !token) {
      console.error("❌ Missing roomUrl or token", { roomUrl, token });
      toast({
        title: "❌ Configuration error",
        description: "Voice call data is missing. Please try matching again.",
        variant: "destructive",
      });
      setCallState("error");
      return;
    }

    try {
      console.log("🔵 Joining Daily.co call...", {
        roomUrl,
        hasToken: !!token,
        userName,
      });

      setCallState("joining");

      await daily.join({
        url: roomUrl,
        token: token,
      });

      console.log("✅ Successfully joined Daily.co call");

      toast({
        title: "📞 Joined call",
        description: "Voice connection established",
      });

      setCallState("joined");
    } catch (err) {
      console.error("❌ Failed to join call:", err);

      toast({
        title: "❌ Failed to join call",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });

      setCallState("error");
    }
  };

  /**
   * Leave Daily.co voice call
   */
  const handleLeaveCall = async () => {
    if (!daily) return;

    try {
      await daily.leave();

      setCallState("left");

      toast({
        title: "📞 Call ended",
        description: "You left the voice call",
      });

      onCallEnd?.();
    } catch (err) {
      console.error("Failed to leave call:", err);
      onCallEnd?.();
    }
  };

  /**
   * Toggle microphone mute state
   */
  const toggleMute = () => {
    if (daily) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      daily.setLocalAudio(!newMutedState); // Audio ON when NOT muted

      toast({
        title: newMutedState ? "🔇 Muted" : "🎤 Unmuted",
        description: newMutedState
          ? "Your microphone is now off"
          : "Your microphone is now on",
      });
    }
  };

  /**
   * Daily.co Event Listeners
   */

  // Successfully joined meeting
  useDailyEvent("joined-meeting", () => {
    console.log("✅ Successfully joined Daily.co voice call");
    setCallState("joined");
  });

  // Left meeting
  useDailyEvent("left-meeting", () => {
    console.log("📞 Left Daily.co voice call");
    setCallState("left");
    onCallEnd?.();
  });

  // Participant left
  useDailyEvent("participant-left", (event) => {
    console.log("👤 Participant left call:", event?.participant?.user_name);

    // If partner left, show notification
    if (
      event?.participant?.user_name &&
      event.participant.user_name !== userName
    ) {
      toast({
        title: "👋 Partner left",
        description: `${event.participant.user_name} has left the call`,
      });
    }
  });

  // Error occurred
  useDailyEvent("error", (event) => {
    console.error("❌ Daily.co error:", event);

    toast({
      title: "⚠️ Connection error",
      description: "Trying to reconnect...",
      variant: "destructive",
    });

    setCallState("error");

    // Retry once after 3 seconds
    setTimeout(() => {
      if (callState !== "joined") {
        handleJoinCall();
      }
    }, 3000);
  });

  /**
   * Format call duration
   * @param seconds - Total seconds elapsed
   * @returns Formatted string MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * Get status color based on call state
   */
  const getStatusColor = () => {
    switch (callState) {
      case "joined":
        return "text-green-600";
      case "joining":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  /**
   * Get status text based on call state
   */
  const getStatusText = () => {
    switch (callState) {
      case "joined":
        return "Connected";
      case "joining":
        return "Connecting...";
      case "error":
        return "Connection Error";
      case "left":
        return "Call Ended";
      default:
        return "Idle";
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Voice Call
            </CardTitle>
            <CardDescription className={getStatusColor()}>
              {getStatusText()}
            </CardDescription>
          </div>

          {/* Call Duration */}
          {callState === "joined" && (
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">
                {formatDuration(callDuration)}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Participant Count */}
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {remoteParticipantIds.length + 1} in call
          </span>
          {remoteParticipantIds.length === 0 && callState === "joined" && (
            <span className="ml-auto text-xs text-muted-foreground">
              Waiting for partner...
            </span>
          )}
        </div>

        {/* Connection Status */}
        {callState === "joining" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting to voice call...</span>
          </div>
        )}

        {/* Error Status */}
        {callState === "error" && (
          <div className="flex items-center gap-2 text-sm px-4 py-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <span className="text-red-600 dark:text-red-400">
              Failed to connect. Retrying...
            </span>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex gap-2">
          {/* Mute/Unmute Button */}
          <Button
            variant={isMuted ? "destructive" : "default"}
            onClick={toggleMute}
            disabled={callState !== "joined"}
            className="flex-1"
          >
            {isMuted ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Mute
              </>
            )}
          </Button>

          {/* Leave Call Button */}
          <Button
            variant="outline"
            onClick={handleLeaveCall}
            disabled={callState !== "joined" && callState !== "joining"}
            className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Leave Call
          </Button>
        </div>

        {/* Audio Status Indicator */}
        {callState === "joined" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 py-2 bg-secondary/50 rounded">
            {isMuted ? (
              <>
                <MicOff className="h-3 w-3" />
                <span>You are muted</span>
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 text-green-600" />
                <span>Microphone active</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
