import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StrategicRiskRecord } from "@/types/extended";

const KEY = ["strategic-risk-records"];

async function fetchAll(): Promise<StrategicRiskRecord[]> {
  const res = await fetch("/api/v1/strategic-risk-records");
  if (!res.ok) throw new Error("Failed to fetch strategic risk records");
  const __j = await res.json(); return Array.isArray(__j) ? __j : (__j?.data ?? []);
}

export function useStrategicRiskRecords() {
  return useQuery<StrategicRiskRecord[]>({ queryKey: KEY, queryFn: fetchAll });
}

export function useCreateStrategicRiskRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StrategicRiskRecord>) => {
      const res = await fetch("/api/v1/strategic-risk-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create strategic risk record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
