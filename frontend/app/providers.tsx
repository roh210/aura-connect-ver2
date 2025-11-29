"use client";

import { ReactNode } from "react";
import DailyProvider from "@/providers/DailyProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DailyProvider>{children}</DailyProvider>
    </AuthProvider>
  );
}
