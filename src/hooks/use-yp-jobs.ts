"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { YpJob } from "@/types/extended";

const KEY = "yp-jobs";

export function useYpJobs(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: YpJob[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/yp-jobs${qs}`).then((r) => r.json()),
  });
}

export function useCreateYpJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<YpJob>) =>
      fetch("/api/v1/yp-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
