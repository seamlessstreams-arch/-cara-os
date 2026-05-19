"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CivicRecord } from "@/types/extended";

const KEY = "civic-records";

export function useCivicRecords(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: CivicRecord[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/civic-records${qs}`).then((r) => r.json()),
  });
}

export function useCreateCivicRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CivicRecord>) =>
      fetch("/api/v1/civic-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
