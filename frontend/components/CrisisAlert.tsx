"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Phone, MessageSquare, X } from "lucide-react";

interface CrisisAlertProps {
  severity: "critical" | "high" | "medium" | "low" | null;
  flags: string[];
  recommendedAction: string;
  onDismiss: () => void;
}

export default function CrisisAlert({
  severity,
  flags,
  recommendedAction,
  onDismiss,
}: CrisisAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (severity === "critical" || severity === "high") {
      setIsVisible(true);
    }
  }, [severity]);

  if (
    !isVisible ||
    !severity ||
    (severity !== "critical" && severity !== "high")
  ) {
    return null;
  }

  const isCritical = severity === "critical";

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4 animate-pulse ${
        isCritical ? "animate-pulse" : ""
      }`}
    >
      <div
        className={`rounded-lg shadow-2xl p-6 ${
          isCritical
            ? "bg-red-600 border-4 border-red-800"
            : "bg-orange-500 border-2 border-orange-700"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`${isCritical ? "w-8 h-8" : "w-6 h-6"} text-white`}
            />
            <h3 className="text-white font-bold text-xl">
              {isCritical ? "⚠️ CRISIS ALERT" : "⚠️ Risk Detected"}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Detected Keywords */}
        {flags.length > 0 && (
          <div className="mb-4 p-3 bg-white/10 rounded-md">
            <p className="text-white text-sm font-semibold mb-1">
              Detected Indicators:
            </p>
            <p className="text-white/90 text-sm">{flags.join(", ")}</p>
          </div>
        )}

        {/* Recommended Action */}
        <div className="mb-4 p-4 bg-white rounded-md">
          <p className="text-gray-900 font-semibold mb-2">
            Recommended Action:
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            {recommendedAction}
          </p>
        </div>

        {/* Emergency Resources */}
        <div className="space-y-3">
          <p className="text-white font-bold text-sm mb-2">
            IMMEDIATE RESOURCES:
          </p>

          {/* 988 Suicide & Crisis Lifeline */}
          <a
            href="tel:988"
            className="flex items-center gap-3 p-3 bg-white rounded-md hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-bold text-gray-900">
                988 Suicide & Crisis Lifeline
              </p>
              <p className="text-sm text-gray-600">Call or text 988 (24/7)</p>
            </div>
          </a>

          {/* Crisis Text Line */}
          <a
            href="sms:741741&body=HELLO"
            className="flex items-center gap-3 p-3 bg-white rounded-md hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-bold text-gray-900">Crisis Text Line</p>
              <p className="text-sm text-gray-600">Text HELLO to 741741</p>
            </div>
          </a>
        </div>

        {/* Professional Guidance Note */}
        <div className="mt-4 p-3 bg-white/20 rounded-md">
          <p className="text-white text-xs leading-relaxed">
            <strong>Note:</strong> You are not a licensed therapist. Your role
            is to listen with empathy and gently encourage the student to seek
            professional help. Do not attempt to provide therapy or crisis
            counseling.
          </p>
        </div>
      </div>
    </div>
  );
}
