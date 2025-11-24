"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VoiceControlsProps {
  isActive: boolean;
  onToggleVoice: () => void;
  onToggleMute?: () => void;
}

export function VoiceControls({
  isActive,
  onToggleVoice,
  onToggleMute,
}: VoiceControlsProps) {
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    onToggleMute?.();
  };

  if (!isActive) {
    return (
      <Button onClick={onToggleVoice} variant="outline" className="w-full">
        📞 Start Voice Call
      </Button>
    );
  }

  return (
    <Card className="border-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Voice Call Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <span className="text-3xl">📞</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleMuteToggle}
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
          >
            {isMuted ? "🔇 Unmute" : "🔊 Mute"}
          </Button>
          <Button onClick={onToggleVoice} variant="destructive" size="sm">
            📵 End Call
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          Voice powered by Daily.co
        </p>
      </CardContent>
    </Card>
  );
}
