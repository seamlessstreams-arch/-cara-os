"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TherapeuticChildImpact } from "@/types/extended";

const KEY = "therapeutic-child-impact";

export function useTherapeuticChildImpact(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: TherapeuticChildImpact[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/therapeutic-child-impact${qs}`).then((r) => r.json()),
  });
}

export function useCreateTherapeuticChildImpact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TherapeuticChildImpact>) =>
      fetch("/api/v1/therapeutic-child-impact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
