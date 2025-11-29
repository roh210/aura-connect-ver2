"use client";

import { ReactNode } from "react";
import DailyProvider from "@/providers/DailyProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <DailyProvider>{children}</DailyProvider>;
}
