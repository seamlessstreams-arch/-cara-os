import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UtilityMonitoringRecord } from "@/types/extended";

export function useUtilityMonitoringRecords() {
  return useQuery<UtilityMonitoringRecord[]>({
    queryKey: ["utility-monitoring-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/utility-monitoring-records");
      if (!res.ok) throw new Error("Failed to fetch utility monitoring records");
      return res.json();
    },
  });
}

export function useCreateUtilityMonitoringRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<UtilityMonitoringRecord, "id">) => {
      const res = await fetch("/api/v1/utility-monitoring-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create utility monitoring record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["utility-monitoring-records"] }),
  });
}
