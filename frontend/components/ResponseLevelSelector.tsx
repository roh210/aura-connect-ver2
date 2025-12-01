/**
 * Response Level Selector Component
 *
 * Multi-level AI assistance for seniors:
 * - Tab 1: Quick Replies (click to send immediately)
 * - Tab 2: Guided Prompts (click to fill input, senior completes)
 * - Tab 3: AI Draft (click to fill input, senior can edit)
 *
 * Phase 8B - Feature 5 - Step 5.2
 */

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Edit3, FileText, Sparkles } from "lucide-react";

interface ResponseLevelSelectorProps {
  quickReplies: string[];
  guidedPrompts: string[];
  aiDraft: string;
  onQuickReplySelect: (reply: string) => void; // Sends immediately
  onGuidedPromptSelect: (prompt: string) => void; // Fills input for completion
  onDraftSelect: (draft: string) => void; // Fills input for editing
}

export default function ResponseLevelSelector({
  quickReplies,
  guidedPrompts,
  aiDraft,
  onQuickReplySelect,
  onGuidedPromptSelect,
  onDraftSelect,
}: ResponseLevelSelectorProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">AI Response Assistant</h3>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/50">
          <TabsTrigger value="quick" className="text-xs sm:text-sm">
            <Zap className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Quick</span>
          </TabsTrigger>
          <TabsTrigger value="guided" className="text-xs sm:text-sm">
            <Edit3 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Guided</span>
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm">
            <FileText className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Draft</span>
          </TabsTrigger>
        </TabsList>

        {/* Quick Replies Tab */}
        <TabsContent value="quick" className="space-y-2 mt-3">
          <p className="text-xs text-gray-600 mb-2">
            Click to send immediately
          </p>
          {quickReplies.map((reply, index) => (
            <Button
              key={index}
              onClick={() => onQuickReplySelect(reply)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-purple-100 hover:border-purple-300 transition-all"
            >
              <Zap className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
              <span className="text-sm">{reply}</span>
            </Button>
          ))}
        </TabsContent>

        {/* Guided Prompts Tab */}
        <TabsContent value="guided" className="space-y-2 mt-3">
          <p className="text-xs text-gray-600 mb-2">
            Click to start, then complete the sentence
          </p>
          {guidedPrompts.map((prompt, index) => (
            <Button
              key={index}
              onClick={() => onGuidedPromptSelect(prompt)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              <Edit3 className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="text-sm">{prompt}</span>
            </Button>
          ))}
        </TabsContent>

        {/* AI Draft Tab */}
        <TabsContent value="draft" className="mt-3">
          <p className="text-xs text-gray-600 mb-2">
            Click to edit before sending
          </p>
          <Button
            onClick={() => onDraftSelect(aiDraft)}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-green-100 hover:border-green-300 transition-all"
          >
            <FileText className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed">{aiDraft}</span>
          </Button>
        </TabsContent>
      </Tabs>

      {/* Footer Tip */}
      <div className="mt-3 pt-3 border-t border-purple-200">
        <p className="text-xs text-gray-500 italic">
          💡 Tip: Quick for efficiency, Guided for personalization, Draft for
          full control
        </p>
      </div>
    </Card>
  );
}
