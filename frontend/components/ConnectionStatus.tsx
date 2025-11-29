import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export default function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant={isConnected ? "default" : "destructive"}>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs font-medium">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </Badge>
    </div>
  );
}
