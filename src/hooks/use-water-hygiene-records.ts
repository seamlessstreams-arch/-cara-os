import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WaterHygieneRecord } from "@/types/extended";

export function useWaterHygieneRecords() {
  return useQuery<WaterHygieneRecord[]>({
    queryKey: ["water-hygiene-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/water-hygiene-records");
      if (!res.ok) throw new Error("Failed to fetch water hygiene records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateWaterHygieneRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<WaterHygieneRecord, "id">) => {
      const res = await fetch("/api/v1/water-hygiene-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create water hygiene record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water-hygiene-records"] }),
  });
}
