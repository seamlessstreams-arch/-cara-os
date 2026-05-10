"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TransportRA } from "@/types/extended";

const KEY = "transport-risk-assessments";

export function useTransportRAs(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: TransportRA[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/transport-risk-assessments${qs}`).then((r) => r.json()),
  });
}

export function useCreateTransportRA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransportRA>) =>
      fetch("/api/v1/transport-risk-assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
