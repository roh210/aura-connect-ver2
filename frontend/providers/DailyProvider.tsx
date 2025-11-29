"use client";

import { DailyProvider as DailyProviderSDK } from "@daily-co/daily-react";
import { ReactNode } from "react";

interface DailyProviderProps {
  children: ReactNode;
}

/**
 * DailyProvider
 *
 * Wraps the application with Daily.co's React context provider.
 * This enables the use of Daily.co hooks throughout the component tree.
 *
 * Required for:
 * - useDaily()
 * - useLocalParticipant()
 * - useParticipantIds()
 * - useDailyEvent()
 *
 * Must be a Client Component ('use client') since Daily.co uses browser APIs.
 */
export default function DailyProvider({ children }: DailyProviderProps) {
  return <DailyProviderSDK>{children}</DailyProviderSDK>;
}
