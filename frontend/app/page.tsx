"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();

  const testToast = () => {
    toast({
      title: "✅ shadcn/ui Working!",
      description: "All components are properly configured.",
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center">
            🌟 Aura Connect
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Phase 3.2 Complete - Dependencies Ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-center flex-wrap">
            <Badge variant="secondary">✅ Next.js 14</Badge>
            <Badge variant="secondary">✅ TypeScript</Badge>
            <Badge variant="secondary">✅ Tailwind CSS</Badge>
            <Badge variant="secondary">✅ shadcn/ui</Badge>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            <Badge>Socket.io Client</Badge>
            <Badge>Daily.co SDK</Badge>
            <Badge>Zustand</Badge>
            <Badge>Framer Motion</Badge>
          </div>
          <div className="pt-4">
            <Button onClick={testToast} className="w-full">
              Test Toast Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
