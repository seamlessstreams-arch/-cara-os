import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceImprovementRecord } from "@/types/extended";

export function useServiceImprovementRecords() {
  return useQuery<ServiceImprovementRecord[]>({
    queryKey: ["service-improvement-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/service-improvement-records");
      if (!res.ok) throw new Error("Failed to fetch service improvement records");
      return res.json();
    },
  });
}

export function useCreateServiceImprovementRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ServiceImprovementRecord, "id">) => {
      const res = await fetch("/api/v1/service-improvement-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create service improvement record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-improvement-records"] }),
  });
}
