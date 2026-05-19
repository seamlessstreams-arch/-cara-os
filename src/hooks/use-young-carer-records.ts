"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { YoungCarerRecord } from "@/types/extended";

const KEY = "young-carer-records";

export function useYoungCarerRecords(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: YoungCarerRecord[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/young-carer-records${qs}`).then((r) => r.json()),
  });
}

export function useCreateYoungCarerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<YoungCarerRecord>) =>
      fetch("/api/v1/young-carer-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
