"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useCaraActivity
//
// Client hook for fetching Cara activity statistics. Powers dashboard widgets
// and the management Cara page.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";

export interface CaraActivityStats {
  totalRequests: number;
  totalOutputs: number;
  approvedOutputs: number;
  rejectedOutputs: number;
  committedOutputs: number;
  pendingOutputs: number;
  transcriptions: number;
  tasksCreated: number;
  topCommands: Array<{ commandId: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  approvalRate: number;
  avgConfidence: string;
}

export function useCaraActivity(params?: { homeId?: string; days?: number }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.days) query.set("days", String(params.days));

  return useQuery({
    queryKey: ["cara-activity", params],
    queryFn: async () => {
      const res = await fetch(`/api/cara/activity?${query}`);
      if (!res.ok) throw new Error("Failed to fetch Cara activity");
      const data = await res.json();
      return data.data as CaraActivityStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
