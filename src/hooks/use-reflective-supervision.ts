"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupervisionOverview, ReflectiveSupervisionRecord, StaffLite } from "@/lib/engines/supervision-engine";

export interface ReflectiveSupervisionResponse {
  overview: SupervisionOverview;
  records: ReflectiveSupervisionRecord[];
  staff: StaffLite[];
}

export function useReflectiveSupervision() {
  return useQuery<ReflectiveSupervisionResponse>({
    queryKey: ["reflective-supervision"],
    queryFn: async () => {
      const res = await fetch("/api/v1/reflective-supervision");
      if (!res.ok) throw new Error("Failed to fetch supervision");
      return (await res.json()).data;
    },
    refetchInterval: 120_000,
  });
}

export function useCreateSupervision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ReflectiveSupervisionRecord>) => {
      const res = await fetch("/api/v1/reflective-supervision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save supervision");
      }
      return (await res.json()).data as ReflectiveSupervisionRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reflective-supervision"] }),
  });
}
