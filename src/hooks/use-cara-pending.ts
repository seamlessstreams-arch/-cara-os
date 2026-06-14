"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useCaraPending
//
// Client hook for fetching Cara outputs awaiting human review. Powers the
// approval queue on the Cara review page.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";

export interface PendingOutput {
  id: string;
  requestId: string;
  commandId: string;
  generatedText: string;
  confidence: string;
  status: string;
  userId: string;
  createdAt: string;
  guardrailFlagged: boolean;
  guardrailSummary: string | null;
}

export function useCaraPending(params?: {
  actorUserId?: string;
  actorRole?: string;
  homeId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params?.actorRole) query.set("actorRole", params.actorRole);
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["cara-pending", params],
    queryFn: async () => {
      const res = await fetch(`/api/cara/pending?${query}`);
      if (!res.ok) throw new Error("Failed to fetch pending Cara outputs");
      const data = await res.json();
      return data.data as PendingOutput[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — approval queue should be fresh
    enabled: !!params?.actorUserId,
  });
}
