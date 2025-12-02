/**
 * Technique Card Component
 *
 * Real-time counseling technique coaching for seniors
 *
 * Shows:
 * - Technique name (Active Listening, Validation, etc.)
 * - Brief explanation of why it helps
 * - Concrete example they can use
 *
 * Actions:
 * - Use Example: Fills input with example text
 * - Dismiss: Hides card
 *
 * Phase 8B - Feature 6 - Step 6.2
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechniqueCardProps {
  technique: string;
  explanation: string;
  example: string;
  onUse: (example: string) => void;
  onDismiss: () => void;
}

export default function TechniqueCard({
  technique,
  explanation,
  example,
  onUse,
  onDismiss,
}: TechniqueCardProps) {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md animate-fade-in">
      <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-purple-900 mb-1">
                💡 Try: {technique}
              </p>
              <p className="text-xs text-gray-700">{explanation}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-md p-2 sm:p-3 mt-2 sm:mt-3 mb-2 sm:mb-3 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium mb-1">Example:</p>
          <p className="text-xs sm:text-sm italic text-gray-800">
            &quot;{example}&quot;
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-purple-600 hover:bg-purple-700 min-h-[48px] text-xs sm:text-sm"
            onClick={() => onUse(example)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Use This Example
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
