"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagerAlert, PatternInsight } from "@/lib/cara-incident/manager-oversight-engine";
import type { CaraRecordingReview } from "@/lib/cara-incident/cara-incident-engine";

export interface OversightData {
  summary: { open_alerts: number; urgent: number; reviews_awaiting: number; patterns: number; headline: string };
  alerts: (ManagerAlert & { child_name: string | null })[];
  patterns: (PatternInsight & { child_name: string | null })[];
  awaiting_review: (CaraRecordingReview & { child_name: string; staff_name: string })[];
  disclaimer: string;
}

const json = async (res: Response) => {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j.data ?? j;
};

export function useCaraOversight() {
  return useQuery<OversightData>({
    queryKey: ["cara-oversight"],
    queryFn: () => fetch("/api/v1/cara-manager-oversight").then(json),
    refetchInterval: 60_000,
  });
}

export function useOversightAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { action: "set_alert_status"; key: string; status: "resolved" | "dismissed" | "open" } | { action: "mark_reviewed"; review_id: string }) =>
      fetch("/api/v1/cara-manager-oversight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(json),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cara-oversight"] }),
  });
}
