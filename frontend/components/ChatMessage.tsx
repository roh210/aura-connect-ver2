interface ChatMessageProps {
  sender: "student" | "senior" | "system";
  text: string;
  timestamp: Date;
  senderName?: string;
}

export function ChatMessage({
  sender,
  text,
  timestamp,
  senderName,
}: ChatMessageProps) {
  const isSystem = sender === "system";
  const isStudent = sender === "student";

  return (
    <div
      className={`flex ${isStudent ? "justify-end" : "justify-start"} ${
        isSystem ? "justify-center" : ""
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isSystem
            ? "bg-blue-900/50 text-blue-200 text-center text-sm"
            : isStudent
            ? "bg-purple-600 text-white"
            : "bg-gray-700 text-white"
        }`}
      >
        {senderName && !isSystem && (
          <p className="text-xs opacity-70 mb-1 font-semibold">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
        <p className="text-xs opacity-60 mt-1">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
