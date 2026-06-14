"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useCaraHistory
//
// Client hook for fetching a user's past Cara interactions. Powers the
// "My Cara History" view and timeline components.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";

export interface HistoryEntry {
  requestId: string;
  commandId: string;
  module: string;
  createdAt: string;
  output: {
    id: string;
    status: string;
    confidence: string;
    generatedTextPreview: string;
    guardrailFlagged: boolean;
  } | null;
}

export function useCaraHistory(params?: {
  userId?: string;
  days?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.userId) query.set("userId", params.userId);
  if (params?.days) query.set("days", String(params.days));
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["cara-history", params],
    queryFn: async () => {
      const res = await fetch(`/api/cara/history?${query}`);
      if (!res.ok) throw new Error("Failed to fetch Cara history");
      const data = await res.json();
      return data.data as HistoryEntry[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!params?.userId,
  });
}
