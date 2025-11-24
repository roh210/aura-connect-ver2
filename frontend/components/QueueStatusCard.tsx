import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface QueueStatusCardProps {
  position: number;
  totalInQueue: number;
  estimatedWaitMinutes: number;
  activeSeniors: number;
}

export function QueueStatusCard({
  position,
  totalInQueue,
  estimatedWaitMinutes,
  activeSeniors,
}: QueueStatusCardProps) {
  const progressPercent = ((totalInQueue - position) / totalInQueue) * 100;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg">⏳ Queue Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Your Position</span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            #{position}
          </Badge>
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {estimatedWaitMinutes} min
            </div>
            <div className="text-xs text-gray-600">Est. Wait</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {activeSeniors}
            </div>
            <div className="text-xs text-gray-600">Seniors Online</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-xl">💡</span>
          <p className="text-xs text-gray-700">
            Hang tight! You'll be connected soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
