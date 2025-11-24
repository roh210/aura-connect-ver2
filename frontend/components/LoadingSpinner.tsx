interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-16 w-16 border-2",
    lg: "h-24 w-24 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-purple-600 border-t-transparent ${sizeClasses[size]}`}
      />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
