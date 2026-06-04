import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupervisionTrackerRecord } from "@/types/extended";

export function useSupervisionTrackerRecords() {
  return useQuery<SupervisionTrackerRecord[]>({
    queryKey: ["supervision-tracker-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/supervision-tracker-records");
      if (!res.ok) throw new Error("Failed to fetch supervision tracker records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSupervisionTrackerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SupervisionTrackerRecord, "id">) => {
      const res = await fetch("/api/v1/supervision-tracker-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supervision tracker record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supervision-tracker-records"] }),
  });
}
