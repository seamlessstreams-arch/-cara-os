import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RseTrackerRecord } from "@/types/extended";

export function useRseTrackerRecords(childId?: string) {
  return useQuery<RseTrackerRecord[]>({
    queryKey: ["rse-tracker-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/rse-tracker-records?child_id=${childId}`
        : "/api/v1/rse-tracker-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch RSE tracker records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateRseTrackerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RseTrackerRecord>) => {
      const res = await fetch("/api/v1/rse-tracker-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create RSE tracker record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rse-tracker-records"] }),
  });
}
